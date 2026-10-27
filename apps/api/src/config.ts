import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Fail-fast security check: In production, JWT_SECRET must be explicitly provided
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be explicitly defined in production environment variables.');
}

const defaultDevOrigins = [
  'http://localhost:8089',
  'http://localhost:8092',
  'http://localhost:8096',
  'http://localhost:3000',
  'http://127.0.0.1:8089',
  'http://127.0.0.1:8092',
  'http://127.0.0.1:8096',
  'http://127.0.0.1:3000',
];

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'cashflow_mate_dev_secret_key_super_safe_2026',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  dbPath: process.env.DATABASE_PATH || path.resolve(process.cwd(), 'cashflow_mate.db'),
  uploadDir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : defaultDevOrigins,
};
