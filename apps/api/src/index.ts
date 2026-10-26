import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { getDb } from './db';
import { authRouter } from './routes/auth';
import { transactionRouter } from './routes/transactions';
import { importRouter } from './routes/imports';
import { aiRouter } from './routes/ai';
import { debtRouter } from './routes/debts';
import { businessRouter } from './routes/business';

export const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    product: 'CashFlow Mate API',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(config.geminiApiKey)
  });
});

// Route Modules
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/imports', importRouter);
app.use('/api/ai', aiRouter);
app.use('/api/debts', debtRouter);
app.use('/api/business', businessRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Initialize database on startup
getDb();

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[CashFlow Mate API] Running on http://localhost:${config.port}`);
  });
}
