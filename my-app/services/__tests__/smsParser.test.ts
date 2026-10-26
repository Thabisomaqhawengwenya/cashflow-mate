import { describe, it, expect } from 'vitest';
import { parseZimbabweSms } from '../smsParser';

describe('Mobile Zimbabwe SMS Parser Engine', () => {
  it('parses EcoCash customer inflow transfer (USD)', () => {
    const raw =
      'Transfer Confirmation: USD 15.00 received from TAFADZWA CHIDZERO (0772123456) on 26/10/2026 at 14:22:10. TxId: MP261026.002. New balance: USD 84.50';
    const result = parseZimbabweSms(raw);

    expect(result.isValid).toBe(true);
    expect(result.provider).toBe('ecocash');
    expect(result.direction).toBe('inflow');
    expect(result.amount).toBe(15.0);
    expect(result.currency).toBe('USD');
    expect(result.counterparty).toContain('TAFADZWA CHIDZERO');
    expect(result.reference).toBe('MP261026.002');
    expect(result.date).toBe('2026-10-26');
    expect(result.suggestedCategory).toBe('sales_goods');
  });

  it('parses EcoCash merchant restocking payment (Bakers Inn Bread)', () => {
    const raw =
      'Transfer Confirmation: USD 35.00 paid to BAKERS INN (Merchant Code: 19821) on 26/10/2026 at 09:12:00. TxId: MP261026.044. Fee: USD 0.70';
    const result = parseZimbabweSms(raw);

    expect(result.isValid).toBe(true);
    expect(result.direction).toBe('outflow');
    expect(result.amount).toBe(35.0);
    expect(result.currency).toBe('USD');
    expect(result.counterparty).toContain('BAKERS INN');
    expect(result.suggestedCategory).toBe('stock_purchase');
  });

  it('parses InnBucks customer transfer', () => {
    const raw =
      'InnBucks: You have received US$25.00 from Simba Moyo (0712345678). Ref: IB-883921 on 26-10-2026. Dial *569# to view balance.';
    const result = parseZimbabweSms(raw);

    expect(result.isValid).toBe(true);
    expect(result.provider).toBe('innbucks');
    expect(result.amount).toBe(25.0);
  });
});
