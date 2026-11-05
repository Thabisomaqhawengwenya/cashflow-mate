/**
 * CashFlow Mate — Localhost Privacy & Demo Sanitizer
 * ----------------------------------------------------
 * When the app is accessed on localhost (web dev preview or local browser),
 * automatically sanitizes personal identity information (e.g. real personal names,
 * personal handles, personal emails) and replaces them with authentic fictional
 * Zimbabwean market trader demo profiles (Farai Moyo / Mbare Fresh Produce).
 */

import { UserSession } from '../services/auth';
import { BusinessProfile } from '../services/storage';

const PERSONAL_KEYWORDS = [
  'maqhawe',
  'ngwenya',
  'thabiso',
  'mr q',
  'mr_q',
  'mrq',
  'thabisomaqhawengwenya',
];

export const FAKE_DEMO_TRADER = {
  fullName: 'Farai Moyo',
  username: 'farai_moyo',
  stallName: 'Mbare Fresh Produce & Tuckshop',
  stallNumber: 'Stall #14, Vegetable Shed',
  merchantTillNumber: 'EcoCash: 194827',
  city: 'Harare (Mbare Musika)',
  email: 'farai.moyo@cashflowmate.co.zw',
  phone: '+263 77 234 5678',
  tagline: 'Fresh quality farm produce and cold drinks daily.',
  operatingHours: '6:00 AM - 6:00 PM (Mon - Sat)',
};

/**
 * Detects if the app is currently running in a localhost / 127.0.0.1 browser session.
 */
export function isLocalhost(): boolean {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }
  return false;
}

/**
 * Checks if a string contains any personal keywords.
 */
export function hasPersonalData(str?: string | null): boolean {
  if (!str) return false;
  const lower = str.toLowerCase();
  return PERSONAL_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Sanitizes a string for localhost. If on localhost and contains personal info, returns fake value.
 */
export function sanitizeForLocalhost(text: string | undefined | null, fakeValue: string): string {
  if (!text) return fakeValue;
  if (isLocalhost() && hasPersonalData(text)) {
    return fakeValue;
  }
  return text;
}

/**
 * Sanitizes a UserSession object when operating on localhost.
 */
export function sanitizeSessionForLocalhost(session: UserSession | null): UserSession | null {
  if (!session) return null;
  if (!isLocalhost()) return session;

  const needsSanitization =
    hasPersonalData(session.name) ||
    hasPersonalData(session.username) ||
    hasPersonalData(session.businessName) ||
    hasPersonalData(session.email);

  if (!needsSanitization) return session;

  return {
    ...session,
    name: hasPersonalData(session.name) ? FAKE_DEMO_TRADER.fullName : session.name,
    username: hasPersonalData(session.username) ? FAKE_DEMO_TRADER.username : session.username,
    businessName: hasPersonalData(session.businessName)
      ? FAKE_DEMO_TRADER.stallName
      : session.businessName,
    email: hasPersonalData(session.email) ? FAKE_DEMO_TRADER.email : session.email,
    phone: hasPersonalData(session.phone) ? FAKE_DEMO_TRADER.phone : session.phone,
  };
}

/**
 * Sanitizes a BusinessProfile object when operating on localhost.
 */
export function sanitizeBusinessForLocalhost(biz: BusinessProfile | null): BusinessProfile | null {
  if (!biz) return null;
  if (!isLocalhost()) return biz;

  const needsSanitization =
    hasPersonalData(biz.ownerName) ||
    hasPersonalData(biz.name) ||
    hasPersonalData(biz.email) ||
    hasPersonalData(biz.phone);

  if (!needsSanitization) return biz;

  return {
    ...biz,
    ownerName: hasPersonalData(biz.ownerName) ? FAKE_DEMO_TRADER.fullName : biz.ownerName,
    name: hasPersonalData(biz.name) ? FAKE_DEMO_TRADER.stallName : biz.name,
    email: hasPersonalData(biz.email) ? FAKE_DEMO_TRADER.email : biz.email,
    phone: hasPersonalData(biz.phone) ? FAKE_DEMO_TRADER.phone : biz.phone,
    stallNumber: hasPersonalData(biz.stallNumber) ? FAKE_DEMO_TRADER.stallNumber : biz.stallNumber,
  };
}
