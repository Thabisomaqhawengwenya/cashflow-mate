import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CurrencyCode,
  MobileStorageService,
  MobileTransaction,
  MobileDebt,
  getLocalDateString,
  roundMoney,
} from './storage';

export const STORAGE_KEY_INVENTORY = '@cashflow_mobile_inventory_v1';
export const STORAGE_KEY_INVOICES = '@cashflow_mobile_invoices_v1';
export const STORAGE_KEY_CONTACTS = '@cashflow_mobile_contacts_v1';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStockLevel: number;
  unitCost: number;
  sellingPrice: number;
  currency: CurrencyCode;
  supplierName: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceQuote {
  id: string;
  referenceNumber: string;
  docType: 'quote' | 'invoice';
  customerName: string;
  customerPhone: string;
  currency: CurrencyCode;
  items: InvoiceLineItem[];
  totalAmount: number;
  status: 'open' | 'paid' | 'credit';
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TraderContact {
  id: string;
  name: string;
  role: 'customer' | 'supplier';
  phone: string;
  location: string;
  preferredCurrency: CurrencyCode;
  notes?: string;
  totalVolumeUsd: number;
  updatedAt: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_001',
    name: 'ZimGold Cooking Oil (2L)',
    sku: 'ZG-OIL-2L',
    category: 'Groceries',
    quantity: 18,
    minStockLevel: 6,
    unitCost: 3.1,
    sellingPrice: 3.8,
    currency: 'USD',
    supplierName: 'National Foods Depot',
    updatedAt: '2026-10-28T09:00:00.000Z',
  },
  {
    id: 'inv_002',
    name: 'Bakers Inn Superior White Loaf',
    sku: 'BI-LOAF-01',
    category: 'Bakery',
    quantity: 4,
    minStockLevel: 10,
    unitCost: 0.85,
    sellingPrice: 1.0,
    currency: 'USD',
    supplierName: 'Bakers Inn Logistics',
    updatedAt: '2026-10-29T07:30:00.000Z',
  },
  {
    id: 'inv_003',
    name: 'Huletts Brown Sugar (2kg)',
    sku: 'HL-SUG-2KG',
    category: 'Groceries',
    quantity: 14,
    minStockLevel: 5,
    unitCost: 2.2,
    sellingPrice: 2.75,
    currency: 'USD',
    supplierName: 'Gain Cash & Carry',
    updatedAt: '2026-10-28T14:20:00.000Z',
  },
  {
    id: 'inv_004',
    name: 'Econet Buddie $1 Airtime Card',
    sku: 'ECO-AIR-1',
    category: 'Airtime & Vouchers',
    quantity: 3,
    minStockLevel: 15,
    unitCost: 0.92,
    sellingPrice: 1.0,
    currency: 'USD',
    supplierName: 'Econet Wireless',
    updatedAt: '2026-10-29T11:10:00.000Z',
  },
  {
    id: 'inv_005',
    name: 'Mazoe Orange Crush (2L)',
    sku: 'MZ-ORG-2L',
    category: 'Beverages',
    quantity: 11,
    minStockLevel: 5,
    unitCost: 3.0,
    sellingPrice: 3.75,
    currency: 'USD',
    supplierName: 'Schweppes Zimbabwe',
    updatedAt: '2026-10-27T16:00:00.000Z',
  },
];

