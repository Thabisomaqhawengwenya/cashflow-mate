import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { AIService } from '../services/ai';
import { TransactionService } from '../services/transactions';

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.post('/categorize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, amount, direction } = req.body;
    if (!description) {
      res.status(400).json({ error: 'Description is required' });
      return;
    }

    const result = await AIService.categorize(description, amount || 0, direction);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI categorization failed' });
  }
});

aiRouter.post('/explain', async (req: Request, res: Response): Promise<void> => {
  try {
    const businessId = req.user!.businessId;
    const { periodType, question, language, currency } = req.body;

    // Fetch verified deterministic summary from code engine
    const summary = TransactionService.getSummary(businessId, {
      periodType: periodType || 'this_month',
      currency: currency || 'USD'
    });

    const explanation = await AIService.explainFinances(summary, question, language || 'en');
    res.json({
      summary,
      ...explanation
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate financial explanation' });
  }
});
