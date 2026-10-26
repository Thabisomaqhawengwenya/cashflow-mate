import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getDb, resetDemoData } from '../db';
import { businessOnboardingSchema } from '@cashflow-mate/shared';

export const businessRouter = Router();

businessRouter.use(requireAuth);

businessRouter.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user!.businessId) as any;
  if (!business) {
    res.status(404).json({ error: 'Business not found' });
    return;
  }
  res.json({
    id: business.id,
    userId: business.user_id,
    name: business.name,
    businessType: business.business_type,
    currency: business.currency,
    country: business.country,
    preferredLanguage: business.preferred_language,
    createdAt: business.created_at
  });
});

businessRouter.put('/', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const validated = businessOnboardingSchema.parse(req.body);
    const db = getDb();

    db.prepare(`
      UPDATE businesses SET
        name = ?,
        business_type = ?,
        currency = ?,
        country = ?,
        preferred_language = ?
      WHERE id = ?
    `).run(
      validated.name,
      validated.businessType,
      validated.currency,
      validated.country,
      validated.preferredLanguage,
      businessId
    );

    const updated = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId) as any;
    res.json({
      id: updated.id,
      userId: updated.user_id,
      name: updated.name,
      businessType: updated.business_type,
      currency: updated.currency,
      country: updated.country,
      preferredLanguage: updated.preferred_language,
      createdAt: updated.created_at
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update business profile' });
  }
});

businessRouter.post('/reset-demo', (_req: Request, res: Response): void => {
  try {
    resetDemoData();
    res.json({ success: true, message: 'Demo data has been reset to default synthetic records.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset demo dataset' });
  }
});
