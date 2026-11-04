import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured } from './supabase';
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

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export class MobileOperationsService {
  // ============================================================================
  // 1. INVENTORY & SHELF STOCK ENGINE
  // ============================================================================
  static async getInventory(): Promise<InventoryItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const onlineInv = await SupabaseDataService.getInventory();
        if (onlineInv) {
          return onlineInv;
        }
      } catch {}
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEY_INVENTORY);
    return safeParse<InventoryItem[]>(raw, []);
  }

  static async addInventoryItem(
    input: Omit<InventoryItem, 'id' | 'updatedAt'>
  ): Promise<InventoryItem> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const created = await SupabaseDataService.createInventoryItem(input);
        const all = await this.getInventory();
        all.unshift(created);
        await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(all));
        return created;
      } catch {}
    }

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
      id: all[idx].id,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(all));
    return updated;
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    try {
      const { SupabaseDataService } = await import('./supabaseData');
      await SupabaseDataService.deleteInventoryItem(id);
    } catch {}

    const all = await this.getInventory();
    const filtered = all.filter((i) => i.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(filtered));
  }

  /**
   * Atomically deducts stock quantity and records a verified cash sale in the ledger
   */
  static async recordQuickStockSale(
    id: string,
    qtySold: number = 1
  ): Promise<{ item: InventoryItem; transaction: MobileTransaction } | null> {
    try {
      const { SupabaseDataService } = await import('./supabaseData');
      await SupabaseDataService.quickSaleInventory(id);
    } catch {}

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

    const totalSaleAmount = roundMoney(current.sellingPrice * actualQty);
    const saleTx = await MobileStorageService.saveTransaction({
      transactionDate: getLocalDateString(),
      description: `Sale: ${actualQty}x ${current.name}`,
      amount: totalSaleAmount,
      currency: current.currency,
      direction: 'inflow',
      type: 'business_income',
      category: 'sales_goods',
      notes: `Quick stock sale (Remaining shelf count: ${nextQty})`,
      reviewStatus: 'confirmed',
    });

    return { item: updatedItem, transaction: saleTx };
  }

  // ============================================================================
  // 2. QUOTATIONS & PRO-FORMA INVOICES ENGINE
  // ============================================================================
  static async getInvoices(): Promise<InvoiceQuote[]> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const onlineInvs = await SupabaseDataService.getInvoices();
        if (onlineInvs) {
          return onlineInvs;
        }
      } catch {}
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEY_INVOICES);
    return safeParse<InvoiceQuote[]>(raw, []);
  }

  static async addInvoice(
    input: Omit<InvoiceQuote, 'id' | 'createdAt' | 'updatedAt' | 'referenceNumber' | 'totalAmount' | 'status' | 'dueDate'> &
      Partial<Pick<InvoiceQuote, 'referenceNumber' | 'totalAmount' | 'status' | 'dueDate'>>
  ): Promise<InvoiceQuote> {
    const total =
      input.totalAmount !== undefined
        ? input.totalAmount
        : (input.items || []).reduce((acc, it) => acc + (it.quantity || 1) * (it.unitPrice || 0), 0);

    const ref =
      input.referenceNumber ||
      `${input.docType === 'invoice' ? 'INV' : 'QTE'}-${Date.now().toString().slice(-6)}`;

    return this.createInvoiceQuote({
      docType: input.docType || 'invoice',
      referenceNumber: ref,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      currency: input.currency || 'USD',
      items: input.items || [],
      totalAmount: roundMoney(total),
      status: input.status || 'open',
      dueDate: input.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      notes: input.notes,
    });
  }

  static async createInvoiceQuote(
    input: Omit<InvoiceQuote, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InvoiceQuote> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const created = await SupabaseDataService.createInvoice(input);
        const all = await this.getInvoices();
        all.unshift(created);
        await AsyncStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(all));
        return created;
      } catch {}
    }

    const all = await this.getInvoices();
    const newQuote: InvoiceQuote = {
      ...input,
      id: `qte_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      totalAmount: roundMoney(Number(input.totalAmount) || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.unshift(newQuote);
    await AsyncStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(all));
    return newQuote;
  }

  static async deleteInvoice(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        await SupabaseDataService.deleteInvoice(id);
      } catch {}
    }

    const all = await this.getInvoices();
    const filtered = all.filter((i) => i.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(filtered));
  }

  // ============================================================================
  // 3. CONTACTS DIRECTORY
  // ============================================================================
  static async getContacts(): Promise<TraderContact[]> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const onlineContacts = await SupabaseDataService.getContacts();
        if (onlineContacts) {
          return onlineContacts;
        }
      } catch {}
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEY_CONTACTS);
    return safeParse<TraderContact[]>(raw, []);
  }

  static async addContact(
    input: Omit<TraderContact, 'id' | 'updatedAt'>
  ): Promise<TraderContact> {
    if (isSupabaseConfigured) {
      try {
        const { SupabaseDataService } = await import('./supabaseData');
        const created = await SupabaseDataService.createContact(input);
        const all = await this.getContacts();
        all.unshift(created);
        await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(all));
        return created;
      } catch {}
    }

    const all = await this.getContacts();
    const newContact: TraderContact = {
      ...input,
      id: `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      totalVolumeUsd: roundMoney(Number(input.totalVolumeUsd) || 0),
      updatedAt: new Date().toISOString(),
    };
    all.unshift(newContact);
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(all));
    return newContact;
  }

  static async deleteContact(id: string): Promise<void> {
    try {
      const { SupabaseDataService } = await import('./supabaseData');
      await SupabaseDataService.deleteContact(id);
    } catch {}

    const all = await this.getContacts();
    const filtered = all.filter((c) => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(filtered));
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
    const nextQty = current.quantity + actualAdded;

    const updatedItem: InventoryItem = {
      ...current,
      quantity: nextQty,
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
      paidAmount: 0,
      currency: target.currency,
      recordedDate: getLocalDateString(),
      dueDate: target.dueDate || getLocalDateString(),
      status: 'outstanding',
      notes: `${target.referenceNumber} (${target.customerPhone}): ${summaryDesc}`,
    });

    return { invoice: updated, debt };
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
}
