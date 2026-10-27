import { describe, it, expect } from 'vitest';
import { MobileReceiptService } from '../receipt';
import { MobileTransaction, BusinessProfile } from '../storage';

describe('MobileReceiptService', () => {
  const mockTx: MobileTransaction = {
    id: 'tx_test_123456789',
    transactionDate: '2026-10-27',
    description: '2x Cooking Oil & Sugar Crate',
    amount: 25.5,
    currency: 'USD',
    direction: 'inflow',
    type: 'business_income',
    category: 'sales_goods',
    originalReference: 'MP261027.001',
    reviewStatus: 'confirmed',
  };

  const mockBiz: BusinessProfile = {
    name: 'Mbare Musika Fresh Produce',
    businessType: 'retail',
    currency: 'USD',
    country: 'ZW',
    preferredLanguage: 'en',
  };

  it('generates properly formatted WhatsApp receipt text', () => {
    const receipt = MobileReceiptService.generateReceiptText(mockTx, mockBiz);

    expect(receipt).toContain('OFFICIAL TILL RECEIPT');
    expect(receipt).toContain('Mbare Musika Fresh Produce');
    expect(receipt).toContain('$25.50');
    expect(receipt).toContain('MP261027.001');
    expect(receipt).toContain('2x Cooking Oil & Sugar Crate');
    expect(receipt).toContain('PAYMENT RECEIVED');
  });

  it('handles outflows with official disbursement label', () => {
    const outflowTx: MobileTransaction = {
      ...mockTx,
      direction: 'outflow',
      type: 'business_expense',
    };

    const receipt = MobileReceiptService.generateReceiptText(outflowTx, mockBiz);
    expect(receipt).toContain('OFFICIAL DISBURSEMENT');
  });
});
