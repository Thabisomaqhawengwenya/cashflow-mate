# CashFlow Mate — Data Model & Entity Specifications

## 1. Relational Entity Schema

The data model is designed for strict tenant isolation, auditability, and deterministic financial calculations. It is fully compatible with SQLite (local development and offline-first use) and PostgreSQL / Supabase (cloud production).

```
+---------------------------------------------------------------------------------------+
|                                    DATA MODEL ERD                                     |
|                                                                                       |
|   +--------------------+          1:N         +--------------------+                  |
|   |       users        | -------------------> |     businesses     |                  |
|   +--------------------+                      +--------------------+                  |
|   | id (PK)            |                      | id (PK)            |                  |
|   | email (unique)     |                      | user_id (FK)       |                  |
|   | password_hash      |                      | name               |                  |
|   | created_at         |                      | business_type      |                  |
|   +--------------------+                      | currency (default) |                  |
|                                               | timezone           |                  |
|                                               | created_at         |                  |
|                                               +---------+----------+                  |
|                                                         |                             |
|                           +-----------------------------+-----------------------+     |
|                           | 1:N                         | 1:N                   | 1:N |
|                           v                             v                       v     |
|                 +--------------------+        +--------------------+   +------------+ |
|                 |     accounts       |        |    import_jobs     |   |   debts    | |
|                 +--------------------+        +--------------------+   +------------+ |
|                 | id (PK)            |        | id (PK)            |   | id (PK)    | |
|                 | business_id (FK)   |        | business_id (FK)   |   | business_id| |
|                 | name (EcoCash/Cash)|        | filename           |   | person_name| |
|                 | type               |        | row_count          |   | direction  | |
|                 | currency           |        | status             |   | amount     | |
|                 | balance            |        | error_log          |   | currency   | |
|                 +---------+----------+        | created_at         |   | due_date   | |
|                           |                   +---------+----------+   | status     | |
|                           | 1:N                         | 1:N          +------------+ |
|                           v                             v                             |
|                 +--------------------------------------------------+                  |
|                 |                   transactions                   |                  |
|                 +--------------------------------------------------+                  |
|                 | id (PK)                                          |                  |
|                 | business_id (FK)                                 |                  |
|                 | account_id (FK, nullable)                        |                  |
|                 | import_job_id (FK, nullable)                     |                  |
|                 | transaction_date (ISO string)                    |                  |
|                 | description                                      |                  |
|                 | original_reference                               |                  |
|                 | amount (positive decimal, 2 places)              |                  |
|                 | currency (USD, ZWG, etc.)                        |                  |
|                 | direction (inflow / outflow / neutral)           |                  |
|                 | type (business_income, business_expense, etc.)   |                  |
|                 | category (stock, rent, transport, utilities...)  |                  |
|                 | review_status (confirmed, pending_review)        |                  |
|                 | ai_confidence (0.00 - 1.00 or null)              |                  |
|                 | ai_reasoning                                     |                  |
|                 | notes                                            |                  |
|                 | created_at, updated_at                           |                  |
|                 +--------------------------------------------------+                  |
+---------------------------------------------------------------------------------------+
```

## 2. Table Definitions & Constraints

### 2.1 `users`
- `id`: TEXT PRIMARY KEY (UUID v4)
- `email`: TEXT UNIQUE NOT NULL
- `password_hash`: TEXT NOT NULL
- `name`: TEXT
- `created_at`: TEXT NOT NULL (ISO-8601 UTC)

### 2.2 `businesses`
- `id`: TEXT PRIMARY KEY (UUID v4)
- `user_id`: TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
- `name`: TEXT NOT NULL
- `business_type`: TEXT NOT NULL (e.g., `tuckshop`, `market_vendor`, `clothing_stall`, `service`, `retail`)
- `currency`: TEXT NOT NULL DEFAULT 'USD'
- `country`: TEXT NOT NULL DEFAULT 'ZW'
- `preferred_language`: TEXT NOT NULL DEFAULT 'en'
- `created_at`: TEXT NOT NULL

### 2.3 `accounts`
- `id`: TEXT PRIMARY KEY
- `business_id`: TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
- `name`: TEXT NOT NULL (e.g. "EcoCash Merchant", "InnBucks USD", "Cash Register Drawer", "Stanbic USD")
- `type`: TEXT NOT NULL (`mobile_money`, `cash`, `bank`)
- `currency`: TEXT NOT NULL DEFAULT 'USD'
- `created_at`: TEXT NOT NULL

### 2.4 `import_jobs`
- `id`: TEXT PRIMARY KEY
- `business_id`: TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
- `filename`: TEXT NOT NULL
- `total_rows`: INTEGER NOT NULL DEFAULT 0
- `imported_rows`: INTEGER NOT NULL DEFAULT 0
- `skipped_rows`: INTEGER NOT NULL DEFAULT 0
- `duplicate_rows`: INTEGER NOT NULL DEFAULT 0
- `status`: TEXT NOT NULL (`pending`, `completed`, `failed`)
- `error_summary`: TEXT
- `created_at`: TEXT NOT NULL

### 2.5 `transactions`
- `id`: TEXT PRIMARY KEY
- `business_id`: TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
- `account_id`: TEXT REFERENCES accounts(id) ON DELETE SET NULL
- `import_job_id`: TEXT REFERENCES import_jobs(id) ON DELETE SET NULL
- `transaction_date`: TEXT NOT NULL (YYYY-MM-DD or ISO-8601)
- `description`: TEXT NOT NULL
- `original_reference`: TEXT
- `amount`: REAL NOT NULL CHECK(amount >= 0)
- `currency`: TEXT NOT NULL DEFAULT 'USD'
- `direction`: TEXT NOT NULL CHECK(direction IN ('inflow', 'outflow', 'neutral'))
- `type`: TEXT NOT NULL CHECK(type IN (
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
  ))
- `category`: TEXT NOT NULL
- `review_status`: TEXT NOT NULL CHECK(review_status IN ('confirmed', 'pending_review', 'flagged'))
- `ai_confidence`: REAL
- `ai_reasoning`: TEXT
- `notes`: TEXT
- `created_at`: TEXT NOT NULL
- `updated_at`: TEXT NOT NULL

**Indexes:**
- `idx_transactions_business_date`: `(business_id, transaction_date DESC)`
- `idx_transactions_category`: `(business_id, category)`
- `idx_transactions_duplicate_check`: `(business_id, original_reference, amount, transaction_date)`

### 2.6 `debts`
- `id`: TEXT PRIMARY KEY
- `business_id`: TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE
- `person_name`: TEXT NOT NULL
- `direction`: TEXT NOT NULL CHECK(direction IN ('owed_to_business', 'owed_by_business'))
- `total_amount`: REAL NOT NULL CHECK(total_amount > 0)
- `paid_amount`: REAL NOT NULL DEFAULT 0 CHECK(paid_amount >= 0)
- `currency`: TEXT NOT NULL DEFAULT 'USD'
- `recorded_date`: TEXT NOT NULL
- `due_date`: TEXT
- `status`: TEXT NOT NULL CHECK(status IN ('outstanding', 'partially_paid', 'settled', 'written_off'))
- `notes`: TEXT
- `created_at`: TEXT NOT NULL
