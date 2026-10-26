/**
 * CashFlow Mate - Software Licensing & Activation Engine
 * ------------------------------------------------------
 * Offline HMAC-SHA256 license verification for activating Pro & Enterprise
 * features without continuous cloud telemetry.
 *
 * SECURITY NOTE: HMAC is a *symmetric* primitive, so the signing secret ships
 * inside this client bundle. It prevents casual key editing but is NOT
 * forgery-proof against a determined attacker who inspects the app. Production
 * issuance should use asymmetric signatures (e.g. Ed25519) with the private key
 * kept off-device. Keep tier checks authoritative server-side where money is
 * involved.
 */

import { hmacSha256 } from './crypto';

export type LicenseTier = 'starter' | 'pro' | 'enterprise';

export interface LicenseInfo {
  key: string;
  tier: LicenseTier;
  traderName: string;
  issuedAt: string; // YYYY-MM-DD
  expiresAt: string; // YYYY-MM-DD or 'never'
  features: string[];
  isValid: boolean;
  errorMessage?: string;
}

// Server & distribution signing secret for CashFlow Mate offline activations
const LICENSE_SIGNING_SECRET = 'CFM_ZIMBABWE_2026_HMAC_SHA256_OFFLINE_SECRET_KEY';

function computeSignature(payload: string): string {
  // First 8 hex characters of HMAC-SHA256 signature
  return hmacSha256(LICENSE_SIGNING_SECRET, payload).slice(0, 8).toUpperCase();
}

/** Constant-time string comparison to avoid leaking signature matches by timing. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Generate a cryptographically verifiable license key with HMAC-SHA256 signature
 */
export function generateLicenseKey(options: {
  traderName: string;
  tier: LicenseTier;
  expiresYear?: number;
}): string {
  const tierCode = options.tier === 'enterprise' ? 'ENT' : options.tier === 'pro' ? 'PRO' : 'COMM';
  const cleanName = options.traderName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'TRADER';
  const year = options.expiresYear || 2028;

  const payload = `${tierCode}-${cleanName}-${year}`;
  const signature = computeSignature(payload);

  return `CFM-${tierCode}-${cleanName}-${signature}`;
}

/**
 * Verify a license key offline using HMAC-SHA256 signature check.
 * `now` is injectable so expiry rules are testable.
 */
export function verifyLicenseKey(rawKey: string, now: Date = new Date()): LicenseInfo {
  const clean = rawKey.trim().toUpperCase().replace(/\s+/g, '');
  const parts = clean.split('-');

  if (parts.length < 4 || parts[0] !== 'CFM') {
    return {
      key: rawKey,
      tier: 'starter',
      traderName: 'Unregistered',
      issuedAt: '2026-01-01',
      expiresAt: 'never',
      features: ['Basic Cash Till', 'Up to 50 Transactions', 'USD Only'],
      isValid: false,
      errorMessage: 'Invalid license format. Expected: CFM-PRO-XXXX-XXXXXXXX',
    };
  }

  const [, tierCode, cleanName, providedSig] = parts;
  const tier: LicenseTier = tierCode === 'ENT' ? 'enterprise' : tierCode === 'PRO' ? 'pro' : 'starter';

  // Check valid expiration years (2026 to 2035)
  let matchedYear = 0;
  for (let y = 2026; y <= 2035; y++) {
    const candidatePayload = `${tierCode}-${cleanName}-${y}`;
    if (constantTimeEqual(computeSignature(candidatePayload), providedSig)) {
      matchedYear = y;
      break;
    }
  }

  // Also support perpetual license with fixed seed
  const perpetualPayload = `${tierCode}-${cleanName}-NEVER`;
  const isPerpetual = constantTimeEqual(computeSignature(perpetualPayload), providedSig);

  if (matchedYear === 0 && !isPerpetual) {
    return {
      key: rawKey,
      tier: 'starter',
      traderName: cleanName,
      issuedAt: '2026-01-01',
      expiresAt: 'never',
      features: ['Basic Cash Till'],
      isValid: false,
      errorMessage: 'Invalid license signature or forged key.',
    };
  }

  const expiresAt = isPerpetual ? 'never' : `${matchedYear}-12-31`;

  if (!isPerpetual && expiresAt < localDateString(now)) {
    return {
      key: clean,
      tier,
      traderName: cleanName,
      issuedAt: '2026-10-01',
      expiresAt,
      features: ['Basic Cash Till'],
      isValid: false,
      errorMessage: `License expired on ${expiresAt}. Please renew to keep ${tier} features.`,
    };
  }

  const features =
    tier === 'enterprise'
      ? [
          'Unlimited CSV & Mobile Money Statements',
          'Multi-Currency Aggregation (USD, ZiG, ZAR)',
          'AI Grounded Assistant with Gemini Flash',
          'Multi-Device Syndicate Cloud Sync',
          'Audit Log Export for Zimbabwe ZIMRA Tax Filing',
        ]
      : tier === 'pro'
        ? [
            'Unlimited CSV & Mobile Money Statements',
            'Multi-Currency Aggregation (USD, ZiG, ZAR)',
            'AI Grounded Financial Assistant',
            'Debts & Customer Credit Management',
            'Full Statement CSV Export',
          ]
        : ['Basic Cash Till', 'Manual Transactions Only', 'USD Single Currency'];

  return {
    key: clean,
    tier,
    traderName: cleanName,
    issuedAt: '2026-10-01',
    expiresAt,
    features,
    isValid: true,
  };
}

/**
 * Pre-generated HMAC-SHA256 verified working license keys for testing
 */
export const WORKING_TEST_LICENSES = [
  {
    tier: 'pro' as LicenseTier,
    label: 'Trader Pro (Mbare Market)',
    key: generateLicenseKey({ traderName: 'MBARE', tier: 'pro', expiresYear: 2028 }),
    description: 'Unlocks unlimited statement imports, debts tracker & AI insights',
  },
  {
    tier: 'pro' as LicenseTier,
    label: 'Trader Pro (Harare Tuckshop)',
    key: generateLicenseKey({ traderName: 'HARARE', tier: 'pro', expiresYear: 2028 }),
    description: 'Unlocks multi-currency till & automated categorization',
  },
  {
    tier: 'enterprise' as LicenseTier,
    label: 'Enterprise Syndicate (Zim Wholesale)',
    key: generateLicenseKey({ traderName: 'ZIMWHOLE', tier: 'enterprise', expiresYear: 2030 }),
    description: 'Unlocks multi-stall sync & tax audit export',
  },
];