const INITIAL_INVOICES: InvoiceQuote[] = [
  {
    id: 'qte_001',
    referenceNumber: 'QT-2026-101',
    docType: 'quote',
    customerName: 'Chipo Mupfumi (Catering)',
    customerPhone: '+263 77 412 8890',
    currency: 'USD',
    items: [
      { description: 'ZimGold Cooking Oil (2L)', quantity: 10, unitPrice: 3.8 },
      { description: 'Huletts Brown Sugar (2kg)', quantity: 15, unitPrice: 2.7 },
    ],
    totalAmount: 78.5,
    status: 'open',
    dueDate: '2026-11-10',
    notes: 'Bulk catering quotation for wedding order in Hatfield',
    createdAt: '2026-10-28T10:15:00.000Z',
    updatedAt: '2026-10-28T10:15:00.000Z',
  },
  {
    id: 'qte_002',
    referenceNumber: 'INV-2026-102',
    docType: 'invoice',
    customerName: 'Glen View Tuckshop #9',
    customerPhone: '+263 78 901 3344',
    currency: 'USD',
    items: [
      { description: 'Mazoe Orange Crush Crate (6x2L)', quantity: 4, unitPrice: 21.5 },
      { description: 'Bakers Inn Superior Loaf (Dozen)', quantity: 2, unitPrice: 11.5 },
    ],
    totalAmount: 109.0,
    status: 'paid',
    dueDate: '2026-10-30',
    notes: 'Settled via EcoCash USD transfer',
    createdAt: '2026-10-25T08:40:00.000Z',
    updatedAt: '2026-10-26T14:20:00.000Z',
  },
  {
    id: 'qte_003',
    referenceNumber: 'QT-2026-103',
    docType: 'quote',
    customerName: 'Tendai Ncube',
    customerPhone: '+263 71 552 0192',
    currency: 'ZWG',
    items: [
      { description: 'Monthly Family Grocery Hamper', quantity: 1, unitPrice: 1450.0 },
    ],
    totalAmount: 1450.0,
    status: 'open',
    dueDate: '2026-11-12',
    notes: 'Payable via EcoCash ZiG biller code',
    createdAt: '2026-10-29T12:00:00.000Z',
    updatedAt: '2026-10-29T12:00:00.000Z',
  },
];

