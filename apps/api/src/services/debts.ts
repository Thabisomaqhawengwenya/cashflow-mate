import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { Debt, CurrencyCode, roundCurrency } from '@cashflow-mate/shared';

export class DebtService {
  static list(businessId: string, filter: { direction?: string; status?: string } = {}): Debt[] {
    const db = getDb();
    const conditions: string[] = ['business_id = ?'];
    const params: any[] = [businessId];

    if (filter.direction) {
      conditions.push('direction = ?');
      params.push(filter.direction);
    }
    if (filter.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }

    const sql = `
      SELECT * FROM debts
      WHERE ${conditions.join(' AND ')}
      ORDER BY status ASC, due_date ASC, recorded_date DESC
    `;

    const rows = db.prepare(sql).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      personName: r.person_name,
      direction: r.direction,
      totalAmount: r.total_amount,
      paidAmount: r.paid_amount,
      currency: r.currency as CurrencyCode,
      recordedDate: r.recorded_date,
      dueDate: r.due_date,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at
    }));
  }

  static getById(businessId: string, id: string): Debt | null {
    const db = getDb();
    const r = db.prepare('SELECT * FROM debts WHERE business_id = ? AND id = ?').get(businessId, id) as any;
    if (!r) return null;

    return {
      id: r.id,
      businessId: r.business_id,
      personName: r.person_name,
      direction: r.direction,
      totalAmount: r.total_amount,
      paidAmount: r.paid_amount,
      currency: r.currency as CurrencyCode,
      recordedDate: r.recorded_date,
      dueDate: r.due_date,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at
    };
  }

  static create(businessId: string, data: {
    personName: string;
    direction: 'owed_to_business' | 'owed_by_business';
    totalAmount: number;
    currency?: CurrencyCode;
    recordedDate?: string;
    dueDate?: string;
    notes?: string;
  }): Debt {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    const recordedDate = data.recordedDate || now.substring(0, 10);
    const total = roundCurrency(data.totalAmount);

    db.prepare(`
      INSERT INTO debts (
        id, business_id, person_name, direction, total_amount, paid_amount,
        currency, recorded_date, due_date, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      businessId,
      data.personName,
      data.direction,
      total,
      0,
      data.currency || 'USD',
      recordedDate,
      data.dueDate || null,
      'outstanding',
      data.notes || null,
      now
    );

    return this.getById(businessId, id)!;
  }

  static recordPayment(businessId: string, id: string, paymentAmount: number): Debt {
    const db = getDb();
    const existing = this.getById(businessId, id);
    if (!existing) {
      throw new Error('Debt record not found.');
    }

    const newPaid = roundCurrency(existing.paidAmount + paymentAmount);
    let newStatus: Debt['status'] = 'partially_paid';

    if (newPaid >= existing.totalAmount) {
      newStatus = 'settled';
    }

    db.prepare(`
      UPDATE debts SET
        paid_amount = ?,
        status = ?
      WHERE business_id = ? AND id = ?
    `).run(newPaid, newStatus, businessId, id);

    return this.getById(businessId, id)!;
  }

  static delete(businessId: string, id: string): boolean {
    const db = getDb();
    const info = db.prepare('DELETE FROM debts WHERE business_id = ? AND id = ?').run(businessId, id);
    return info.changes > 0;
  }
}
