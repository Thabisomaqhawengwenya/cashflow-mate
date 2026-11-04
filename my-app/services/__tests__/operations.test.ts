import { describe, it, expect, beforeEach, vi } from 'vitest';

const { memoryStore } = vi.hoisted(() => ({
  memoryStore: new Map<string, string>(),
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => memoryStore.get(key) || null),
    setItem: vi.fn(async (key: string, val: string) => {
      memoryStore.set(key, val);
    }),
    removeItem: vi.fn(async (key: string) => {
      memoryStore.delete(key);
    }),
    clear: vi.fn(async () => {
      memoryStore.clear();
    }),
  },
}));

import { MobileOperationsService } from '../operations';
import { MobileStorageService } from '../storage';

describe('MobileOperationsService (Inventory, Invoices, Contacts)', () => {
  beforeEach(async () => {
    memoryStore.clear();
    await MobileOperationsService.addInventoryItem({
      name: 'Cooking Oil 2L',
      sku: 'OIL-2L',
      category: 'Cooking',
      quantity: 12,
      minStockLevel: 3,
      unitCost: 3.5,
      sellingPrice: 4.5,
      currency: 'USD',
      supplierName: 'Olivine Industries',
    });
    await MobileOperationsService.addInventoryItem({
      name: 'Probrands White Bread',
      sku: 'BRD-WHT',
      category: 'Bakery',
      quantity: 20,
      minStockLevel: 5,
      unitCost: 0.9,
      sellingPrice: 1.1,
      currency: 'USD',
      supplierName: 'Probrands Bulawayo',
    });
  });

  it('loads default inventory and records quick stock sale into ledger', async () => {
    const items = await MobileOperationsService.getInventory();
    expect(items.length).toBeGreaterThanOrEqual(2);

    const oil = items[0];
    const initialQty = oil.quantity;

    const result = await MobileOperationsService.recordQuickStockSale(oil.id, 2);
    expect(result).not.toBeNull();
    expect(result?.item.quantity).toBe(initialQty - 2);
    expect(result?.transaction.direction).toBe('inflow');
    expect(result?.transaction.amount).toBeCloseTo(oil.sellingPrice * 2, 2);

    const txs = await MobileStorageService.getTransactions();
    expect(txs[0].id).toBe(result?.transaction.id);
  });

  it('restocks inventory item atomically and logs purchase expense', async () => {
    const items = await MobileOperationsService.getInventory();
    const bread = items[1];
    const startQty = bread.quantity;

    const res = await MobileOperationsService.restockItem(bread.id, 10, true);
    expect(res?.item.id).toBe(bread.id);
    expect(res?.item.quantity).toBe(startQty + 10);
    expect(res?.transaction?.direction).toBe('outflow');
  });

  it('creates quotation and converts to cash sale or customer credit', async () => {
    const quote = await MobileOperationsService.addInvoice({
      docType: 'quote',
      customerName: 'Tafadzwa Hardware',
      customerPhone: '+263 77 800 9000',
      currency: 'USD',
      items: [{ description: 'Solar Battery 100Ah', quantity: 2, unitPrice: 120 }],
    });

    expect(quote.totalAmount).toBe(240);
    expect(quote.status).toBe('open');

    const creditRes = await MobileOperationsService.convertInvoiceToCreditDebt(quote.id);
    expect(creditRes?.invoice.status).toBe('credit');
    expect(creditRes?.debt.totalAmount).toBe(240);
    expect(creditRes?.debt.personName).toBe('Tafadzwa Hardware');
  });

  it('manages customer and supplier contacts directory', async () => {
    const initial = await MobileOperationsService.getContacts();
    expect(Array.isArray(initial)).toBe(true);

    const added = await MobileOperationsService.addContact({
      name: 'Delta Beverages Depot',
      role: 'supplier',
      phone: '+263 77 111 2222',
      location: 'Southerton, Harare',
      preferredCurrency: 'USD',
      totalVolumeUsd: 350,
    });
    expect(added.name).toBe('Delta Beverages Depot');

    const updated = await MobileOperationsService.updateContact(added.id, {
      totalVolumeUsd: 500,
    });
    expect(updated?.id).toBe(added.id);
    expect(updated?.totalVolumeUsd).toBe(500);
  });
});
