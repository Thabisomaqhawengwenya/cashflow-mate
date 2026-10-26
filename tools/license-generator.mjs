#!/usr/bin/env node
/**
 * CashFlow Mate - CLI License Generator & Validator (HMAC-SHA256)
 * -------------------------------------------------------------
 * Generates and validates cryptographically signed license keys using HMAC-SHA256.
 *
 * Usage:
 *   node tools/license-generator.mjs --name "MrQ" --tier pro
 *   node tools/license-generator.mjs --name "Bulawayo Central" --tier enterprise --year 2030
 *   node tools/license-generator.mjs --verify CFM-PRO-MRQ-XXXXXXXX
 *   node tools/license-generator.mjs --list
 */

import crypto from 'node:crypto';

const LICENSE_SIGNING_SECRET = 'CFM_ZIMBABWE_2026_HMAC_SHA256_OFFLINE_SECRET_KEY';

function computeSignature(payload) {
  return crypto
    .createHmac('sha256', LICENSE_SIGNING_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
}

function generateLicenseKey({ traderName, tier = 'pro', expiresYear = 2028 }) {
  const tierCode = tier === 'enterprise' ? 'ENT' : tier === 'pro' ? 'PRO' : 'COMM';
  const cleanName = traderName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'TRADER';
  const payload = `${tierCode}-${cleanName}-${expiresYear}`;
  const signature = computeSignature(payload);
  return `CFM-${tierCode}-${cleanName}-${signature}`;
}

function verifyLicenseKey(rawKey) {
  const clean = rawKey.trim().toUpperCase().replace(/\s+/g, '');
  const parts = clean.split('-');

  if (parts.length < 4 || parts[0] !== 'CFM') {
    return { isValid: false, error: 'Invalid license format. Expected CFM-TIER-NAME-SIGNATURE' };
  }

  const [, tierCode, cleanName, providedSig] = parts;
  const tier = tierCode === 'ENT' ? 'enterprise' : tierCode === 'PRO' ? 'pro' : 'starter';

  let matchedYear = 0;
  for (let y = 2026; y <= 2035; y++) {
    if (computeSignature(`${tierCode}-${cleanName}-${y}`) === providedSig) {
      matchedYear = y;
      break;
    }
  }

  const isPerpetual = computeSignature(`${tierCode}-${cleanName}-NEVER`) === providedSig;

  if (matchedYear === 0 && !isPerpetual) {
    return { isValid: false, error: 'Invalid license signature or forged key.' };
  }

  return {
    isValid: true,
    key: clean,
    tier,
    traderName: cleanName,
    expiresAt: isPerpetual ? 'Perpetual' : `${matchedYear}-12-31`,
  };
}

const ARGS = process.argv.slice(2);
const argValue = (name, fallback) => {
  const idx = ARGS.indexOf(name);
  if (idx === -1) return fallback;
  const val = ARGS[idx + 1];
  return val && !val.startsWith('-') ? val : fallback;
};

if (ARGS.includes('--verify')) {
  const keyToVerify = argValue('--verify', ARGS[ARGS.indexOf('--verify') + 1]);
  if (!keyToVerify) {
    console.error('Please specify a key to verify: --verify CFM-PRO-XXXX-XXXXXXXX');
    process.exit(1);
  }
  const result = verifyLicenseKey(keyToVerify);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.isValid ? 0 : 1);
}

if (ARGS.includes('--list')) {
  const samples = [
    { name: 'MRQ', tier: 'pro', year: 2029 },
    { name: 'MBARE', tier: 'pro', year: 2028 },
    { name: 'HARARE', tier: 'pro', year: 2028 },
    { name: 'BULAWAYO', tier: 'pro', year: 2029 },
    { name: 'ZIMWHOLE', tier: 'enterprise', year: 2030 },
  ].map((s) => ({
    ...s,
    key: generateLicenseKey({ traderName: s.name, tier: s.tier, expiresYear: s.year }),
  }));
  console.log(JSON.stringify(samples, null, 2));
  process.exit(0);
}

const name = argValue('--name', 'TRADER');
const tier = argValue('--tier', 'pro');
const year = parseInt(argValue('--year', '2028'), 10);

const key = generateLicenseKey({ traderName: name, tier, expiresYear: year });
const verification = verifyLicenseKey(key);

console.log('---------------------------------------------------------');
console.log(' CashFlow Mate - Valid Software Activation License (HMAC-SHA256)');
console.log('---------------------------------------------------------');
console.log(` Trader / Business: ${name}`);
console.log(` Tier:              ${tier.toUpperCase()}`);
console.log(` Valid Until:       ${year}-12-31`);
console.log(` License Key:       ${key}`);
console.log(` Signature Status:  ${verification.isValid ? 'VERIFIED (VALID)' : 'INVALID'}`);
console.log('---------------------------------------------------------');
