import { CurrencyCode, roundMoney } from './storage';

export interface ParsedSmsResult {
  isValid: boolean;
  provider: 'ecocash' | 'innbucks' | 'bank' | 'generic';
  direction: 'inflow' | 'outflow';
  amount: number;
  currency: CurrencyCode;
  counterparty: string;
  reference: string;
  date: string; // YYYY-MM-DD
  suggestedCategory: string;
  suggestedType: 'business_income' | 'business_expense' | 'transfer' | 'owner_withdrawal';
  rawText: string;
  error?: string;
}

function normalizeDate(rawDate?: string): string {
  if (!rawDate) {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
  const clean = rawDate.trim().replace(/at\s+\d+:\d+(:\d+)?/i, '').trim();

  // Pattern DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern YYYY-MM-DD
  const ymdMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Pattern DD-MON-YYYY (e.g., 26-OCT-2026)
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const dMonYMatch = clean.match(/(\d{1,2})[\/\-]([a-zA-Z]{3})[\/\-](\d{4})/i);
  if (dMonYMatch) {
    const day = dMonYMatch[1].padStart(2, '0');
    const mon = monthNames[dMonYMatch[2].toLowerCase()] || '01';
    const year = dMonYMatch[3];
    return `${year}-${mon}-${day}`;
  }

  const now = new Date();
  return now.toISOString().split('T')[0];
}

function detectCurrency(text: string): CurrencyCode {
  if (/ZiG|ZWG/i.test(text)) return 'ZWG';
  if (/ZAR|\bR\s*\d+/i.test(text)) return 'ZAR';
  return 'USD';
}

function inferCategoryAndType(
  direction: 'inflow' | 'outflow',
  counterparty: string,
  rawText: string
): { category: string; type: ParsedSmsResult['suggestedType'] } {
  const combined = `${counterparty} ${rawText}`.toLowerCase();

  if (direction === 'inflow') {
    return { category: 'sales_goods', type: 'business_income' };
  }

  if (/bakers\s*inn|bread|flour|profeeds|national\s*foods|dairibord|seed|delta|grain|musika|wholesale|crates|stock|produce/i.test(combined)) {
    return { category: 'stock_purchase', type: 'business_expense' };
  }
  if (/zetdc|electricity|power|token|zesa/i.test(combined)) {
    return { category: 'utilities_electricity', type: 'business_expense' };
  }
  if (/kombi|transport|fuel|diesel|petrol|haulage|tolls|tollgate/i.test(combined)) {
    return { category: 'transport_fuel', type: 'business_expense' };
  }
  if (/rent|stall|council|hcc|city\s*council/i.test(combined)) {
    return { category: 'rent', type: 'business_expense' };
  }
  if (/fee|imtt|levy|cashout\s*fee|charge|maintenance/i.test(combined)) {
    return { category: 'mobile_money_fees', type: 'business_expense' };
  }
  if (/cash\s*out|withdrawal/i.test(combined)) {
    return { category: 'owner_drawings', type: 'owner_withdrawal' };
  }

  return { category: 'stock_purchase', type: 'business_expense' };
}

export function parseZimbabweSms(rawText: string): ParsedSmsResult {
  const clean = rawText.trim();
  if (!clean || clean.length < 10) {
    return {
      isValid: false,
      provider: 'generic',
      direction: 'inflow',
      amount: 0,
      currency: 'USD',
      counterparty: '',
      reference: '',
      date: normalizeDate(),
      suggestedCategory: 'sales_goods',
      suggestedType: 'business_income',
      rawText,
      error: 'Text is too short or empty to parse as a transaction SMS.',
    };
  }

  const currency = detectCurrency(clean);

  // 1. EcoCash Parser
  if (/ecocash|transfer confirmation|cash out confirmation/i.test(clean)) {
    const isReceived = /received\s*from|cash\s*in/i.test(clean);
    const direction: 'inflow' | 'outflow' = isReceived ? 'inflow' : 'outflow';

    const amtMatch = clean.match(/(?:USD|ZiG|ZWG|US\$|\$)\s*([\d,]+\.?\d*)/i);
    const amount = amtMatch ? roundMoney(parseFloat(amtMatch[1].replace(/,/g, ''))) : 0;

    let counterparty = 'EcoCash Merchant';
    const counterMatch = clean.match(/(?:from|to|withdrawn from)\s+([A-Za-z0-9\s&]+?)(?=\s*(?:\(|\s+on|\s+TxId|\s+Ref|\.|$))/i);
    if (counterMatch && counterMatch[1].trim()) {
      counterparty = counterMatch[1].trim();
    }

    let reference = '';
    const refMatch = clean.match(/(?:TxId|Ref(?:erence)?)[:\s]+([A-Za-z0-9\.\-_]+)/i);
    if (refMatch) {
      reference = refMatch[1].replace(/[\.,;]+$/, '').trim();
    }

    let date = normalizeDate();
    const dateMatch = clean.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}[\/\-][A-Za-z]{3}[\/\-]\d{4})\b/);
    if (dateMatch) {
      date = normalizeDate(dateMatch[1]);
    }

    const { category, type } = inferCategoryAndType(direction, counterparty, clean);

    return {
      isValid: amount > 0,
      provider: 'ecocash',
      direction,
      amount,
      currency,
      counterparty,
      reference,
      date,
      suggestedCategory: category,
      suggestedType: type,
      rawText,
      error: amount > 0 ? undefined : 'Could not extract valid amount from EcoCash SMS.',
    };
  }

  // 2. InnBucks Parser
  if (/innbucks/i.test(clean)) {
    const isReceived = /received/i.test(clean);
    const direction: 'inflow' | 'outflow' = isReceived ? 'inflow' : 'outflow';

    const amtMatch = clean.match(/(?:US\$|USD|\$)\s*([\d,]+\.?\d*)/i);
    const amount = amtMatch ? roundMoney(parseFloat(amtMatch[1].replace(/,/g, ''))) : 0;

    let counterparty = 'InnBucks Customer';
    const counterMatch = clean.match(/(?:from|to)\s+([A-Za-z0-9\s&]+?)(?=\s*(?:\(|\s+successful|\s+Ref|\.|$))/i);
    if (counterMatch && counterMatch[1].trim()) {
      counterparty = counterMatch[1].trim();
    }

    let reference = '';
    const refMatch = clean.match(/Ref[:\s]+([A-Za-z0-9\.\-_]+)/i);
    if (refMatch) {
      reference = refMatch[1].replace(/[\.,;]+$/, '').trim();
    }

    let date = normalizeDate();
    const dateMatch = clean.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/);
    if (dateMatch) {
      date = normalizeDate(dateMatch[1]);
    }

    const { category, type } = inferCategoryAndType(direction, counterparty, clean);

    return {
      isValid: amount > 0,
      provider: 'innbucks',
      direction,
      amount,
      currency,
      counterparty,
      reference,
      date,
      suggestedCategory: category,
      suggestedType: type,
      rawText,
      error: amount > 0 ? undefined : 'Could not extract valid amount from InnBucks SMS.',
    };
  }

  // 3. Bank / Card Alert
  if (/alert|cabs|cbz|stanbic|fbc|ecobank|cr\s+|dr\s+/i.test(clean)) {
    const isCr = /\bcr\b/i.test(clean);
    const direction: 'inflow' | 'outflow' = isCr ? 'inflow' : 'outflow';

    const amtMatch = clean.match(/(?:USD|ZiG|ZWG|US\$|\$)\s*([\d,]+\.?\d*)/i);
    const amount = amtMatch ? roundMoney(parseFloat(amtMatch[1].replace(/,/g, ''))) : 0;

    let counterparty = 'Bank Settlement';
    const counterMatch = clean.match(/(?:from|at)\s+([A-Za-z0-9\s&]+?)(?=\s*(?:on|\s+Ref|\.|$))/i);
    if (counterMatch && counterMatch[1].trim()) {
      counterparty = counterMatch[1].trim();
    }

    let reference = '';
    const refMatch = clean.match(/Ref[:\s]+([A-Za-z0-9\.\-_]+)/i);
    if (refMatch) {
      reference = refMatch[1].replace(/[\.,;]+$/, '').trim();
    }

    let date = normalizeDate();
    const dateMatch = clean.match(/\b(\d{1,2}[\/\-][A-Za-z]{3}[\/\-]\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
    if (dateMatch) {
      date = normalizeDate(dateMatch[1]);
    }

    const { category, type } = inferCategoryAndType(direction, counterparty, clean);

    return {
      isValid: amount > 0,
      provider: 'bank',
      direction,
      amount,
      currency,
      counterparty,
      reference,
      date,
      suggestedCategory: category,
      suggestedType: type,
      rawText,
      error: amount > 0 ? undefined : 'Could not extract valid amount from Bank alert.',
    };
  }

  // 4. Generic Fallback
  const amtMatch = clean.match(/(?:USD|ZiG|ZWG|US\$|\$|R)\s*([\d,]+\.?\d*)/i);
  const amount = amtMatch ? roundMoney(parseFloat(amtMatch[1].replace(/,/g, ''))) : 0;
  const isOutflow = /paid|spent|bought|withdrew|withdrawn|expense|fee/i.test(clean);
  const direction = isOutflow ? 'outflow' : 'inflow';

  return {
    isValid: amount > 0,
    provider: 'generic',
    direction,
    amount,
    currency,
    counterparty: 'Direct Cash Transfer',
    reference: `SMS-${Date.now().toString().slice(-6)}`,
    date: normalizeDate(),
    suggestedCategory: direction === 'inflow' ? 'sales_goods' : 'stock_purchase',
    suggestedType: direction === 'inflow' ? 'business_income' : 'business_expense',
    rawText,
    error: amount > 0 ? undefined : 'Unrecognized SMS pattern. Please verify details.',
  };
}
