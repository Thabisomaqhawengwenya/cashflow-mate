-- CashFlow Mate Initial Schema (SQLite and PostgreSQL / Supabase Compatible)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  country TEXT NOT NULL DEFAULT 'ZW',
  preferred_language TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  error_summary TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  account_id TEXT,
  import_job_id TEXT,
  transaction_date TEXT NOT NULL,
  description TEXT NOT NULL,
  original_reference TEXT,
  amount REAL NOT NULL CHECK(amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  direction TEXT NOT NULL CHECK(direction IN ('inflow', 'outflow', 'neutral')),
  type TEXT NOT NULL CHECK(type IN (
    'business_income',
    'business_expense',
    'transfer',
    'loan_received',
    'loan_repayment',
    'owner_contribution',
    'owner_withdrawal',
    'refund',
    'reversal',
    'unknown'
  )),
  category TEXT NOT NULL,
  review_status TEXT NOT NULL CHECK(review_status IN ('confirmed', 'pending_review', 'flagged')),
  ai_confidence REAL,
  ai_reasoning TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (import_job_id) REFERENCES import_jobs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('owed_to_business', 'owed_by_business')),
  total_amount REAL NOT NULL CHECK(total_amount > 0),
  paid_amount REAL NOT NULL DEFAULT 0 CHECK(paid_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  recorded_date TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL CHECK(status IN ('outstanding', 'partially_paid', 'settled', 'written_off')),
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Performance and tenant query indexes
CREATE INDEX IF NOT EXISTS idx_transactions_business_date ON transactions(business_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(business_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_dup_check ON transactions(business_id, original_reference, amount, transaction_date);
CREATE INDEX IF NOT EXISTS idx_debts_business ON debts(business_id, status);
