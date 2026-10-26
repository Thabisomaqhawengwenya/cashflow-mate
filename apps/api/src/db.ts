import fs from 'fs';
import path from 'path';
import { config } from './config';

// Dynamically load native node:sqlite to prevent any test runner/bundler module-specifier rewriting
// @ts-ignore
const { DatabaseSync } = require('node:sqlite');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    dbInstance = new DatabaseSync(config.dbPath);
    // Enable WAL mode & foreign keys
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');

    initSchema(dbInstance);
  }
  return dbInstance;
}

export function initSchema(db: DatabaseSync): void {
  const migrationPath = path.resolve(__dirname, '../../../database/migrations/001_initial_schema.sql');
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    db.exec(migrationSql);
  } else {
    console.warn(`Migration file not found at ${migrationPath}`);
  }

  // Check if users table is empty; if so, run initial seed
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = countStmt.get() as { count: number } | undefined;
  if (!result || result.count === 0) {
    seedDatabase(db);
  }
}

export function seedDatabase(db?: DatabaseSync): void {
  const activeDb = db || getDb();
  const seedPath = path.resolve(__dirname, '../../../database/seed/synthetic_seed.sql');
  if (fs.existsSync(seedPath)) {
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    activeDb.exec(seedSql);
    console.log('Seeded database with realistic Zimbabwean tuckshop demo data.');
  }
}

// Reset database for test environments or explicit demo resets
export function resetDemoData(businessId: string = 'biz_demo_001'): void {
  const db = getDb();
  // Clear non-demo transactions or reset demo business
  seedDatabase(db);
}
