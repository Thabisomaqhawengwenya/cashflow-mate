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
 * Parse date from various formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY)
 */
export function normalizeDate(dateStr: string): string {
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback to today if unparseable
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

  // Find column candidates
  const dateCol = headers.find((h) => h.includes('date') || h.includes('time'));
  const descCol = headers.find(
    (h) => h.includes('desc') || h.includes('detail') || h.includes('narr') || h.includes('memo') || h.includes('particular')
  );
  const amountCol = headers.find(
    (h) => h.includes('amount') || h.includes('value') || h.includes('total') || h === 'amt'
  );
  const debitCol = headers.find((h) => h.includes('debit') || h.includes('out') || h.includes('withdrawal'));
  const creditCol = headers.find((h) => h.includes('credit') || h.includes('in') || h.includes('deposit'));
  const currCol = headers.find((h) => h.includes('curr') || h.includes('ccy'));
  const refCol = headers.find((h) => h.includes('ref') || h.includes('id') || h.includes('code'));

  // Build existing fingerprint set
  const existingFingerprints = new Set(
    existingTransactions.map((t) =>
      generateTransactionFingerprint(t.transactionDate, t.amount, t.description, t.currency)
    )
  );

  const parsedRows: ParsedCsvRow[] = [];
  let duplicateCount = 0;

  for (const row of rows) {
    const rawDate = dateCol ? row[dateCol] : Object.values(row)[0] || '';
    const rawDesc = descCol ? row[descCol] : Object.values(row)[1] || 'Unlabeled Transaction';

    let amount = 0;
    let direction: 'inflow' | 'outflow' = 'outflow';

    if (creditCol && row[creditCol] && parseFloat(row[creditCol].replace(/[^0-9.-]/g, '')) > 0) {
      amount = parseFloat(row[creditCol].replace(/[^0-9.-]/g, ''));
      direction = 'inflow';
    } else if (debitCol && row[debitCol] && parseFloat(row[debitCol].replace(/[^0-9.-]/g, '')) > 0) {
      amount = parseFloat(row[debitCol].replace(/[^0-9.-]/g, ''));
      direction = 'outflow';
    } else if (amountCol && row[amountCol]) {
      const parsedNum = parseFloat(row[amountCol].replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsedNum)) {
        amount = Math.abs(parsedNum);
        direction = parsedNum >= 0 ? 'inflow' : 'outflow';
      }
    }

    if (isNaN(amount) || amount === 0) continue;

    const normalizedDate = normalizeDate(rawDate);
    const rawCurr = currCol ? row[currCol]?.toUpperCase() : defaultCurrency;
    const currency: CurrencyCode = rawCurr === 'ZWG' || rawCurr === 'ZAR' ? rawCurr : defaultCurrency;
    const reference = refCol ? row[refCol] : undefined;
    const category = categorizeDescription(rawDesc);

    const fingerprint = generateTransactionFingerprint(normalizedDate, amount, rawDesc, currency);
    const isDuplicate = existingFingerprints.has(fingerprint);

    if (isDuplicate) {
      duplicateCount++;
    }

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
    return {
      transactionDate: r.date,
      description: r.description,
      amount: r.amount,
      currency: r.currency,
      direction: r.direction || classification.direction,
      type: classification.type,
      category: r.category,
      originalReference: r.reference,
      reviewStatus: r.category === 'uncategorized' ? 'pending_review' : 'confirmed',
    };
  });
}
