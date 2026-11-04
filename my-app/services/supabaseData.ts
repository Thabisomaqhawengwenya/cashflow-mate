import { supabase, isSupabaseConfigured } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MobileTransaction,
  MobileDebt,
  BusinessProfile,
  CurrencyCode,
  roundMoney,
} from './storage';
import { InventoryItem, InvoiceQuote, TraderContact } from './operations';

// Local storage fallback cache keys (prefixed with user id when logged in)
const CACHE_PREFIX = '@cashflow_cache_';

export interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  stallName: string;
  phone?: string;
  city?: string;
  currency: CurrencyCode;
  startingBalance: number;
  onboardingCompleted: boolean;
  avatarUri?: string;
}

export class SupabaseDataService {
  /**
   * Helper: Get active authenticated user ID.
   * Throws error if user is unauthenticated.
   */
  private static async getUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User is not authenticated. Please sign in.');
    }
    return user.id;
  }

  // ============================================================================
  // 1. PROFILE & ONBOARDING
  // ============================================================================

  static async getProfile(): Promise<UserProfileData | null> {
    try {
      if (!isSupabaseConfigured) {
        return null;
      }
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile row doesn't exist yet, insert basic row
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const initial: UserProfileData = {
              id: user.id,
              email: user.email || '',
              fullName: (user.user_metadata?.full_name as string) || (user.email ? user.email.split('@')[0] : 'Trader'),
              stallName: (user.user_metadata?.stall_name as string) || 'My Stall',
              currency: 'USD',
              startingBalance: 0,
              onboardingCompleted: false,
            };
            await supabase.from('profiles').insert([{
              id: initial.id,
              email: initial.email,
              full_name: initial.fullName,
              stall_name: initial.stallName,
              currency: initial.currency,
              starting_balance: initial.startingBalance,
              onboarding_completed: false,
            }]);
            return initial;
          }
        }
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name || '',
        stallName: data.stall_name || '',
        phone: data.phone || '',
        city: data.city || 'Harare (CBD)',
        currency: (data.currency as CurrencyCode) || 'USD',
        startingBalance: Number(data.starting_balance || 0),
        onboardingCompleted: Boolean(data.onboarding_completed),
        avatarUri: data.avatar_uri || undefined,
      };
    } catch {
      return null;
    }
  }

  static async updateProfile(updates: Partial<UserProfileData>): Promise<void> {
    const userId = await this.getUserId();
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.stallName !== undefined) payload.stall_name = updates.stallName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.startingBalance !== undefined) payload.starting_balance = updates.startingBalance;
    if (updates.onboardingCompleted !== undefined) payload.onboarding_completed = updates.onboardingCompleted;
    if (updates.avatarUri !== undefined) payload.avatar_uri = updates.avatarUri;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) throw new Error(error.message);
  }

  static async completeOnboarding(currency: CurrencyCode, startingBalance: number, stallName?: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('profiles')
      .update({
        currency,
        starting_balance: startingBalance,
        stall_name: stallName?.trim() || 'My Stall',
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  }

  // ============================================================================
  // 2. TRANSACTIONS
  // ============================================================================

  static async getTransactions(): Promise<MobileTransaction[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback to local offline cache
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}tx_${userId}`);
        return cached ? JSON.parse(cached) : [];
      }

      const txs: MobileTransaction[] = (data || []).map((row: any) => ({
        id: row.id,
        transactionDate: row.transaction_date,
        description: row.description,
        amount: Number(row.amount),
        currency: row.currency as CurrencyCode,
        direction: row.direction,
        type: row.type,
        category: row.category,
        originalReference: row.original_reference || undefined,
        notes: row.notes || undefined,
        reviewStatus: row.review_status,
      }));

      // Cache locally
      await AsyncStorage.setItem(`${CACHE_PREFIX}tx_${userId}`, JSON.stringify(txs));
      return txs;
    } catch {
      return [];
    }
  }

  static async createTransaction(tx: Omit<MobileTransaction, 'id'>): Promise<MobileTransaction> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        transaction_date: tx.transactionDate,
        description: tx.description.trim(),
        amount: roundMoney(Number(tx.amount)),
        currency: tx.currency,
        direction: tx.direction,
        type: tx.type,
        category: tx.category,
        original_reference: tx.originalReference?.trim() || null,
        notes: tx.notes?.trim() || null,
        review_status: tx.reviewStatus || 'confirmed',
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      transactionDate: data.transaction_date,
      description: data.description,
      amount: Number(data.amount),
      currency: data.currency as CurrencyCode,
      direction: data.direction,
      type: data.type,
      category: data.category,
      originalReference: data.original_reference || undefined,
      notes: data.notes || undefined,
      reviewStatus: data.review_status,
    };
  }

  static async updateTransaction(id: string, updates: Partial<MobileTransaction>): Promise<void> {
    const userId = await this.getUserId();
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.amount !== undefined) payload.amount = roundMoney(Number(updates.amount));
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.direction !== undefined) payload.direction = updates.direction;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
    if (updates.reviewStatus !== undefined) payload.review_status = updates.reviewStatus;

    const { error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  static async deleteTransaction(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  // ============================================================================
  // 3. DEBTS & CUSTOMER CREDIT BOOK
  // ============================================================================

  static async getDebts(): Promise<MobileDebt[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}debts_${userId}`);
        return cached ? JSON.parse(cached) : [];
      }

      const debts: MobileDebt[] = (data || []).map((row: any) => ({
        id: row.id,
        personName: row.person_name,
        direction: row.direction,
        totalAmount: Number(row.total_amount),
        paidAmount: Number(row.paid_amount || 0),
        currency: row.currency as CurrencyCode,
        recordedDate: row.recorded_date,
        dueDate: row.due_date || undefined,
        status: row.status,
        notes: row.notes || undefined,
      }));

      await AsyncStorage.setItem(`${CACHE_PREFIX}debts_${userId}`, JSON.stringify(debts));
      return debts;
    } catch {
      return [];
    }
  }

  static async createDebt(debt: Omit<MobileDebt, 'id'>): Promise<MobileDebt> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('debts')
      .insert([{
        user_id: userId,
        person_name: debt.personName.trim(),
        direction: debt.direction,
        total_amount: roundMoney(Number(debt.totalAmount)),
        paid_amount: roundMoney(Number(debt.paidAmount || 0)),
        currency: debt.currency,
        recorded_date: debt.recordedDate,
        due_date: debt.dueDate || null,
        status: debt.status || 'outstanding',
        notes: debt.notes?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      personName: data.person_name,
      direction: data.direction,
      totalAmount: Number(data.total_amount),
      paidAmount: Number(data.paid_amount || 0),
      currency: data.currency as CurrencyCode,
      recordedDate: data.recorded_date,
      dueDate: data.due_date || undefined,
      status: data.status,
      notes: data.notes || undefined,
    };
  }

  static async recordDebtPayment(debtId: string, paymentAmount: number): Promise<number> {
    const userId = await this.getUserId();
    // 1. Fetch current debt
    const { data: debt, error: fetchErr } = await supabase
      .from('debts')
      .select('*')
      .eq('id', debtId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !debt) throw new Error('Debt record not found');

    const currentPaid = Number(debt.paid_amount || 0);
    const totalAmount = Number(debt.total_amount);
    const outstanding = Math.max(0, totalAmount - currentPaid);
    const actualApplied = Math.min(paymentAmount, outstanding);
    const newPaid = roundMoney(currentPaid + actualApplied);
    const remaining = totalAmount - newPaid;
    const newStatus = remaining <= 0.005 ? 'settled' : 'partially_paid';

    // 2. Update debt
    const { error: updateErr } = await supabase
      .from('debts')
      .update({
        paid_amount: newPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', debtId)
      .eq('user_id', userId);

    if (updateErr) throw new Error(updateErr.message);

    // 3. Automatically record financial transaction
    const isInflow = debt.direction === 'owed_to_business';
    await this.createTransaction({
      transactionDate: new Date().toISOString().split('T')[0],
      description: `${isInflow ? 'Repayment from' : 'Repayment to'} ${debt.person_name}`,
      amount: roundMoney(actualApplied),
      currency: debt.currency as CurrencyCode,
      direction: isInflow ? 'inflow' : 'outflow',
      type: isInflow ? 'business_income' : 'loan_repayment',
      category: isInflow ? 'sales_goods' : 'loan_out',
      notes: `Debt settlement (${newStatus.toUpperCase()})`,
      reviewStatus: 'confirmed',
    });

    return actualApplied;
  }

  static async deleteDebt(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  // ============================================================================
  // 4. INVENTORY & 1-TAP SALE
  // ============================================================================

  static async getInventory(): Promise<InventoryItem[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}inv_${userId}`);
        return cached ? JSON.parse(cached) : [];
      }

      const items: InventoryItem[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        sku: row.sku || '',
        category: row.category || 'General',
        quantity: Number(row.quantity),
        minStockLevel: Number(row.min_stock_level),
        unitCost: Number(row.unit_cost),
        sellingPrice: Number(row.selling_price),
        currency: row.currency as CurrencyCode,
        supplierName: row.supplier_name || '',
        updatedAt: row.updated_at,
      }));

      await AsyncStorage.setItem(`${CACHE_PREFIX}inv_${userId}`, JSON.stringify(items));
      return items;
    } catch {
      return [];
    }
  }

  static async createInventoryItem(item: Omit<InventoryItem, 'id' | 'updatedAt'>): Promise<InventoryItem> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        user_id: userId,
        name: item.name.trim(),
        sku: item.sku?.trim() || null,
        category: item.category?.trim() || 'General',
        quantity: Math.max(0, Math.floor(Number(item.quantity))),
        min_stock_level: Math.max(0, Math.floor(Number(item.minStockLevel || 5))),
        unit_cost: roundMoney(Number(item.unitCost || 0)),
        selling_price: roundMoney(Number(item.sellingPrice || 0)),
        currency: item.currency,
        supplier_name: item.supplierName?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      sku: data.sku || '',
      category: data.category,
      quantity: Number(data.quantity),
      minStockLevel: Number(data.min_stock_level),
      unitCost: Number(data.unit_cost),
      sellingPrice: Number(data.selling_price),
      currency: data.currency as CurrencyCode,
      supplierName: data.supplier_name || '',
      updatedAt: data.updated_at,
    };
  }

  static async quickSaleInventory(id: string): Promise<{ remaining: number; transactionId: string }> {
    const userId = await this.getUserId();
    const { data: item, error: fetchErr } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !item) throw new Error('Inventory item not found');
    if (Number(item.quantity) <= 0) throw new Error('Item is out of stock');

    const newQuantity = Math.max(0, Number(item.quantity) - 1);
    const { error: updateErr } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateErr) throw new Error(updateErr.message);

    // Auto-record transaction
    const tx = await this.createTransaction({
      transactionDate: new Date().toISOString().split('T')[0],
      description: `Sale: 1x ${item.name}`,
      amount: roundMoney(Number(item.selling_price)),
      currency: item.currency as CurrencyCode,
      direction: 'inflow',
      type: 'business_income',
      category: 'sales_goods',
      notes: `Quick sale from inventory (Remaining: ${newQuantity})`,
      reviewStatus: 'confirmed',
    });

    return { remaining: newQuantity, transactionId: tx.id };
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  // ============================================================================
  // 5. INVOICES & QUOTATIONS
  // ============================================================================

  static async getInvoices(): Promise<InvoiceQuote[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}inv_quotes_${userId}`);
        return cached ? JSON.parse(cached) : [];
      }

      const invs: InvoiceQuote[] = (data || []).map((row: any) => ({
        id: row.id,
        referenceNumber: row.reference_number,
        docType: row.doc_type,
        customerName: row.customer_name,
        customerPhone: row.customer_phone || '',
        currency: row.currency as CurrencyCode,
        items: Array.isArray(row.items) ? row.items : [],
        totalAmount: Number(row.total_amount),
        status: row.status,
        dueDate: row.due_date,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      await AsyncStorage.setItem(`${CACHE_PREFIX}inv_quotes_${userId}`, JSON.stringify(invs));
      return invs;
    } catch {
      return [];
    }
  }

  static async createInvoice(quote: Omit<InvoiceQuote, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvoiceQuote> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        user_id: userId,
        reference_number: quote.referenceNumber,
        doc_type: quote.docType,
        customer_name: quote.customerName.trim(),
        customer_phone: quote.customerPhone?.trim() || null,
        currency: quote.currency,
        items: quote.items,
        total_amount: roundMoney(Number(quote.totalAmount)),
        status: quote.status || 'open',
        due_date: quote.dueDate,
        notes: quote.notes?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      referenceNumber: data.reference_number,
      docType: data.doc_type,
      customerName: data.customer_name,
      customerPhone: data.customer_phone || '',
      currency: data.currency as CurrencyCode,
      items: data.items,
      totalAmount: Number(data.total_amount),
      status: data.status,
      dueDate: data.due_date,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  static async deleteInvoice(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  // ============================================================================
  // 6. CONTACTS
  // ============================================================================

  static async getContacts(): Promise<TraderContact[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}contacts_${userId}`);
        return cached ? JSON.parse(cached) : [];
      }

      const contacts: TraderContact[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        phone: row.phone,
        location: row.location || '',
        preferredCurrency: row.preferred_currency as CurrencyCode,
        notes: row.notes || undefined,
        totalVolumeUsd: 0,
        updatedAt: row.updated_at,
      }));

      await AsyncStorage.setItem(`${CACHE_PREFIX}contacts_${userId}`, JSON.stringify(contacts));
      return contacts;
    } catch {
      return [];
    }
  }

  static async createContact(contact: Omit<TraderContact, 'id' | 'updatedAt'>): Promise<TraderContact> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        user_id: userId,
        name: contact.name.trim(),
        role: contact.role,
        phone: contact.phone.trim(),
        location: contact.location?.trim() || null,
        preferred_currency: contact.preferredCurrency || 'USD',
        notes: contact.notes?.trim() || null,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      phone: data.phone,
      location: data.location || '',
      preferredCurrency: data.preferred_currency as CurrencyCode,
      notes: data.notes || undefined,
      totalVolumeUsd: 0,
      updatedAt: data.updated_at,
    };
  }

  static async deleteContact(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }
}
