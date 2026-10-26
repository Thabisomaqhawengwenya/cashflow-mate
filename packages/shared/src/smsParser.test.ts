import { describe, it, expect } from 'vitest';
import { parseZimbabweSms } from './smsParser';

describe('Zimbabwe SMS Parser Engine', () => {
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
    expect(result.suggestedType).toBe('business_income');
  });

  it('parses EcoCash customer inflow transfer in ZiG (ZWG)', () => {
    const raw =
      'Transfer Confirmation: ZiG 250.00 received from MAI RUVIMBO (0781234567) on 26/10/2026. TxId: MP261026.115';
    const result = parseZimbabweSms(raw);

    expect(result.isValid).toBe(true);
    expect(result.currency).toBe('ZWG');
    expect(result.amount).toBe(250.0);
    expect(result.direction).toBe('inflow');
    expect(result.counterparty).toContain('MAI RUVIMBO');
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
    expect(result.reference).toBe('MP261026.044');
    expect(result.suggestedCategory).toBe('stock_purchase');
    expect(result.suggestedType).toBe('business_expense');
  });

  it('parses EcoCash ZETDC electricity token purchase', () => {
    const raw =
      'Transfer Confirmation: USD 12.00 paid to ZETDC for electricity token on 25/10/2026. TxId: ZETDC-88124.';
    const result = parseZimbabweSms(raw);

    expect(result.isValid).toBe(true);
    expect(result.direction).toBe('outflow');
    expect(result.amount).toBe(12.0);
    expect(result.suggestedCategory).toBe('utilities_electricity');
  });

  it('parses InnBucks customer transfer', () => {
    const raw =
      'InnBucks: You have received US$25.00 from Simba Moyo (0712345678). Ref: IB-883921 on 26-10-2026. Dial *569# to view balance.';
    const result = parseZimbabweSms(raw);

    expect(result.isValid).toBe(true);
    expect(result.provider).toBe('innbucks');
    expect(result.direction).toBe('inflow');
    expect(result.amount).toBe(25.0);
    expect(result.currency).toBe('USD');
    expect(result.counterparty).toContain('Simba Moyo');
    expect(result.reference).toBe('IB-883921');
  });

  it('parses CABS commercial bank POS settlement alert', () => {
    const raw =
      'CABS Alert: Cr USD 120.00 from POS Settlement on 26-OCT-2026. Avail Bal: USD 340.00. Ref: CBZ-99120';
    const result = parseZimbabweSms(raw);

    expect(result.isValid).toBe(true);
    expect(result.provider).toBe('bank');
    expect(result.direction).toBe('inflow');
    expect(result.amount).toBe(120.0);
    expect(result.currency).toBe('USD');
    expect(result.date).toBe('2026-10-26');
  });

  it('handles invalid or empty text safely without crashing', () => {
    const emptyResult = parseZimbabweSms('');
    expect(emptyResult.isValid).toBe(false);

    const gibberish = parseZimbabweSms('hello random message without money');
    expect(gibberish.isValid).toBe(false);
  });
});