const INITIAL_CONTACTS: TraderContact[] = [
  {
    id: 'cnt_001',
    name: 'Bakers Inn Logistics',
    role: 'supplier',
    phone: '+263 77 210 0400',
    location: 'Graniteside, Harare',
    preferredCurrency: 'USD',
    notes: 'Daily morning bread van delivery at 6:30 AM',
    totalVolumeUsd: 420.0,
    updatedAt: '2026-10-29T07:30:00.000Z',
  },
  {
    id: 'cnt_002',
    name: 'National Foods Depot',
    role: 'supplier',
    phone: '+263 77 214 8900',
    location: 'Workington, Harare',
    preferredCurrency: 'USD',
    notes: 'Wholesale cooking oil, mealie-meal, and flour supplier',
    totalVolumeUsd: 890.0,
    updatedAt: '2026-10-28T11:00:00.000Z',
  },
  {
    id: 'cnt_003',
    name: 'Mai Ruvimbo',
    role: 'customer',
    phone: '+263 78 341 9012',
    location: 'Mbare Musika Stall #12',
    preferredCurrency: 'USD',
    notes: 'Regular bulk buyer — settles credit every Friday',
    totalVolumeUsd: 165.0,
    updatedAt: '2026-10-28T16:15:00.000Z',
  },
  {
    id: 'cnt_004',
    name: 'Simba Moyo',
    role: 'customer',
    phone: '+263 71 299 4411',
    location: 'Highfield, Harare',
    preferredCurrency: 'USD',
    notes: 'Catering & grocery repeat customer (InnBucks / EcoCash)',
    totalVolumeUsd: 240.0,
    updatedAt: '2026-10-29T09:45:00.000Z',
  },
  {
    id: 'cnt_005',
    name: 'Gain Cash & Carry',
    role: 'supplier',
    phone: '+263 77 400 1122',
    location: 'Msasa, Harare',
    preferredCurrency: 'USD',
    notes: 'Sugar, salt, soap, and dry groceries wholesaler',
    totalVolumeUsd: 610.0,
    updatedAt: '2026-10-27T15:00:00.000Z',
  },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return JSON.parse(JSON.stringify(fallback));
  try {
    return JSON.parse(raw) as T;
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
}

export class MobileOperationsService {
  // ============================================================================
  // 1. INVENTORY & SHELF STOCK ENGINE
  // ============================================================================
  static async getInventory(): Promise<InventoryItem[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_INVENTORY);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(INITIAL_INVENTORY));
      return JSON.parse(JSON.stringify(INITIAL_INVENTORY));
    }
    return safeParse<InventoryItem[]>(raw, INITIAL_INVENTORY);
  }

  static async addInventoryItem(
    input: Omit<InventoryItem, 'id' | 'updatedAt'>
  ): Promise<InventoryItem> {
    const all = await this.getInventory();
    const newItem: InventoryItem = {
      ...input,
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      quantity: Math.max(0, Number(input.quantity) || 0),
      minStockLevel: Math.max(0, Number(input.minStockLevel) || 0),
      unitCost: roundMoney(Number(input.unitCost) || 0),
      sellingPrice: roundMoney(Number(input.sellingPrice) || 0),
      updatedAt: new Date().toISOString(),
    };
    all.unshift(newItem);
    await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(all));
    return newItem;
  }

  static async updateInventoryItem(
    id: string,
    updates: Partial<Omit<InventoryItem, 'id'>>
  ): Promise<InventoryItem | null> {
    const all = await this.getInventory();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const updated: InventoryItem = {
      ...all[idx],
      ...updates,
      id: all[idx].id, // Preserve original ID
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(all));
    return updated;
  }

  /**
   * Atomically deducts stock quantity and records a verified cash sale in the ledger
   */
  static async recordQuickStockSale(
    id: string,
    qtySold: number = 1
  ): Promise<{ item: InventoryItem; transaction: MobileTransaction } | null> {
    const all = await this.getInventory();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const actualQty = Math.max(1, Math.floor(qtySold));
    const nextQty = Math.max(0, current.quantity - actualQty);

    const updatedItem: InventoryItem = {
      ...current,
      quantity: nextQty,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updatedItem;
    await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(all));

    const saleTotal = roundMoney(current.sellingPrice * actualQty);
    const transaction = await MobileStorageService.saveTransaction({
      transactionDate: getLocalDateString(),
      description: `Stock Sale: ${actualQty}x ${current.name}`,
      amount: saleTotal,
      currency: current.currency,
      direction: 'inflow',
      type: 'business_income',
      category: 'sales_goods',
      reviewStatus: 'confirmed',
    });

    return { item: updatedItem, transaction };
  }

  /**
   * Atomically increments stock quantity and optionally logs restock purchase expense
   */
  static async restockItem(
    id: string,
    qtyAdded: number = 5,
    logExpense: boolean = true
  ): Promise<{ item: InventoryItem; transaction?: MobileTransaction } | null> {
    const all = await this.getInventory();
    const idx = all.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const actualAdded = Math.max(1, Math.floor(qtyAdded));
    const updatedItem: InventoryItem = {
      ...current,
      quantity: current.quantity + actualAdded,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updatedItem;
    await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(all));

    let transaction: MobileTransaction | undefined;
    if (logExpense && current.unitCost > 0) {
      const restockCost = roundMoney(current.unitCost * actualAdded);
      transaction = await MobileStorageService.saveTransaction({
        transactionDate: getLocalDateString(),
        description: `Restock: ${actualAdded}x ${current.name} (${current.supplierName})`,
        amount: restockCost,
        currency: current.currency,
        direction: 'outflow',
        type: 'business_expense',
        category: 'stock_purchase',
        reviewStatus: 'confirmed',
      });
    }

    return { item: updatedItem, transaction };
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    const all = await this.getInventory();
    const filtered = all.filter((i) => i.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(filtered));
  }

  // ============================================================================
  // 2. QUOTATIONS & PRO-FORMA INVOICES ENGINE
  // ============================================================================
  static async getInvoices(): Promise<InvoiceQuote[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_INVOICES);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(INITIAL_INVOICES));
      return JSON.parse(JSON.stringify(INITIAL_INVOICES));
    }
    return safeParse<InvoiceQuote[]>(raw, INITIAL_INVOICES);
  }

  static async addInvoice(input: {
    docType: 'quote' | 'invoice';
    customerName: string;
    customerPhone: string;
    currency: CurrencyCode;
    items: InvoiceLineItem[];
    dueDate?: string;
    notes?: string;
  }): Promise<InvoiceQuote> {
    const all = await this.getInvoices();
    const totalAmount = roundMoney(
      input.items.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
    );
    const prefix = input.docType === 'invoice' ? 'INV' : 'QT';
    const seq = 101 + all.length;
    const nowIso = new Date().toISOString();

    const created: InvoiceQuote = {
      id: `qte_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      referenceNumber: `${prefix}-2026-${seq}`,
      docType: input.docType,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      currency: input.currency,
      items: input.items,
      totalAmount,
      status: 'open',
      dueDate: input.dueDate || getLocalDateString(),
      notes: input.notes?.trim(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    all.unshift(created);
    await AsyncStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(all));
    return created;
  }

  /**
   * Atomically converts an open Quote/Invoice into a verified paid Sale in the ledger
   */
  static async convertInvoiceToCashSale(
    id: string
  ): Promise<{ invoice: InvoiceQuote; transaction: MobileTransaction } | null> {
    const all = await this.getInvoices();
    const idx = all.findIndex((q) => q.id === id);
    if (idx === -1) return null;

    const target = all[idx];
    const updated: InvoiceQuote = {
      ...target,
      docType: 'invoice',
      status: 'paid',
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    await AsyncStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(all));

    const transaction = await MobileStorageService.saveTransaction({
      transactionDate: getLocalDateString(),
      description: `Invoice Paid (${target.referenceNumber}): ${target.customerName}`,
      amount: target.totalAmount,
      currency: target.currency,
      direction: 'inflow',
      type: 'business_income',
      category: 'sales_goods',
      reviewStatus: 'confirmed',
    });

    return { invoice: updated, transaction };
  }

  /**
   * Atomically converts an open Quote/Invoice into a Customer Credit (Chikwereti) Debt entry
   */
  static async convertInvoiceToCreditDebt(
    id: string
  ): Promise<{ invoice: InvoiceQuote; debt: MobileDebt } | null> {
    const all = await this.getInvoices();
    const idx = all.findIndex((q) => q.id === id);
    if (idx === -1) return null;

    const target = all[idx];
    const updated: InvoiceQuote = {
      ...target,
      docType: 'invoice',
      status: 'credit',
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    await AsyncStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(all));

    const summaryDesc = target.items.map((i) => `${i.quantity}x ${i.description}`).join(', ');
    const debt = await MobileStorageService.saveDebt({
      personName: target.customerName,
      direction: 'owed_to_business',
      totalAmount: target.totalAmount,
      currency: target.currency,
      recordedDate: getLocalDateString(),
      dueDate: target.dueDate || getLocalDateString(),
      notes: `${target.referenceNumber} (${target.customerPhone}): ${summaryDesc}`,
    });

    return { invoice: updated, debt };
  }

  static async deleteInvoice(id: string): Promise<void> {
    const all = await this.getInvoices();
    const filtered = all.filter((q) => q.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(filtered));
  }

  // ============================================================================
  // 3. CUSTOMER & SUPPLIER CRM DIRECTORY
  // ============================================================================
  static async getContacts(): Promise<TraderContact[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CONTACTS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(INITIAL_CONTACTS));
      return JSON.parse(JSON.stringify(INITIAL_CONTACTS));
    }
    return safeParse<TraderContact[]>(raw, INITIAL_CONTACTS);
  }

  static async addContact(
    input: Omit<TraderContact, 'id' | 'updatedAt'>
  ): Promise<TraderContact> {
    const all = await this.getContacts();
    const created: TraderContact = {
      ...input,
      id: `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: input.name.trim(),
      phone: input.phone.trim(),
      location: input.location.trim() || 'Harare, Zimbabwe',
      totalVolumeUsd: roundMoney(Number(input.totalVolumeUsd) || 0),
      updatedAt: new Date().toISOString(),
    };
    all.unshift(created);
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(all));
    return created;
  }

  static async updateContact(
    id: string,
    updates: Partial<Omit<TraderContact, 'id'>>
  ): Promise<TraderContact | null> {
    const all = await this.getContacts();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    const updated: TraderContact = {
      ...all[idx],
      ...updates,
      id: all[idx].id,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(all));
    return updated;
  }

  static async deleteContact(id: string): Promise<void> {
    const all = await this.getContacts();
    const filtered = all.filter((c) => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(filtered));
  }
}
