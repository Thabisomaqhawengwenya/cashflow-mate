import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { DebtService } from '../services/debts';
import { debtSchema, debtPaymentSchema } from '@cashflow-mate/shared';

export const debtRouter = Router();

debtRouter.use(requireAuth);

debtRouter.get('/', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const { direction, status } = req.query;
    const debts = DebtService.list(businessId, {
      direction: direction as string,
      status: status as string
    });
    res.json(debts);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch debts' });
  }
});

debtRouter.post('/', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const validated = debtSchema.parse(req.body);
    const created = DebtService.create(businessId, validated);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid debt parameters' });
  }
});

debtRouter.post('/:id/payment', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const validated = debtPaymentSchema.parse(req.body);
    const updated = DebtService.recordPayment(businessId, req.params.id, validated.paymentAmount);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to record debt repayment' });
  }
});

debtRouter.delete('/:id', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const deleted = DebtService.delete(businessId, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Debt record not found' });
      return;
    }
    res.json({ success: true, message: 'Debt record deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete debt record' });
  }
});
