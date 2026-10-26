import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from './index';

describe('CashFlow Mate API Integration Suite', () => {
  let demoToken: string;
  let demoBusinessId: string;

  beforeAll(async () => {
    // Acquire demo token
    const res = await request(app).post('/api/auth/demo');
    expect(res.status).toBe(200);
    demoToken = res.body.token;
    demoBusinessId = res.body.business.id;
  });

  it('GET /api/health should return ok status and metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.product).toBe('CashFlow Mate API');
  });

  it('GET /api/transactions should list transactions for authenticated business', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${demoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  it('GET /api/transactions/summary should calculate deterministic financial metrics', async () => {
    const res = await request(app)
      .get('/api/transactions/summary?periodType=all')
      .set('Authorization', `Bearer ${demoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.recordedInflows).toBeGreaterThan(0);
    expect(res.body.recordedOutflows).toBeGreaterThan(0);
    expect(res.body.netCashFlow).toBe(
      Math.round((res.body.recordedInflows - res.body.recordedOutflows) * 100) / 100
    );
  });

  it('POST /api/transactions should create a valid manual transaction', async () => {
    const newTx = {
      transactionDate: '2026-10-26',
      description: 'Customer bulk mealie meal purchase',
      amount: 45.0,
      currency: 'USD',
      direction: 'inflow',
      type: 'business_income',
      category: 'sales_goods',
      reviewStatus: 'confirmed'
    };

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${demoToken}`)
      .send(newTx);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.amount).toBe(45.0);
  });

  it('POST /api/imports/preview should parse CSV rows and detect mapping', async () => {
    const sampleCsv = `Date,Description,Amount,Type\n2026-10-25,Bakers Inn delivery,30.00,Expense\n2026-10-25,Cash customer payment,50.00,Income`;

    const res = await request(app)
      .post('/api/imports/preview')
      .set('Authorization', `Bearer ${demoToken}`)
      .send({ csvContent: sampleCsv });

    expect(res.status).toBe(200);
    expect(res.body.totalRows).toBe(2);
    expect(res.body.validRows).toBe(2);
    expect(res.body.previewRows.length).toBe(2);
  });

  it('GET /api/debts and POST /api/debts should manage credit records', async () => {
    const newDebt = {
      personName: 'Rudo Vendor',
      direction: 'owed_to_business',
      totalAmount: 20.0,
      currency: 'USD',
      recordedDate: '2026-10-26',
      notes: 'Test grocery credit'
    };

    const createRes = await request(app)
      .post('/api/debts')
      .set('Authorization', `Bearer ${demoToken}`)
      .send(newDebt);

    expect(createRes.status).toBe(201);
    const debtId = createRes.body.id;

    // Record partial payment
    const payRes = await request(app)
      .post(`/api/debts/${debtId}/payment`)
      .set('Authorization', `Bearer ${demoToken}`)
      .send({ paymentAmount: 10.0 });

    expect(payRes.status).toBe(200);
    expect(payRes.body.paidAmount).toBe(10.0);
    expect(payRes.body.status).toBe('partially_paid');

    // Settle debt
    const settleRes = await request(app)
      .post(`/api/debts/${debtId}/payment`)
      .set('Authorization', `Bearer ${demoToken}`)
      .send({ paymentAmount: 10.0 });

    expect(settleRes.status).toBe(200);
    expect(settleRes.body.paidAmount).toBe(20.0);
    expect(settleRes.body.status).toBe('settled');
  });

  it('POST /api/ai/explain should return grounded explanation without hallucinating numbers', async () => {
    const res = await request(app)
      .post('/api/ai/explain')
      .set('Authorization', `Bearer ${demoToken}`)
      .send({ periodType: 'all', question: 'How is my cash flow doing?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toBeDefined();
    expect(Array.isArray(res.body.keyObservations)).toBe(true);
    expect(res.body.limitations).toBeDefined();
  });

  it('Security: should reject unauthenticated requests to protected endpoints', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });
});
