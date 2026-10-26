import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'cashflow_mate_dev_secret_key_super_safe_2026',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  dbPath: process.env.DATABASE_PATH || path.resolve(process.cwd(), 'cashflow_mate.db'),
  uploadDir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
