# CashFlow Mate 🇿🇼
### AI-Powered Mobile Money and Cash-Flow Assistant for Small Traders in Zimbabwe

> **Product Positioning:** *“Understand your money. Make better business decisions.”*  
> **Target Audience:** Informal market vendors, tuck-shop operators, grocery stalls, clothing vendors, and microbusinesses across Zimbabwe.

---

## 1. Problem Statement & Mission

Small informal traders in Zimbabwe frequently manage cash in hand, EcoCash, InnBucks, and occasional bank transfers. Their financial records are scattered across SMS notifications, paper notes, receipt books, and memory. Because of this, answering essential questions is difficult:
- *"How much money came into my tuckshop this week?"*
- *"Am I making a profit or simply taking in a lot of cash?"*
- *"Which customers took mealie-meal on credit and still owe me?"*
- *"Are mobile money fees and kombi transport eating up my margins?"*

**CashFlow Mate** transforms messy mobile money messages, till slips, and spreadsheet records into clean, reliable financial intelligence. It adheres strictly to **Google's Material 3 Expressive** design system, runs **pure deterministic math** for all balances, and provides **grounded plain-language AI explanations** without hallucinations.

---

## 2. Key Features

- **Material 3 Expressive UI:** Built from first principles following Google's M3 Expressive guidelines with high-contrast color roles, distinctive container geometry, tabular numerals (`font-variant-numeric: tabular-nums`), responsive Navigation Rail on desktop/tablet, and a pinned bottom navigation bar on mobile.
- **Deterministic Financial Engine:**
  - Segregates operating trading sales from non-revenue inflows (e.g. Mukando savings pool loans or owner capital).
  - Segregates day-to-day operating expenses from owner drawings or loan principal repayments.
  - Excludes internal float transfers between owned accounts (e.g., cash drawer to EcoCash) from revenue and expense metrics.
  - Zero-drift IEEE-754 epsilon rounding on all monetary calculations.
- **Robust CSV Import Pipeline:**
  - Auto-detects headers or supports manual mapping for EcoCash, InnBucks, Cash till, or bank statements.
  - In-flight date and decimal normalization.
  - Multi-factor duplicate candidate detection (`original_reference`, `amount`, `transaction_date`, `description`).
  - Interactive staging review queue with category previews before committing.
- **Dual-Engine AI Intelligence:**
  - Official Google Gemini API (`gemini-1.5-flash`) integration with structured JSON schemas.
  - Built-in deterministic rule-based local fallback tailored for Zimbabwean merchants (e.g., Bakers Inn bread deliveries, Probrands cooking oil, ZETDC electricity tokens, kombi haulage, EcoCash fees) when offline or without an API key.
  - Zero hallucination guarantee: AI is strictly grounded in pre-calculated verified numbers.
- **Debts & Customer Credit Tracker:**
  - Tracks customer credit ("Owed to Me") and supplier credit / mukando loans ("I Owe").
  - Partial repayment recording with live balance calculations and automated status progression.
- **Turnkey Demo Experience:**
  - Pre-populated realistic Zimbabwean synthetic tuckshop (*Mbare Fresh Produce & Tuckshop* in Harare, Zimbabwe).
  - One-click instant login and one-click demo data reset.
- **Export & Reporting:**
  - Filtered CSV exports, printable operating statements, and full audit history.

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS (configured with Material 3 Expressive tokens & CSS custom properties), Lucide Icons, Recharts.
- **Backend:** Node.js 24, Express, TypeScript, Native `node:sqlite` (zero-dependency relational persistence with WAL mode & foreign keys), JWT, BcryptJS, Multer, CSV-Parse.
- **Shared Domain (`@cashflow-mate/shared`):** Zod schemas, type declarations, decimal rounding utilities, and financial calculation algorithms.
- **Database Migrations:** SQL migration files (`database/migrations/001_initial_schema.sql`) compatible with local SQLite and cloud Supabase / PostgreSQL.

---

## 4. Architecture Overview

```
cashflow-mate/
  apps/
    web/          # React 18 / Vite / Material 3 Expressive UI
    api/          # Express / TypeScript / Native node:sqlite / Gemini API
  packages/
    shared/       # Deterministic calculation engine, schemas, types
  database/
    migrations/   # SQL schemas (SQLite & PostgreSQL / Supabase)
    seed/         # Realistic synthetic Zimbabwean demo data
  docs/           # Architectural, design, security, and project plans
```

---

## 5. Prerequisites

- **Node.js:** v20.0.0 or higher (v24.x recommended).
- **npm:** v10.0.0 or higher.
- No external databases or C++ compilers required (uses native standard library SQLite).

---

## 6. Quick Start & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <repository_url>
cd money-app
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root or in `apps/api/`:
```bash
cp .env.example .env
```
*(Optional: Provide a `GEMINI_API_KEY` to enable live Gemini Flash inferences. If left blank, CashFlow Mate runs seamlessly using its built-in Zimbabwean merchant rule fallback).*

### 3. Run Automated Tests
```bash
# Run calculation engine & API integration suites
npm test
```

### 4. Start the Application
```bash
npm run dev
```
- **Web Interface:** [http://localhost:3000](http://localhost:3000)
- **API Server:** [http://localhost:4000](http://localhost:4000)

---

## 7. Demo Mode Credentials

To test without uploading real records:
1. Open [http://localhost:3000](http://localhost:3000).
2. Click **"Explore Demo"** on the landing page header.
3. You will instantly enter the pre-loaded Harare tuckshop workspace (*Mbare Fresh Produce & Tuckshop*), with EcoCash, InnBucks, Cash Till transactions, debts, and cash flow charts.
4. Alternatively, use manual login:
   - **Email:** `demo@cashflowmate.co.zw`
   - **Password:** `demo1234`

---

## 8. Material 3 Expressive Design System Preview

Navigate to **"Design System"** in the sidebar (or bottom bar on mobile) to view the live component library:
- Semantic color palette roles (`--md-sys-color-primary`, surface container scales, financial inflow/outflow/neutral tokens).
- Accessible form fields, dialogs, badges, and button shapes (Filled, Tonal, Outlined, Pill, FAB).
- Tabular numeral alignment verification.

---

## 9. Security & Privacy Guarantees

- Passwords hashed with `bcryptjs`.
- Tenant isolation enforced at the SQL query level on all endpoints.
- Uploaded CSV files streamed in-memory with strict 5MB limits.
- Sensitive customer phone numbers or identity slips are never transmitted to external AI endpoints.

---

## 10. License & Disclaimers

CashFlow Mate is a recordkeeping and decision-support assistant. It is not an authorized payment clearing house, deposit-taking bank, or financial credit lending provider.
