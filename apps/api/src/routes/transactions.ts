import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { TransactionService } from '../services/transactions';
import { manualTransactionSchema } from '@cashflow-mate/shared';

export const transactionRouter = Router();

transactionRouter.use(requireAuth);

transactionRouter.get('/', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const {
      startDate,
      endDate,
      category,
      type,
      direction,
      reviewStatus,
      search,
      limit,
      offset
    } = req.query;

    const result = TransactionService.list(businessId, {
      startDate: startDate as string,
      endDate: endDate as string,
      category: category as string,
      type: type as string,
      direction: direction as string,
      reviewStatus: reviewStatus as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch transactions' });
  }
});

transactionRouter.get('/summary', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const { periodType, currency, startDate, endDate } = req.query;

    const summary = TransactionService.getSummary(businessId, {
      periodType: (periodType as any) || 'this_month',
      currency: (currency as any) || 'USD',
      startDate: startDate as string,
      endDate: endDate as string
    });

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to calculate financial summary' });
  }
});

transactionRouter.get('/export/csv', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const result = TransactionService.list(businessId, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      category: req.query.category as string,
      reviewStatus: req.query.reviewStatus as string
    });

    const headers = [
      'Date',
      'Description',
      'Amount',
      'Currency',
      'Direction',
      'Type',
      'Category',
      'Review Status',
      'Original Reference',
      'Notes'
    ];

    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      return `"${str.replace(/"/g, '""')}"`;
    };

    const lines = [headers.join(',')];
    for (const t of result.transactions) {
      lines.push([
        escapeCsv(t.transactionDate),
        escapeCsv(t.description),
        t.amount.toFixed(2),
        escapeCsv(t.currency),
        escapeCsv(t.direction),
        escapeCsv(t.type),
        escapeCsv(t.category),
        escapeCsv(t.reviewStatus),
        escapeCsv(t.originalReference),
        escapeCsv(t.notes)
      ].join(','));
    }

    const csvData = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="cashflow-mate-transactions.csv"');
    res.send(csvData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'CSV export failed' });
  }
});

transactionRouter.get('/:id', (req: Request, res: Response): void => {
  const businessId = req.user!.businessId;
  const transaction = TransactionService.getById(businessId, req.params.id);

  if (!transaction) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  res.json(transaction);
});

transactionRouter.post('/', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const validated = manualTransactionSchema.parse(req.body);
    const created = TransactionService.create(businessId, {
      ...validated,
      category: validated.category as any
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid transaction data' });
  }
});

transactionRouter.put('/:id', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const updated = TransactionService.update(businessId, req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update transaction' });
  }
});

transactionRouter.delete('/:id', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const deleted = TransactionService.delete(businessId, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Transaction not found or already deleted' });
      return;
    }
    res.json({ success: true, message: 'Transaction removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete transaction' });
  }
});
