#!/usr/bin/env node
/**
 * CashFlow Mate - CLI License Generator & Validator (HMAC-SHA256)
 * -------------------------------------------------------------
 * Generates and validates HMAC-signed offline license keys.
 *
 * SECURITY NOTE: HMAC is symmetric, so the same secret below ships in the app.
 * These keys stop casual editing but are forgeable by anyone who reads the
 * bundle. For production, switch to Ed25519/RSA signing with the private key
 * kept off-device, and treat the app's tier as a UX hint only.
 *
 * Usage:
 *   node tools/license-generator.mjs --name "MrQ" --tier pro
 *   node tools/license-generator.mjs --name "Bulawayo Central" --tier enterprise --year 2030
 *   node tools/license-generator.mjs --verify CFM-PRO-MRQ-XXXXXXXX
 *   node tools/license-generator.mjs --list
 */

import crypto from 'node:crypto';

const LICENSE_SIGNING_SECRET = 'CFM_ZIMBABWE_2026_HMAC_SHA256_OFFLINE_SECRET_KEY';
const MIN_YEAR = 2026;
const MAX_YEAR = 2035;

function computeSignature(payload) {
  return crypto
    .createHmac('sha256', LICENSE_SIGNING_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function generateLicenseKey({ traderName, tier = 'pro', expiresYear = 2028 }) {
  const tierCode = tier === 'enterprise' ? 'ENT' : tier === 'pro' ? 'PRO' : 'COMM';
  const cleanName = traderName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'TRADER';
  const year = Math.min(Math.max(parseInt(expiresYear, 10) || 2028, MIN_YEAR), MAX_YEAR);
  const payload = `${tierCode}-${cleanName}-${year}`;
  const signature = computeSignature(payload);
  return `CFM-${tierCode}-${cleanName}-${signature}`;
}

function verifyLicenseKey(rawKey, now = new Date()) {
  const clean = rawKey.trim().toUpperCase().replace(/\s+/g, '');
  const parts = clean.split('-');

  if (parts.length < 4 || parts[0] !== 'CFM') {
    return { isValid: false, error: 'Invalid license format. Expected CFM-TIER-NAME-SIGNATURE' };
  }

  const [, tierCode, cleanName, providedSig] = parts;
  const tier = tierCode === 'ENT' ? 'enterprise' : tierCode === 'PRO' ? 'pro' : 'starter';

  let matchedYear = 0;
  for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
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
    return { isValid: false, error: 'Invalid license signature or forged key.' };
  }

  const expiresAt = isPerpetual ? 'Perpetual' : `${matchedYear}-12-31`;

  if (!isPerpetual && expiresAt < localDateString(now)) {
    return { isValid: false, key: clean, tier, traderName: cleanName, expiresAt, error: `License expired on ${expiresAt}.` };
  }

  return {
    isValid: true,
    key: clean,
    tier,
    traderName: cleanName,
    expiresAt,
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
