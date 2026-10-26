# CashFlow Mate — System Architecture

## 1. High-Level Architecture Diagram

```
+------------------------------------------------------------------------+
|                                Client Layer                            |
|  +------------------------------------------------------------------+  |
|  |           React 18 + Vite + TypeScript (Single Page App)         |  |
|  |  * Material 3 Expressive Design System (M3 Tokens, Light/Dark)   |  |
|  |  * Responsive Layout: Navigation Rail (Desktop) / Bottom Nav     |  |
|  |  * Modules: Overview, Transactions, Import, Insights, Debts,     |  |
|  |             Reports, Business Profile, Settings, Design Preview  |  |
|  +------------------------------------------------------------------+  |
+-----------------------------------^------------------------------------+
                                    | REST API / JSON (with JWT auth)
+-----------------------------------v------------------------------------+
|                             API Service Layer                          |
|  +------------------------------------------------------------------+  |
|  |                Node.js + Express + TypeScript API                |  |
|  |                                                                  |  |
|  |  [Auth Middleware] --> Verifies JWT & binds authorized business  |  |
|  |                                                                  |  |
|  |  [Deterministic Calculation Engine]                              |  |
|  |    * Inflow / Outflow aggregations (excl. internal transfers)   |  |
|  |    * Net Cash Flow vs Operating Profit calculations              |  |
|  |    * Period-over-period delta & percentage comparisons           |  |
|  |                                                                  |  |
|  |  [Transaction Import Engine]                                     |  |
|  |    * Deterministic CSV parser & column mapper                    |  |
|  |    * Normalization & multi-factor duplicate detection            |  |
|  |    * Audit trail & batch commit                                  |  |
|  |                                                                  |  |
|  |  [AI Integration Service]                                        |  |
|  |    * Google Gemini API (@google/genai) integration              |  |
|  |    * Strict JSON Schema validation via Zod                       |  |
|  |    * Deterministic Rule-Based Fallback Engine (runs offline)     |  |
|  +------------------------------------------------------------------+  |
+-----------------------------------^------------------------------------+
                                    |
+-----------------------------------v------------------------------------+
|                            Persistence Layer                           |
|  +------------------------------------------------------------------+  |
|  |   SQLite Relational DB (better-sqlite3 / sqlite3)                |  |
|  |   * Strict foreign keys, WAL mode, transactional isolation       |  |
|  |   * Multi-tenant data segregation by business_id                 |  |
|  |   * Supabase / PostgreSQL compatible schema & migrations         |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
```

## 2. Key Modules & Responsibilities

### 2.1 Shared Package (`@cashflow-mate/shared`)
- **Types & Enums**: `TransactionType`, `CategoryKey`, `ReviewStatus`, `CurrencyCode`, `PeriodType`, `DebtDirection`.
- **Validation Schemas**: Zod schemas for user registration, business onboarding, manual transaction input, CSV mapping configuration, and AI response structures.
- **Financial Calculation Helpers**: Shared decimal math conventions and currency formatters.

### 2.2 Financial Calculation Engine (`api/src/financial`)
- **Strict Separation of Concerns**: Math is completely decoupled from UI and LLMs.
- **Rules**:
  - *Internal transfers* (`transfer`) between owned accounts (e.g. EcoCash to Cash drawer) are neutral cash movements; never double-counted as income or business expenses.
  - *Loan proceeds* (`loan_received`) and *owner capital contributions* (`owner_contribution`) count as cash inflows, but are explicitly segregated from operating revenue.
  - *Loan principal repayments* (`loan_repayment`) and *owner drawings* (`owner_withdrawal`) count as cash outflows, but are segregated from operating expenses.
  - *Estimated Operating Profit* = `Operating Revenue - Operating Expenses` (with disclosure on missing inventory or unpaid invoices).

### 2.3 Import Pipeline (`api/src/services/imports`)
1. **Upload Validation**: File size limit (5MB), MIME type check (CSV/text).
2. **Deterministic Parse**: Streamed parsing extracting raw rows and headers.
3. **Column Mapping**: User-guided or auto-detected header mapping (`date`, `description`, `amount`, `type`, `reference`, `source`).
4. **Normalization**: Clean date strings into ISO format, normalize amounts into minor units / decimal precision, handle debit/credit column variations.
5. **Duplicate Detection**: Composite fingerprint check: `(business_id, source, reference, date, amount)`.
6. **Preview & Review Queue**: Flags unparseable lines, duplicates, and unclassified entries.
7. **Atomic Commit**: Staged commit inside a database transaction.

### 2.4 AI Integration Layer (`api/src/services/ai`)
- **Provider Abstraction**: Common interface `AIServiceInterface` with methods `categorizeTransaction(desc, amount)` and `explainFinancialPerformance(metrics, question, language)`.
- **Primary Driver**: Google Gemini API with system instructions enforcing JSON schema output and ground-truth constraint adherence.
- **Fallback Driver**: Built-in deterministic regex & merchant dictionary tailored for Zimbabwean trade patterns (e.g. "Bakers Inn", "Econet Airtime", "City of Harare", "ZETDC Tokens", "OK Zimbabwe", "Total Fuel").
- **Zero Hallucination Guarantee**: Explanations only describe pre-computed numbers delivered in the context prompt. The AI is never prompted to compute mathematical sums or balances.
