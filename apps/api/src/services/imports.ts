import { parse } from 'csv-parse/sync';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import {
  CurrencyCode,
  TransactionType,
  TransactionDirection,
  CategoryKey,
  ReviewStatus,
  safeParseDecimal
} from '@cashflow-mate/shared';
import { AIService } from './ai';

export interface ColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  referenceColumn?: string;
  currencyColumn?: string;
  typeColumn?: string;
  dateFormat?: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  originalData: Record<string, string>;
  parsedDate: string | null;
  parsedDescription: string;
  parsedAmount: number | null;
  direction: TransactionDirection;
  type: TransactionType;
  category: CategoryKey;
  reference: string | null;
  currency: CurrencyCode;
  isDuplicate: boolean;
  duplicateReason?: string;
  isValid: boolean;
  validationError?: string;
}

export interface ImportPreviewResult {
  headers: string[];
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  detectedMapping: ColumnMapping;
  previewRows: ImportPreviewRow[];
}

export class ImportService {
  /**
   * Parses CSV content and auto-detects column mapping and sample rows.
   */
  static parseAndPreview(
    businessId: string,
    csvContent: string,
    customMapping?: ColumnMapping,
    defaultCurrency: CurrencyCode = 'USD'
  ): ImportPreviewResult {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    }) as Record<string, string>[];

    if (records.length === 0) {
      throw new Error('The uploaded CSV file contains no data rows.');
    }

    const headers = Object.keys(records[0]);
    const mapping = customMapping || this.autoDetectMapping(headers);

    const db = getDb();
    // Prepare duplicate check statement
    const dupCheckStmt = db.prepare(`
      SELECT id FROM transactions
      WHERE business_id = ?
        AND (
          (original_reference IS NOT NULL AND original_reference = ?)
          OR (transaction_date = ? AND amount = ? AND description = ?)
        )
      LIMIT 1
    `);

    const previewRows: ImportPreviewRow[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    const seenInFile = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;

      // Extract raw values
      const rawDate = mapping.dateColumn ? row[mapping.dateColumn] : '';
      const rawDesc = mapping.descriptionColumn ? row[mapping.descriptionColumn] : '';
      const rawRef = mapping.referenceColumn ? row[mapping.referenceColumn] : null;
      const rawCurr = (mapping.currencyColumn ? row[mapping.currencyColumn] : defaultCurrency) as CurrencyCode;

      // Date parsing
      const parsedDate = this.normalizeDate(rawDate, mapping.dateFormat);

      // Amount & direction calculation
      let parsedAmount: number | null = null;
      let direction: TransactionDirection = 'outflow';
      let type: TransactionType = 'business_expense';

      if (mapping.debitColumn && mapping.creditColumn && (row[mapping.debitColumn] || row[mapping.creditColumn])) {
        const rawDebit = safeParseDecimal(row[mapping.debitColumn]);
        const rawCredit = safeParseDecimal(row[mapping.creditColumn]);

        if (rawCredit && rawCredit > 0) {
          parsedAmount = rawCredit;
          direction = 'inflow';
          type = 'business_income';
        } else if (rawDebit && rawDebit > 0) {
          parsedAmount = rawDebit;
          direction = 'outflow';
          type = 'business_expense';
        }
      } else if (mapping.amountColumn && row[mapping.amountColumn]) {
        const val = safeParseDecimal(row[mapping.amountColumn]);
        if (val !== null) {
          if (val < 0) {
            parsedAmount = Math.abs(val);
            direction = 'outflow';
            type = 'business_expense';
          } else {
            parsedAmount = val;
            direction = 'inflow';
            type = 'business_income';
          }
        }
      }

      // Validation check
      let isValid = true;
      let validationError: string | undefined = undefined;

      if (!parsedDate) {
        isValid = false;
        validationError = `Invalid date format: "${rawDate}"`;
      } else if (parsedAmount === null || parsedAmount <= 0) {
        isValid = false;
        validationError = `Invalid or missing monetary amount.`;
      } else if (!rawDesc || rawDesc.trim().length === 0) {
        isValid = false;
        validationError = `Missing transaction description.`;
      }

      // Duplicate detection
      let isDuplicate = false;
      let duplicateReason: string | undefined = undefined;

      if (isValid && parsedAmount !== null && parsedDate) {
        // Intra-file check
        const fileKey = `${rawRef || ''}_${parsedDate}_${parsedAmount}_${rawDesc}`;
        if (seenInFile.has(fileKey)) {
          isDuplicate = true;
          duplicateReason = 'Identical row appears multiple times in this uploaded file.';
        } else {
          seenInFile.add(fileKey);

          // Database check
          const existing = dupCheckStmt.get(
            businessId,
            rawRef || null,
            parsedDate,
            parsedAmount,
            rawDesc
          ) as { id: string } | undefined;

          if (existing) {
            isDuplicate = true;
            duplicateReason = 'A transaction with matching reference/date and amount already exists in your records.';
          }
        }
      }

      // Propose category based on heuristics or description
      const heuristic = AIService.heuristicCategorize(rawDesc, parsedAmount || 0, direction);

      if (isValid) {
        if (isDuplicate) duplicateCount++;
        else validCount++;
      } else {
        invalidCount++;
      }

      previewRows.push({
        rowNumber: rowNum,
        originalData: row,
        parsedDate,
        parsedDescription: rawDesc || 'Untitled Transaction',
        parsedAmount: parsedAmount !== null ? Math.abs(parsedAmount) : null,
        direction: heuristic.direction || direction,
        type: heuristic.transactionType || type,
        category: heuristic.category,
        reference: rawRef,
        currency: (['USD', 'ZWG', 'ZAR'].includes(rawCurr) ? rawCurr : defaultCurrency) as CurrencyCode,
        isDuplicate,
        duplicateReason,
        isValid,
        validationError
      });
    }

    return {
      headers,
      totalRows: records.length,
      validRows: validCount,
      duplicateRows: duplicateCount,
      invalidRows: invalidCount,
      detectedMapping: mapping,
      previewRows
    };
  }

  /**
   * Commits the reviewed rows into the database atomically.
   */
  static commitImport(
    businessId: string,
    filename: string,
    rows: ImportPreviewRow[],
    skipDuplicates: boolean = true
  ) {
    const db = getDb();
    const importJobId = randomUUID();
    const now = new Date().toISOString();

    const insertJobStmt = db.prepare(`
      INSERT INTO import_jobs (
        id, business_id, filename, total_rows, imported_rows, skipped_rows, duplicate_rows, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTxStmt = db.prepare(`
      INSERT INTO transactions (
        id, business_id, import_job_id, transaction_date, description, original_reference,
        amount, currency, direction, type, category, review_status, ai_confidence, ai_reasoning, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let importedCount = 0;
    let skippedCount = 0;
    let duplicateSkipped = 0;

    // Execute atomic batch
    db.exec('BEGIN TRANSACTION;');
    try {
      for (const row of rows) {
        if (!row.isValid || row.parsedAmount === null || !row.parsedDate) {
          skippedCount++;
          continue;
        }

        if (row.isDuplicate && skipDuplicates) {
          duplicateSkipped++;
          continue;
        }

        const txId = randomUUID();
        const reviewStatus: ReviewStatus = row.category === 'uncategorized' ? 'pending_review' : 'confirmed';

        insertTxStmt.run(
          txId,
          businessId,
          importJobId,
          row.parsedDate,
          row.parsedDescription,
          row.reference || null,
          row.parsedAmount,
          row.currency,
          row.direction,
          row.type,
          row.category,
          reviewStatus,
          0.85,
          'Imported via CSV mapping engine',
          now,
          now
        );

        importedCount++;
      }

      insertJobStmt.run(
        importJobId,
        businessId,
        filename,
        rows.length,
        importedCount,
        skippedCount,
        duplicateSkipped,
        'completed',
        now
      );

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return {
      importJobId,
      totalRows: rows.length,
      importedCount,
      skippedCount,
      duplicateSkipped
    };
  }

  private static autoDetectMapping(headers: string[]): ColumnMapping {
    const lower = headers.map((h) => h.toLowerCase().trim());

    const findMatch = (candidates: string[]) => {
      for (const c of candidates) {
        const idx = lower.findIndex((h) => h.includes(c));
        if (idx !== -1) return headers[idx];
      }
      return undefined;
    };

    return {
      dateColumn: findMatch(['date', 'time', 'timestamp', 'txn_date']) || headers[0] || '',
      descriptionColumn: findMatch(['desc', 'narrative', 'details', 'particulars', 'reference', 'memo', 'message']) || headers[1] || '',
      amountColumn: findMatch(['amount', 'sum', 'total', 'value']),
      debitColumn: findMatch(['debit', 'out', 'paid_out', 'withdrawal', 'dr']),
      creditColumn: findMatch(['credit', 'in', 'received', 'deposit', 'cr']),
      referenceColumn: findMatch(['ref', 'txn_id', 'id', 'receipt', 'code', 'token']),
      currencyColumn: findMatch(['currency', 'curr'])
    };
  }

  private static normalizeDate(raw: string, formatHint?: string): string | null {
    if (!raw) return null;
    const clean = raw.trim();

    // ISO format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      return clean.substring(0, 10);
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = clean.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
    if (ddmmyyyy) {
      const part1 = parseInt(ddmmyyyy[1], 10);
      const part2 = parseInt(ddmmyyyy[2], 10);
      const year = ddmmyyyy[3];

      if (formatHint === 'MM/DD/YYYY' || (part1 <= 12 && part2 > 12)) {
        // MM/DD/YYYY
        return `${year}-${String(part1).padStart(2, '0')}-${String(part2).padStart(2, '0')}`;
      }
      // Default: DD/MM/YYYY
      return `${year}-${String(part2).padStart(2, '0')}-${String(part1).padStart(2, '0')}`;
    }

    // Try Date.parse as fallback
    const timestamp = Date.parse(clean);
    if (!isNaN(timestamp)) {
      const d = new Date(timestamp);
      return d.toISOString().substring(0, 10);
    }

    return null;
  }
}
