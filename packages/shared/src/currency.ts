import { CurrencyCode } from './types';

/**
 * Rounds a number to exactly 2 decimal places using epsilon adjustment
 * to prevent IEEE 754 binary floating-point drift.
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a currency amount with localized symbol and tabular format.
 */
export function formatMoney(amount: number, currency: CurrencyCode = 'USD'): string {
  const rounded = roundCurrency(amount);
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(rounded));

  const prefix = rounded < 0 ? '-' : '';
  switch (currency) {
    case 'USD':
      return `${prefix}$${formattedNumber}`;
    case 'ZWG':
      return `${prefix}ZiG ${formattedNumber}`;
    case 'ZAR':
      return `${prefix}R ${formattedNumber}`;
    default:
      return `${prefix}${currency} ${formattedNumber}`;
  }
}

/**
 * Cleanly parses a string representation of an amount into a valid positive or signed number.
 * Handles thousands commas, spaces, currency symbols, and parenthesized negative numbers.
 */
export function safeParseDecimal(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    return isNaN(raw) ? null : roundCurrency(raw);
  }

  let cleaned = raw.trim();
  if (!cleaned) return null;

  // Handle accounting parentheses: "(45.50)" -> "-45.50"
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1).trim();
  }

  // Remove currency symbols, commas, spaces, and non-numeric characters except '-' and '.'
  cleaned = cleaned.replace(/[$€£R]|ZiG|USD|ZWG/gi, '').replace(/\s+/g, '').replace(/,/g, '');

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;

  return roundCurrency(parsed);
}
