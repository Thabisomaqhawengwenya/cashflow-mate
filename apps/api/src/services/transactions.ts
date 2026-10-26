import { randomUUID } from 'crypto';
import { getDb } from '../db';
import {
  Transaction,
  FinancialSummary,
  calculateFinancialSummary,
  CurrencyCode,
  TransactionType,
  TransactionDirection,
  CategoryKey,
  ReviewStatus
} from '@cashflow-mate/shared';

export interface ListTransactionsFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: string;
  direction?: string;
  reviewStatus?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class TransactionService {
  static list(businessId: string, filter: ListTransactionsFilter = {}) {
    const db = getDb();
    const conditions: string[] = ['t.business_id = ?'];
    const params: any[] = [businessId];

    if (filter.startDate) {
      conditions.push('t.transaction_date >= ?');
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push('t.transaction_date <= ?');
      params.push(filter.endDate);
    }
    if (filter.category) {
      conditions.push('t.category = ?');
      params.push(filter.category);
    }
    if (filter.type) {
      conditions.push('t.type = ?');
      params.push(filter.type);
    }
    if (filter.direction) {
      conditions.push('t.direction = ?');
      params.push(filter.direction);
    }
    if (filter.reviewStatus) {
      conditions.push('t.review_status = ?');
      params.push(filter.reviewStatus);
    }
    if (filter.search) {
      conditions.push('(t.description LIKE ? OR t.original_reference LIKE ? OR t.notes LIKE ?)');
      const s = `%${filter.search}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.join(' AND ');
    const countSql = `SELECT COUNT(*) as total FROM transactions t WHERE ${whereClause}`;
    const countRow = db.prepare(countSql).get(...params) as { total: number };

    let querySql = `
      SELECT t.*, a.name as account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE ${whereClause}
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `;

    if (filter.limit) {
      querySql += ' LIMIT ? OFFSET ?';
      params.push(filter.limit, filter.offset || 0);
    }

    const rows = db.prepare(querySql).all(...params) as any[];

    const transactions: Transaction[] = rows.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      accountId: r.account_id,
      accountName: r.account_name,
      importJobId: r.import_job_id,
      transactionDate: r.transaction_date,
      description: r.description,
      originalReference: r.original_reference,
      amount: r.amount,
      currency: r.currency as CurrencyCode,
      direction: r.direction as TransactionDirection,
      type: r.type as TransactionType,
      category: r.category as CategoryKey,
      reviewStatus: r.review_status as ReviewStatus,
      aiConfidence: r.ai_confidence,
      aiReasoning: r.ai_reasoning,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    return {
      total: countRow.total,
      transactions
    };
  }

  static getById(businessId: string, id: string): Transaction | null {
    const db = getDb();
    const row = db.prepare(`
      SELECT t.*, a.name as account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.business_id = ? AND t.id = ?
    `).get(businessId, id) as any;

    if (!row) return null;

    return {
      id: row.id,
      businessId: row.business_id,
      accountId: row.account_id,
      accountName: row.account_name,
      importJobId: row.import_job_id,
      transactionDate: row.transaction_date,
      description: row.description,
      originalReference: row.original_reference,
      amount: row.amount,
      currency: row.currency as CurrencyCode,
      direction: row.direction as TransactionDirection,
      type: row.type as TransactionType,
      category: row.category as CategoryKey,
      reviewStatus: row.review_status as ReviewStatus,
      aiConfidence: row.ai_confidence,
      aiReasoning: row.ai_reasoning,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static create(businessId: string, data: Partial<Transaction>): Transaction {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO transactions (
        id, business_id, account_id, transaction_date, description, original_reference,
        amount, currency, direction, type, category, review_status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      businessId,
      data.accountId || null,
      data.transactionDate || now.substring(0, 10),
      data.description || 'Manual transaction',
      data.originalReference || null,
      data.amount || 0,
      data.currency || 'USD',
      data.direction || 'inflow',
      data.type || 'business_income',
      data.category || 'uncategorized',
      data.reviewStatus || 'confirmed',
      data.notes || null,
      now,
      now
    );

    return this.getById(businessId, id)!;
  }

  static update(businessId: string, id: string, data: Partial<Transaction>): Transaction {
    const db = getDb();
    const existing = this.getById(businessId, id);
    if (!existing) {
      throw new Error('Transaction not found or unauthorized.');
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE transactions SET
        category = COALESCE(?, category),
        type = COALESCE(?, type),
        direction = COALESCE(?, direction),
        description = COALESCE(?, description),
        amount = COALESCE(?, amount),
        review_status = COALESCE(?, review_status),
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE business_id = ? AND id = ?
    `).run(
      data.category || null,
      data.type || null,
      data.direction || null,
      data.description || null,
      data.amount !== undefined ? data.amount : null,
      data.reviewStatus || null,
      data.notes !== undefined ? data.notes : null,
      now,
      businessId,
      id
    );

    return this.getById(businessId, id)!;
  }

  static delete(businessId: string, id: string): boolean {
    const db = getDb();
    const info = db.prepare('DELETE FROM transactions WHERE business_id = ? AND id = ?').run(businessId, id);
    return info.changes > 0;
  }

  static getSummary(
    businessId: string,
    options: {
      periodType?: 'this_month' | 'last_month' | 'this_week' | 'last_week' | 'custom' | 'all';
      currency?: CurrencyCode;
      startDate?: string;
      endDate?: string;
    } = {}
  ): FinancialSummary {
    const currency = options.currency || 'USD';
    const now = new Date();

    let startDate = options.startDate || '';
    let endDate = options.endDate || '';
    let label = 'Custom Period';
    let priorStartDate = '';
    let priorEndDate = '';
    let priorLabel = 'Prior Period';

    const periodType = options.periodType || 'this_month';

    if (periodType === 'this_month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      startDate = new Date(year, month, 1).toISOString().substring(0, 10);
      endDate = new Date(year, month + 1, 0).toISOString().substring(0, 10);
      label = 'This Month';

      // Prior month
      priorStartDate = new Date(year, month - 1, 1).toISOString().substring(0, 10);
      priorEndDate = new Date(year, month, 0).toISOString().substring(0, 10);
      priorLabel = 'Last Month';
    } else if (periodType === 'last_month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      startDate = new Date(year, month - 1, 1).toISOString().substring(0, 10);
      endDate = new Date(year, month, 0).toISOString().substring(0, 10);
      label = 'Last Month';

      // 2 months ago
      priorStartDate = new Date(year, month - 2, 1).toISOString().substring(0, 10);
      priorEndDate = new Date(year, month - 1, 0).toISOString().substring(0, 10);
      priorLabel = 'Two Months Ago';
    } else if (periodType === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      startDate = monday.toISOString().substring(0, 10);
      endDate = sunday.toISOString().substring(0, 10);
      label = 'This Week';

      // Last week
      const priorMonday = new Date(monday);
      priorMonday.setDate(monday.getDate() - 7);
      const priorSunday = new Date(priorMonday);
      priorSunday.setDate(priorMonday.getDate() + 6);
      priorStartDate = priorMonday.toISOString().substring(0, 10);
      priorEndDate = priorSunday.toISOString().substring(0, 10);
      priorLabel = 'Last Week';
    } else if (periodType === 'all') {
      startDate = '2000-01-01';
      endDate = '2099-12-31';
      label = 'All Time';
    }

    const currentRows = this.list(businessId, { startDate, endDate }).transactions;
    const priorRows = priorStartDate && priorEndDate ? this.list(businessId, { startDate: priorStartDate, endDate: priorEndDate }).transactions : [];

    return calculateFinancialSummary(currentRows, {
      currency,
      startDate,
      endDate,
      periodLabel: label,
      priorPeriodTransactions: priorRows,
      priorPeriodLabel: priorLabel
    });
  }
}
