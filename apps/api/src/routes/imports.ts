import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { ImportService } from '../services/imports';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const importRouter = Router();

importRouter.use(requireAuth);

importRouter.post('/preview', upload.single('file'), (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    let csvString = '';

    if (req.file) {
      csvString = req.file.buffer.toString('utf8');
    } else if (req.body.csvContent) {
      csvString = req.body.csvContent;
    } else {
      res.status(400).json({ error: 'Please select a CSV file or provide CSV text content.' });
      return;
    }

    const customMapping = req.body.mapping ? JSON.parse(req.body.mapping) : undefined;
    const defaultCurrency = req.body.defaultCurrency || 'USD';

    const result = ImportService.parseAndPreview(businessId, csvString, customMapping, defaultCurrency);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to parse CSV file.' });
  }
});

importRouter.post('/commit', (req: Request, res: Response): void => {
  try {
    const businessId = req.user!.businessId;
    const { filename, rows, skipDuplicates } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: 'No transaction rows provided for commit.' });
      return;
    }

    const result = ImportService.commitImport(
      businessId,
      filename || 'imported_transactions.csv',
      rows,
      skipDuplicates !== false
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to commit imported transactions.' });
  }
});

importRouter.get('/template', (_req: Request, res: Response): void => {
  const sampleCsv = `Date,Description,Amount,Type,Reference,Currency
2026-10-25,EcoCash Customer Payment - Mealie Meal,18.50,Income,MP261025.101,USD
2026-10-25,Bakers Inn Bread Delivery 30 loaves,33.00,Expense,BP261025.044,USD
2026-10-25,Kombi Haulage from Musika,8.00,Expense,TR-1025-09,USD
2026-10-26,ZETDC Prepaid Electricity Token,15.00,Expense,ZT-1026-01,USD
2026-10-26,Cash Sales Counter Grocery,65.00,Income,CSH-1026-01,USD
2026-10-26,Transfer Cash Drawer to EcoCash,50.00,Transfer,TRF-1026-02,USD`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="cashflow-mate-sample-template.csv"');
  res.send(sampleCsv);
});
