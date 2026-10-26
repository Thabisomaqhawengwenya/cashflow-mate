import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth';
import { registerSchema, loginSchema } from '@cashflow-mate/shared';
import { requireAuth } from '../middleware/auth';
import { getDb } from '../db';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await AuthService.register(validated);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await AuthService.login(validated.email, validated.password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

authRouter.post('/demo', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = AuthService.demoLogin();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Demo session initialization failed' });
  }
});

authRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user!.userId) as any;
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user!.businessId) as any;

  if (!user || !business) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at
    },
    business: {
      id: business.id,
      userId: business.user_id,
      name: business.name,
      businessType: business.business_type,
      currency: business.currency,
      country: business.country,
      preferredLanguage: business.preferred_language,
      createdAt: business.created_at
    }
  });
});
