import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isLocalhost,
  hasPersonalData,
  sanitizeForLocalhost,
  sanitizeSessionForLocalhost,
  sanitizeBusinessForLocalhost,
  FAKE_DEMO_TRADER,
} from '../localhostSanitizer';

describe('localhostSanitizer', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    // Simulate localhost web environment
    globalThis.window = {
      location: {
        hostname: 'localhost',
      },
    } as any;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('detects localhost and 127.0.0.1 environments', () => {
    expect(isLocalhost()).toBe(true);

    (globalThis.window as any).location.hostname = '127.0.0.1';
    expect(isLocalhost()).toBe(true);

    (globalThis.window as any).location.hostname = 'app.cashflowmate.co.zw';
    expect(isLocalhost()).toBe(false);
  });

  it('accurately spots personal keywords in any casing', () => {
    expect(hasPersonalData('Maqhawe')).toBe(true);
    expect(hasPersonalData('Thabiso Ngwenya')).toBe(true);
    expect(hasPersonalData('@maqhawe_till')).toBe(true);
    expect(hasPersonalData('Mr Q')).toBe(true);
    expect(hasPersonalData('mr_q')).toBe(true);
    expect(hasPersonalData('Farai Moyo')).toBe(false);
    expect(hasPersonalData('Mbare Fresh Produce')).toBe(false);
  });

  it('replaces personal text with fake demo values on localhost', () => {
    expect(sanitizeForLocalhost('Ngwenya', FAKE_DEMO_TRADER.stallName)).toBe(
      FAKE_DEMO_TRADER.stallName
    );
    expect(sanitizeForLocalhost('Maqhawe', FAKE_DEMO_TRADER.fullName)).toBe(
      FAKE_DEMO_TRADER.fullName
    );
    expect(sanitizeForLocalhost('Fresh Fruits', 'Fallback')).toBe('Fresh Fruits');
  });

  it('sanitizes user session completely when on localhost', () => {
    const dirtySession: any = {
      userId: 'usr_123',
      name: 'Maqhawe Ngwenya',
      username: 'maqhawe',
      businessName: 'Ngwenya Produce',
      email: 'thabisomaqhawengwenya@gmail.com',
      role: 'trader',
    };

    const cleaned = sanitizeSessionForLocalhost(dirtySession);
    expect(cleaned?.name).toBe(FAKE_DEMO_TRADER.fullName);
    expect(cleaned?.username).toBe(FAKE_DEMO_TRADER.username);
    expect(cleaned?.businessName).toBe(FAKE_DEMO_TRADER.stallName);
    expect(cleaned?.email).toBe(FAKE_DEMO_TRADER.email);
  });

  it('sanitizes business profile completely when on localhost', () => {
    const dirtyBiz: any = {
      id: 'biz_123',
      name: 'Ngwenya Tuckshop',
      ownerName: 'Mr Q',
      email: 'maqhawe@example.com',
      currency: 'USD',
    };

    const cleaned = sanitizeBusinessForLocalhost(dirtyBiz);
    expect(cleaned?.ownerName).toBe(FAKE_DEMO_TRADER.fullName);
    expect(cleaned?.name).toBe(FAKE_DEMO_TRADER.stallName);
    expect(cleaned?.email).toBe(FAKE_DEMO_TRADER.email);
  });
});
