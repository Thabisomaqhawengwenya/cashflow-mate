/**
 * Mobile offline activation.
 *
 * SECURITY NOTE: this is a symmetric HMAC scheme, so the signing secret ships in
 * the app bundle. It stops casual key editing but is not forgery-proof against a
 * determined reverse-engineer. Production issuance should use asymmetric
 * signatures (e.g. Ed25519) and keep the private key off-device.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { hmacSha256 } from './crypto';

export type LicenseTier = 'starter' | 'pro' | 'enterprise';

export interface LicenseInfo {
  key: string;
  tier: LicenseTier;
  traderName: string;
  expiresAt: string;
  features: string[];
  isValid: boolean;
  errorMessage?: string;
}

const STORAGE_KEY_LICENSE = '@cashflow_mate_license_v1';
const LICENSE_SIGNING_SECRET = 'CFM_ZIMBABWE_2026_HMAC_SHA256_OFFLINE_SECRET_KEY';

function computeSignature(payload: string): string {
  return hmacSha256(LICENSE_SIGNING_SECRET, payload).slice(0, 8).toUpperCase();
}

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

export function verifyLicenseKey(rawKey: string, now: Date = new Date()): LicenseInfo {
  const clean = rawKey.trim().toUpperCase().replace(/\s+/g, '');
  const parts = clean.split('-');

  if (parts.length < 4 || parts[0] !== 'CFM') {
    return {
      key: rawKey,
      tier: 'starter',
      traderName: 'Unregistered',
      expiresAt: 'never',
      features: ['Basic Cash Till (50 rows)', 'Single Currency USD'],
      isValid: false,
      errorMessage: 'Invalid license format. Expected: CFM-PRO-XXXX-XXXXXXXX',
    };
  }

  const [, tierCode, cleanName, providedSig] = parts;
  const tier: LicenseTier = tierCode === 'ENT' ? 'enterprise' : tierCode === 'PRO' ? 'pro' : 'starter';

  let matchedYear = 0;
  for (let y = 2026; y <= 2035; y++) {
    if (constantTimeEqual(computeSignature(`${tierCode}-${cleanName}-${y}`), providedSig)) {
      matchedYear = y;
      break;
    }
  }

  const isPerpetual = constantTimeEqual(
    computeSignature(`${tierCode}-${cleanName}-NEVER`),
    providedSig
  );

  if (matchedYear === 0 && !isPerpetual) {
    return {
      key: rawKey,
      tier: 'starter',
      traderName: cleanName,
      expiresAt: 'never',
      features: ['Basic Cash Till'],
      isValid: false,
      errorMessage: 'Invalid license signature or forged key.',
    };
  }

  const expiresAt = isPerpetual ? 'Perpetual' : `${matchedYear}-12-31`;

  if (!isPerpetual && expiresAt < localDateString(now)) {
    return {
      key: clean,
      tier,
      traderName: cleanName,
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
          'Multi-Stall Syndicate Cloud Sync',
          'ZIMRA Tax Statement Audit Export',
        ]
      : tier === 'pro'
        ? [
            'Unlimited CSV & Statement Ingestion',
            'Multi-Currency Aggregation (USD, ZiG, ZAR)',
            'Grounded AI Financial Advisor',
            'Full Customer Credit & Debt Tracking',
            'Clean Audit CSV Export',
          ]
        : ['Basic Cash Till (Single USD)'];

  return {
    key: clean,
    tier,
    traderName: cleanName,
    expiresAt,
    features,
    isValid: true,
  };
}

export const SAMPLE_WORKING_LICENSES = [
  {
    tier: 'pro' as LicenseTier,
    label: 'Mr Q Trader Pro',
    key: generateLicenseKey({ traderName: 'MRQ', tier: 'pro', expiresYear: 2029 }),
  },
  {
    tier: 'pro' as LicenseTier,
    label: 'Mbare Musika Pro',
    key: generateLicenseKey({ traderName: 'MBARE', tier: 'pro', expiresYear: 2028 }),
  },
  {
    tier: 'enterprise' as LicenseTier,
    label: 'Zimbabwe Wholesale Syndicate',
    key: generateLicenseKey({ traderName: 'ZIMWHOLE', tier: 'enterprise', expiresYear: 2030 }),
  },
];

export class MobileLicenseService {
  static async getActiveLicense(): Promise<LicenseInfo> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_LICENSE);
      if (stored) {
        const verified = verifyLicenseKey(stored);
        if (verified.isValid) return verified;
      }
    } catch {}

    // No stored license -> Starter tier. Do not silently auto-activate Pro:
    // licensing must be explicit for the tiers to mean anything.
    return {
      key: '',
      tier: 'starter',
      traderName: 'Unregistered',
      expiresAt: 'never',
      features: ['Basic Cash Till (Single USD)'],
      isValid: false,
      errorMessage: 'No license activated. Enter a Pro or Enterprise key to unlock more.',
    };
  }

  static async activateLicense(key: string): Promise<LicenseInfo> {
    const verified = verifyLicenseKey(key);
    if (verified.isValid) {
      await AsyncStorage.setItem(STORAGE_KEY_LICENSE, verified.key);
    }
    return verified;
  }
}
