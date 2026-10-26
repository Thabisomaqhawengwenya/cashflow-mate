# CashFlow Mate — Master Project Plan

> **Product:** CashFlow Mate (AI-Powered Mobile Money & Cash-Flow Assistant for Small Traders in Zimbabwe)  
> **Status:** Active Execution  
> **Target Audience:** Informal market vendors, tuck-shop owners, clothing stalls, independent service operators, and microbusinesses across Zimbabwe.  

---

## 1. Project Overview & Boundaries

CashFlow Mate is an accessible, production-ready, full-stack application that transforms messy mobile money (EcoCash, OneMoney, InnBucks), cash receipts, and bank transactions into clear, actionable cash-flow intelligence.

### Non-Negotiable Core Rules:
1. **Financial Correctness:** Pure deterministic TypeScript math engine for all calculations. Zero floating-point drift, no AI hallucinations for arithmetic or totals.
2. **Material 3 Expressive UI:** Built strictly to Google's Material 3 Expressive design specifications (purposeful color roles, shape tokens, expressive container styling, accessible contrast, tab navigation / rail).
3. **Graceful Degradation:** The entire system functions with 100% fidelity without an AI key (rule-based local fallback); when Gemini API is available, it provides enriched structured categorization and grounded natural-language explanations.
4. **Data Isolation & Security:** Multi-tenant business isolation, hashed passwords, explicit row ownership, sanitized uploads, no secret leakage to client.

---

## 2. Implementation Phases & Status

| Phase | Description | Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1: Inspection & Planning** | Architecture, data modeling, security, testing plan, and project roadmaps. | `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `SECURITY.md`, `TESTING.md` | **In Progress** |
| **Phase 2: Design System** | Material 3 Expressive design tokens, CSS variables, typography, and reusable components. | `DESIGN_SYSTEM.md`, theme tokens, design preview page | Pending |
| **Phase 3: Shell & Auth** | Navigation rail/drawer, bottom nav, public landing page, authentication, business onboarding. | App shell, Auth flows, Profile & Settings | Pending |
| **Phase 4: Financial Data Foundation** | Normalized schema, SQLite persistence, deterministic calculation engine, unit tests. | Financial engine, tests, seed datasets | Pending |
| **Phase 5: Import Pipeline** | CSV parser, column mapping, normalization, duplicate detection, review & safe commit. | Upload engine, preview table, commit logic | Pending |
| **Phase 6: Dashboard & Reports** | Financial KPIs, cash flow charts, expense breakdown, date-range filters, CSV exports. | Overview dashboard, Reports screen | Pending |
| **Phase 7: AI Capabilities** | Gemini API integration with structured schemas, prompt grounding, and local fallback. | AI categorization, plain-language Q&A | Pending |
| **Phase 8: Insights & Debts** | Anomaly detection, review queues, debt & receivable tracking with partial repayments. | Debts & Receivables screen, Insights page | Pending |
| **Phase 9: Quality & Security** | Responsive testing across viewports, dark/light themes, keyboard navigation, unit tests. | Test runs, verification reports | Pending |
| **Phase 10: Handover & Documentation** | Production build, `.env.example`, README, deployment guide. | Full runnable repo with Git commit | Pending |

---

## 3. Scope Definition

### In-Scope (MVP):
- Email/password authentication, JWT session persistence, and business onboarding.
- Local SQLite database with strict foreign keys and relational schemas; Supabase/PostgreSQL migration compatibility.
- Comprehensive CSV import engine with column mapping, preview, duplicate detection, and audit reporting.
- Deterministic calculation engine: Inflows, Outflows, Net Cash Flow, Operating Profit estimate, Period-over-Period comparisons.
- Material 3 Expressive UI with full light/dark theme toggle, system preference detection, and responsive layouts.
- Debts and receivables tracking with partial payments and status indicators.
- AI assistant with Gemini 2.0 / Omni Flash API integration + local rule-based fallback when offline or without API key.
- Pre-populated realistic Zimbabwean demo business (tuckshop / vendor in Harare/Bulawayo with EcoCash, InnBucks, Cash).
- Comprehensive test suite covering math, date parsing, imports, and API authorization.

### Explicitly Out-of-Scope (Deferred):
- Live direct banking/EcoCash API integration (requires regulatory license and telecommunication partner approval).
- Automated SMS background reading on Android (requires native Android APK release).
- Processing real financial payments or disbursement.
