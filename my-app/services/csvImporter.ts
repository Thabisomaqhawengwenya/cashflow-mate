import {
  CurrencyCode,
  MobileTransaction,
  categoryClassification,
  roundMoney,
} from './storage';

export interface ParsedCsvRow {
  raw: Record<string, string>;
  date: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  direction: 'inflow' | 'outflow';
  category: string;
  reference?: string;
  isDuplicate: boolean;
  fingerprint: string;
}

export interface CsvImportResult {
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateCount: number;
  newRows: number;
  rows: ParsedCsvRow[];
  detectedColumns: string[];
}

/**
 * Generate a canonical fingerprint matching packages/shared/src/importers/fingerprint.ts
 * Uses date + rounded absolute amount + normalized description.
 */
export function generateTransactionFingerprint(
  date: string,
  amount: number,
  description: string,
  currency: string = 'USD'
): string {
  const normDate = date.trim();
  const normAmount = Math.abs(roundMoney(amount)).toFixed(2);
  const normDesc = description
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
  return `${normDate}_${normAmount}_${currency.toUpperCase()}_${normDesc}`;
}

/**
 * Parse standard CSV / TSV text handling quotes, multiline values, and delimiters.
 */
export function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM
  if (!clean) return { headers: [], rows: [] };

  // Detect delimiter: comma, semicolon, or tab
  const firstLine = clean.split(/\r?\n/)[0];
  let delimiter = ',';
  if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  } else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = '\t';
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // Skip \n in \r\n
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length < 2) return { headers: [], rows: [] };

  const rawHeaders = lines[0];
  const headers = rawHeaders.map((h) => h.toLowerCase().trim().replace(/^["']|["']$/g, ''));

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const line = lines[r];
    const record: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = (line[c] || '').replace(/^["']|["']$/g, '').trim();
    }
    rows.push(record);
  }

  return { headers, rows };
}

/**
 * Heuristic Zimbabwean transaction categorizer based on merchant and keywords.
 */
export function categorizeDescription(description: string): string {
  const d = description.toLowerCase();

  if (d.includes('ecocash') && (d.includes('fee') || d.includes('charge') || d.includes('tariff'))) {
    return 'mobile_money_fees';
  }
  if (d.includes('bank charge') || d.includes('ledger fee') || d.includes('monthly maintenance') || d.includes('pos charge')) {
    return 'mobile_money_fees';
  }
  if (d.includes('zetdc') || d.includes('zesa') || d.includes('electricity') || d.includes('power token')) {
    return 'utilities_electricity';
  }
  if (d.includes('bakers') || d.includes('bread') || d.includes('probrands') || d.includes('national foods') || d.includes('wholesale') || d.includes('stock') || d.includes('inventory') || d.includes('crates')) {
    return 'stock_purchase';
  }
  if (d.includes('kombi') || d.includes('fuel') || d.includes('diesel') || d.includes('petrol') || d.includes('transport') || d.includes('haulage') || d.includes('delivery')) {
    return 'transport_fuel';
  }
  if (d.includes('rent') || d.includes('stall') || d.includes('council') || d.includes('stand')) {
    return 'rent';
  }
  if (d.includes('drawing') || d.includes('personal') || d.includes('home') || d.includes('groceries home') || d.includes('school fees')) {
    return 'owner_drawings';
  }
  if (d.includes('mukando') || d.includes('round') || d.includes('chama')) {
    return 'loan_in';
  }
  if (d.includes('customer') || d.includes('cash sales') || d.includes('merchant payment') || d.includes('counter sale') || d.includes('till')) {
    return 'sales_goods';
  }

  return 'uncategorized';
}

/**
 * Parse date from various formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, DD.MM.YYYY).
 * Returns null for invalid dates so callers can reject the row instead of silently
 * back-dating it to "today".
 */
export function normalizeDate(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidYmd(trimmed) ? trimmed : null;
  }

  const numeric = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (numeric) {
    const first = parseInt(numeric[1], 10);
    const second = parseInt(numeric[2], 10);
    const year = numeric[3];

    let day: number;
    let month: number;
    if (first > 12 && second <= 12) {
      // 25/10/2026 -> DD/MM
      day = first;
      month = second;
    } else if (second > 12 && first <= 12) {
      // 10/25/2026 -> MM/DD
      day = second;
      month = first;
    } else {
      // Ambiguous: prefer DD/MM, the common Zimbabwean format.
      day = first;
      month = second;
    }

    const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return isValidYmd(ymd) ? ymd : null;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const ymd = `${year}-${month}-${day}`;
    return isValidYmd(ymd) ? ymd : null;
  }

  return null;
}

function isValidYmd(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Normalize a currency cell (USD/$/ZiG/ZWG/ZAR/R) to the app currency codes. */
export function normalizeCurrency(
  value: string | undefined,
  fallback: CurrencyCode = 'USD'
): CurrencyCode {
  const token = (value || '').trim().toUpperCase();
  if (!token) return fallback;
  if (token.includes('USD') || token === 'US$' || token === '$') return 'USD';
  if (token.includes('ZWG') || token.includes('ZIG') || token.includes('ZWL')) return 'ZWG';
  if (token.includes('ZAR') || token === 'RAND' || token === 'R') return 'ZAR';
  return fallback;
}

/**
 * Parse a dirty money cell. Handles currency symbols, thousands separators,
 * spaces and accounting parentheses (e.g. "(45.50)" -> -45.5).
 */
export function parseAmountCell(value: string | undefined): number | null {
  if (value === undefined || value === null) return null;
  let cleaned = String(value).trim();
  if (!cleaned) return null;

  let negative = false;
  if (/^\(.*\)$/.test(cleaned)) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }

  cleaned = cleaned.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const parsed = parseFloat(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -Math.abs(parsed) : parsed;
}

/**
 * Ingest, parse, and evaluate duplicate status against existing transaction history.
 */
export function processCsvData(
  csvText: string,
  existingTransactions: MobileTransaction[],
  defaultCurrency: CurrencyCode = 'USD',
  fileName: string = 'statement.csv'
): CsvImportResult {
  const { headers, rows } = parseCsvText(csvText);

  // Find column candidates (tighter matches than the original loose `includes`
  // checks, which could pick "invoice" as a credit column).
  const dateCol = headers.find((h) => h.includes('date') || h.includes('time'));
  const descCol = headers.find(
    (h) => h.includes('desc') || h.includes('detail') || h.includes('narr') || h.includes('memo') || h.includes('particular')
  );
  const amountCol = headers.find(
    (h) => h.includes('amount') || h.includes('value') || h.includes('total') || h === 'amt'
  );
  const debitCol = headers.find(
    (h) => h.includes('debit') || h.includes('withdrawal') || h.includes('money out') || h === 'dr'
  );
  const creditCol = headers.find(
    (h) => h.includes('credit') || h.includes('deposit') || h.includes('money in') || h === 'cr'
  );
  const currCol = headers.find((h) => h.includes('curr') || h.includes('ccy'));
  const refCol = headers.find((h) => h.includes('ref') || h === 'id' || h.includes('code'));
  const typeCol = headers.find(
    (h) => h === 'type' || h.includes('direction') || h.includes('dr/cr') || h.includes('transaction type')
  );

  // Build existing fingerprint set; also add each parsed row as we go so
  // duplicate rows *within the same file* are flagged too.
  const seenFingerprints = new Set(
    existingTransactions.map((t) =>
      generateTransactionFingerprint(t.transactionDate, t.amount, t.description, t.currency)
    )
  );

  const parsedRows: ParsedCsvRow[] = [];
  let duplicateCount = 0;
  let invalidRows = 0;

  for (const row of rows) {
    const rawDate = dateCol ? row[dateCol] : Object.values(row)[0] || '';
    const rawDesc = (descCol ? row[descCol] : Object.values(row)[1] || '').trim();

    const normalizedDate = normalizeDate(rawDate);
    if (!normalizedDate || !rawDesc) {
      invalidRows++;
      continue;
    }

    // Optional explicit direction/type column.
    let explicitDirection: 'inflow' | 'outflow' | null = null;
    if (typeCol && row[typeCol]) {
      const typeValue = row[typeCol].toLowerCase();
      if (/(credit|cr\b|\bin\b|income|deposit|received)/.test(typeValue)) explicitDirection = 'inflow';
      else if (/(debit|dr\b|\bout\b|expense|payment|withdraw)/.test(typeValue)) explicitDirection = 'outflow';
    }

    let amount = 0;
    let direction: 'inflow' | 'outflow' = 'outflow';

    const creditValue = creditCol ? parseAmountCell(row[creditCol]) : null;
    const debitValue = debitCol ? parseAmountCell(row[debitCol]) : null;

    if (creditValue !== null && creditValue !== 0) {
      amount = Math.abs(creditValue);
      direction = 'inflow';
    } else if (debitValue !== null && debitValue !== 0) {
      amount = Math.abs(debitValue);
      direction = 'outflow';
    } else if (amountCol && row[amountCol]) {
      const parsedNumber = parseAmountCell(row[amountCol]);
      if (parsedNumber === null || parsedNumber === 0) {
        invalidRows++;
        continue;
      }
      amount = Math.abs(parsedNumber);
      direction = parsedNumber < 0 ? 'outflow' : 'inflow';
    } else {
      invalidRows++;
      continue;
    }

    if (amount <= 0) {
      invalidRows++;
      continue;
    }

    const category = categorizeDescription(rawDesc);
    const classification = categoryClassification(category);

    // For recognized categories the category wins over the amount's sign: a
    // positive "Bakers Inn stock" row is still an outflow, not income.
    if (explicitDirection) {
      direction = explicitDirection;
    } else if (
      category !== 'uncategorized' &&
      (classification.direction === 'inflow' || classification.direction === 'outflow')
    ) {
      direction = classification.direction;
    }

    const currency = normalizeCurrency(currCol ? row[currCol] : undefined, defaultCurrency);
    const reference = refCol ? row[refCol] : undefined;

    const fingerprint = generateTransactionFingerprint(normalizedDate, amount, rawDesc, currency);
    const isDuplicate = seenFingerprints.has(fingerprint);

    if (isDuplicate) {
      duplicateCount++;
    }
    seenFingerprints.add(fingerprint);

    parsedRows.push({
      raw: row,
      date: normalizedDate,
      description: rawDesc,
      amount: roundMoney(amount),
      currency,
      direction,
      category,
      reference,
      isDuplicate,
      fingerprint,
    });
  }

  return {
    fileName,
    totalRows: rows.length,
    validRows: parsedRows.length,
    invalidRows,
    duplicateCount,
    newRows: parsedRows.length - duplicateCount,
    rows: parsedRows,
    detectedColumns: headers,
  };
}

/**
 * Convert parsed CSV rows into MobileTransaction objects ready for MobileStorageService.
 */
export function convertCsvRowsToTransactions(
  rows: ParsedCsvRow[],
  skipDuplicates: boolean = true
): Omit<MobileTransaction, 'id'>[] {
  const eligible = skipDuplicates ? rows.filter((r) => !r.isDuplicate) : rows;

  return eligible.map((r) => {
    const classification = categoryClassification(r.category);
    // Recognized categories carry their own direction; only uncategorized rows
    // keep the direction inferred from the statement sign.
    const direction = r.category === 'uncategorized' ? r.direction : classification.direction;
    return {
      transactionDate: r.date,
      description: r.description,
      amount: r.amount,
      currency: r.currency,
      direction,
      type: classification.type,
      category: r.category,
      originalReference: r.reference,
      reviewStatus: r.category === 'uncategorized' ? 'pending_review' : 'confirmed',
    };
  });
}
