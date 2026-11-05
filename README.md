# CashFlow Mate 🇿🇼
### AI-Powered Multi-Currency Financial Assistant for Informal Market Vendors & Local Traders

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests: 104 Passing](https://img.shields.io/badge/Tests-104%2F104%20Passing-success)](https://github.com/Thabisomaqhawengwenya/cashflow-mate/actions)
[![Platform: Web & Mobile](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20APK-emerald)](https://github.com/Thabisomaqhawengwenya/cashflow-mate/releases)
[![AI Engine: Gemini 1.5 Flash](https://img.shields.io/badge/AI%20Engine-Gemini%201.5%20Flash-blueviolet)](https://ai.google.dev/)
[![Compliance: Cyber & Data Protection Act 12:07](https://img.shields.io/badge/Compliance-Zimbabwe%20Data%20Act%20%5B12%3A07%5D-brightgreen)](docs/PRIVACY.md)

> **Product Vision:** *“Understand your cash flow. Track every currency. Make confident business decisions without losing your ledger.”*  
> **Target Audience:** Local market vendors, tuckshops, fruit & vegetable stalls, hardware kiosks, and micro-traders across Zimbabwe.  
> **Author & Project Lead:** Maqhawe T Ngwenya (Mr Q)  
> **Repository:** [https://github.com/Thabisomaqhawengwenya/cashflow-mate](https://github.com/Thabisomaqhawengwenya/cashflow-mate)  
> **Official Release:** [CashFlow Mate v1.3.0 (Production Edition)](https://github.com/Thabisomaqhawengwenya/cashflow-mate/releases/tag/v1.3.0)  

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement](#1-problem-statement)
3. [Field Investigation & Research Gap](#2-field-investigation--research-gap)
4. [Proposed Solution & Core Capabilities](#3-proposed-solution--core-capabilities)
5. [AI Integration Architecture](#4-ai-integration-architecture)
6. [Ethical & Responsible AI Use](#5-ethical--responsible-ai-use)
7. [System Architecture & Tech Stack](#6-system-architecture--tech-stack)
8. [Business Plan & Sustainability](#7-business-plan--sustainability)
9. [First-Time User Quick Setup Guide](#8-first-time-user-quick-setup-guide)
10. [Reviewer 2-Minute Demo Walkthrough](#9-reviewer-2-minute-demo-walkthrough)
11. [Verification Suite & Quality Assurance](#10-verification-suite--quality-assurance)
12. [Conclusion & Expected Social Impact](#11-conclusion--expected-social-impact)
13. [License & Legal Disclaimers](#12-license--legal-disclaimers)

---

## 🌟 Project Overview

**CashFlow Mate** is a full-stack, local-first financial recordkeeping and decision-support assistant engineered specifically for informal micro-traders in Zimbabwe. Designed for real-world market environments (such as Mbare Musika, Makoni, Renkini, and suburban tuckshops), the application replaces vulnerable paper notebooks with an offline-ready mobile till and desktop web dashboard. It features an automated **EcoCash/InnBucks SMS parser**, a **3-drawer multi-currency cashbox (USD, ZiG, ZAR)**, deterministic financial arithmetic, and assistive **Google Gemini AI intelligence** that explains financial trends in English, ChiShona, and SiNdebele.

---

## 1. Problem Statement

### Who It Affects
Over **70% of Zimbabwe’s domestic economy operates informally**. Hundreds of thousands of stallholders, tuckshop owners, kombi operators, grocery vendors, and artisans make a living by buying and selling goods daily in fast-moving market stalls.

### The Specific Problem
Informal traders manage cash flow under some of the most volatile monetary conditions in the world:
1. **Multi-Currency Fragmentation:** A single merchant accepts payment across three or four currencies in an afternoon: physical US Dollar banknotes ($1, $2, $5, $10, $20), Zimbabwe Gold (ZiG / EcoCash mobile money), South African Rand (ZAR) coins, and InnBucks digital vouchers.
2. **Paper Notebook Vulnerability:** Over 85% of vendors record customer credit, supplier debts, and daily floats in paper exercise books. These books are routinely lost, soaked by rain, damaged during stall moves, or illegible when multiple assistants handle the till.
3. **Connectivity Blackouts:** Market centers experience frequent cellular data dropouts and load shedding. Cloud-only applications freeze when the vendor needs to record a sale immediately.
4. **End-of-Day Float Blindness:** At the close of trade, vendors struggle to calculate their true net profit:
   - *"Did my physical cash in the drawer actually match what I sold?"*
   - *"How much stock did customers take on credit, and who is overdue?"*
   - *"How much did kombi transport and market council stall fees erode my margin?"*

---

## 2. Field Investigation & Research Gap

During market research and evaluation of existing financial software, critical structural gaps were identified:

| Existing Tool / Platform | What It Assumes | Why It Fails Local Informal Vendors |
| :--- | :--- | :--- |
| **QuickBooks / Xero** | Formal bank feeds, single-currency accounting, and monthly credit card billing. | Expensive monthly USD subscriptions ($15–$30/mo); requires high-speed connectivity; full of double-entry jargon (debits/credits) alien to stall operators. |
| **Wave / Zoho Books** | Desktop-centric invoicing, tax compliance with Western banking rails. | No concept of cash-drawer balancing, cannot parse local EcoCash SMS payments, unusable during power blackouts. |
| **Generic Spreadsheet (Excel/Sheets)** | Large screens, keyboard data entry, manual formula maintenance. | Clunky on cheap Android smartphones, vulnerable to accidental formula overwrites, and offers zero automated receipt/SMS parsing. |
| **Mobile Banking Apps** | Siloed balances inside one bank or mobile wallet. | EcoCash shows only EcoCash; Stanbic shows only Stanbic. None aggregate physical cash drawers, customer credit, and multi-currency exchange rates in one unified ledger. |

### How CashFlow Mate Is Different
1. **Zero Subscription Barrier:** The core till application is 100% free and open source forever under the MIT License.
2. **Built for Multi-Currency Cashboxes:** Native independent ledger drawers for **USD Cash**, **ZiG / EcoCash**, and **ZAR Rand** with 1-tap currency switching.
3. **Local-First & Offline-Always:** All data is saved directly on the phone’s local SQLite storage. The app opens and records transactions in under 200ms without an internet connection.
4. **Instant Local SMS Parsing:** Pasting an EcoCash or InnBucks transaction SMS automatically extracts the amount, currency, counterparty name, and reference code.
5. **Deterministic Arithmetic with AI Explanations:** The AI model never calculates balances (preventing hallucinations). Deterministic math calculates every cent, while Gemini explains the trends in plain local languages.

---

## 3. Proposed Solution & Core Capabilities

```
+-----------------------------------------------------------------------------------+
|                            CASHFLOW MATE ARCHITECTURE                             |
+-----------------------------------------------------------------------------------+
|  [ Physical Till Float ]       [ EcoCash / InnBucks SMS ]      [ Supplier Debts ] |
|            |                               |                           |          |
|            v                               v                           v          |
|  +-----------------------------------------------------------------------------+  |
|  |             LOCAL-FIRST DETERMINISTIC ENGINE (SQLite / TypeScript)          |  |
|  |   - 3-Drawer Cashbox (USD / ZiG / ZAR)     - Zero-Floating-Point Math       |  |
|  |   - Daily Shift Balancing (Z-Report)       - Customer Credit Book           |  |
|  +-----------------------------------------------------------------------------+  |
|            |                                               |                      |
|            v                                               v                      |
|  [ Clean Material 3 UI ]                       [ Grounded Gemini 1.5 Flash AI ]   |
|   - Squircle tokens                             - Explanations in Shona/Ndebele   |
|   - 1-Tap Quick Sale                            - Strict PII-Scrubbed Prompts     |
|   - WhatsApp Digital Receipts                   - Deterministic Facts Only        |
+-----------------------------------------------------------------------------------+
```

### 📱 1. Multi-Currency 3-Drawer Cashbox
- **Three Independent Ledgers:** Track cash in drawer across **USD ($)**, **ZiG (ZWG / EcoCash)**, and **ZAR (R)** simultaneously.
- **Unified Portfolio Valuation:** Calculates total market till worth in USD equivalent using current official or market exchange rates.
- **Till Privacy Shield:** Tap the eye icon to toggle `••••` privacy mask mode, hiding cash totals when customers or suppliers are standing at the counter.

### ⚡ 2. Instant EcoCash & InnBucks SMS Quick-Paste Parser
- Recognizes official Zimbabwean mobile money formats without manual data entry:
  - **EcoCash:** `Transfer Confirmation: USD 18.50 from JOHN MOYO. Approval Code: MP261025.101`
  - **InnBucks:** `Payment Received: USD 15.00 from KUDZAI CHIPATO. Ref: IB-782910`
  - **Bakers Inn:** `Delivery payment voucher: USD 33.00 for 30 loaves`
- Validates duplicates against previous reference codes so transactions are never recorded twice.

### 👥 3. Customer & Supplier Credit Book (Mukando & Debts)
- Track who took items on credit (*Owed to Me*) and what is owed to suppliers or Mukando savings rounds (*I Owe*).
- Prevents overpayments and updates remaining balances automatically upon partial repayments.

### 📦 4. Stock Inventory & 1-Tap Quick Sale
- Simple shelf stock catalog with low-inventory warnings.
- **1-Tap Quick Sale:** Reduces shelf stock count by 1 and immediately logs the cash inflow into the corresponding till drawer.

### 📄 5. Digital Receipts & Native WhatsApp Sharing
- Generate professional digital receipts and itemized quotations.
- Tap **Share via WhatsApp** to invoke native device sharing, sending clean receipt summaries directly to customer WhatsApp chats without printing hardware.

### ⚖️ 6. Day-End Shift Balancing (Z-Report)
- Physical till count station at closing time.
- Compares physical cash counted against ledger expectations, identifying exact shortages or surpluses before the trader leaves the stall.

---

## 4. AI Integration Architecture

### Which API Is Used
CashFlow Mate integrates **Google Gemini 1.5 Flash** using the official `@google/genai` SDK.

### What the AI Does
- **Natural Language Inquiries:** Traders can ask conversational questions in **English**, **ChiShona**, or **SiNdebele**:
  - *"How did my fruit stall perform compared to last week?"*
  - *"Ndeipi mari yasara musakabhetheni re EcoCash?"* (How much is left in my EcoCash drawer?)
  - *"Baphumisele abathengisi abangakabhadali izikwelede zabo."* (List customers with overdue debts.)
- **Actionable Optimization Tips:** Identifies slow-moving inventory, recommends optimal stock reorder timings, and highlights customers nearing credit limits.

### How Arithmetic Determinism Is Enforced
To prevent AI hallucination and arithmetic errors:
1. **The AI Never Computes Math:** All sums, margins, balances, and multi-currency totals are calculated by deterministic TypeScript functions in `@cashflow-mate/shared`.
2. **Pre-Computed Fact Injection:** The AI prompt receives verified arithmetic facts (e.g., `total_inflow: 185.50`, `net_profit: 42.00`).
3. **Grounded Explanations Only:** The model is strictly instructed to explain the pre-calculated figures in clear, human language rather than inventing numbers.

### Offline Fallback Mode
If the trader is in an area without mobile reception or has exhausted cellular data, the assistant seamlessly switches to a **local rule-based heuristic engine** that generates instant cash-flow summaries completely offline.

### Limitations
- The AI cannot predict speculative parallel exchange rate fluctuations.
- The assistant is restricted to tuckshop and informal commerce scopes; non-business queries are safely deflected.
- The AI does not provide formal chartered accounting or statutory tax advisory services.

---

## 5. Ethical & Responsible AI Use

1. **Strict Data Minimization & Privacy:**
   - Customer phone numbers, national identity numbers, and personal notes are scrubbed before any text is sent to the Gemini API.
   - All AI interactions are optional; traders can operate 100% of the till features without enabling AI.
2. **Local-First Data Ownership:**
   - By default, transaction records reside in local SQLite storage on the trader's phone. No merchant ledger is sold, monetized, or fed into public training datasets.
3. **Algorithmic Transparency:**
   - Every AI insight displays an explicit badge clarifying whether an analysis was generated via Google Gemini or the offline rule-based heuristic engine.
4. **Regulatory Alignment:**
   - Built in compliance with **Zimbabwe’s Cyber and Data Protection Act [Chapter 12:07]** and POTRAZ consumer protection guidelines. See [`docs/PRIVACY.md`](docs/PRIVACY.md) and [`docs/TERMS.md`](docs/TERMS.md).

---

## 6. System Architecture & Tech Stack

```
cashflow-mate/
├── apps/
│   ├── web/               # Responsive desktop & tablet SPA (React 18, Vite, TypeScript, Tailwind)
│   └── api/               # Fast backend service (Node.js, Express, native node:sqlite, Gemini SDK)
├── my-app/                # Cross-platform mobile app (React Native, Expo SDK 52, Expo Router)
├── packages/
│   └── shared/            # Deterministic calculation engine, Zod validators, licensing schemas
├── database/
│   ├── migrations/        # SQLite local schemas & Supabase PostgreSQL RLS migrations
│   └── seed/              # Realistic synthetic tuckshop test datasets
├── docs/                  # Legal terms, privacy policy, and architectural specifications
└── tools/                 # Preview daemon, license generation CLI, and audit utilities
```

### Technology Highlights
- **Mobile Client:** React Native 0.76, Expo SDK 52+, Expo Router (typed file-based routing), AsyncStorage.
- **Web App:** React 18, Vite, TypeScript, Material 3 design tokens.
- **Backend Service:** Node.js 22+, native `node:sqlite` (zero external C++ build dependencies).
- **Cloud Backend (Optional):** Supabase PostgreSQL with strict Row Level Security (`auth.uid() = user_id`).
- **Testing Engine:** Vitest 2.1 across monorepo packages.

---

## 7. Business Plan & Sustainability

### Target Users
- **Primary:** Informal tuckshop operators, fruit & vegetable market vendors, clothing stalls, flea market traders, and auto-spares kiosks in Zimbabwe and neighboring SADC countries.
- **Secondary:** Independent delivery drivers, hair salon operators, and informal saving groups (Mukando / Chilimba clubs).

### Value Proposition
- **Saves 1 to 2 hours every evening** previously spent deciphering illegible paper notebooks and counting loose currency.
- **Eliminates till float discrepancies** by flagging banknote shortages before staff close the stall.
- **Accelerates customer debt recovery** by 30% through one-tap WhatsApp payment reminders.

### Cost Structure & Monetization
- **Starter Tier (100% Free Core):** Complete multi-currency till, SMS parser, local credit book, and CSV export. Free forever under the MIT License to ensure zero financial barrier for micro-traders.
- **Commercial Pro / Enterprise License:** Optional one-time offline software activation key (HMAC-SHA256) for multi-till businesses and wholesalers requiring multi-device synchronization and custom thermal printer receipts.
- **Operational Sustainability:** Extremely low cloud compute footprint due to local-first client processing; server costs remain under $10/month for thousands of active sync users.

---

## 8. First-Time User Quick Setup Guide

Follow these steps to run CashFlow Mate locally in under 3 minutes:

### 1. Prerequisites
- **Node.js:** v20.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm:** v10.0.0 or higher (bundled with Node.js)
- **Git:** Installed on your computer

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/Thabisomaqhawengwenya/cashflow-mate.git
cd cashflow-mate
npm install
```

### 3. Run the Monorepo Test Suite
Verify that all 104 unit tests pass cleanly:
```bash
npm test
```

### 4. Start the Application Locally
Choose either the web management dashboard or the mobile app:

#### Option A: Unified Web Stack (Vite + Fastify API)
```bash
npm run dev
```
- Open **[http://localhost:5173](http://localhost:5173)** in your browser.

#### Option B: Mobile App via Expo
```bash
cd my-app
npx expo start
```
- Press `w` to run directly in your web browser.
- Press `a` to run on an Android emulator, or scan the QR code using the **Expo Go** app on your physical phone.

#### Option C: Production Local Preview (Single Port)
```bash
node tools/preview.mjs
```
- Open **[http://localhost:8089](http://localhost:8089)** to experience the full app with pre-loaded demo data.

---

## 9. Reviewer 2-Minute Demo Walkthrough

To review CashFlow Mate rapidly without setting up new accounts:
1. Open **[http://localhost:8089](http://localhost:8089)** or launch the Android APK.
2. Sign in with the 1-tap pre-filled demo accounts:
   - **Trader Demo:** `farai@tuckshop.co.zw` / `Harare2026!`
   - **Admin HQ Demo:** `admin@cashflow.co.zw` / `AdminHQ2026!`
3. **Test 3-Drawer Cashbox:** On Home, tap the **USD**, **ZiG**, and **ZAR** tabs. Notice instant recalculation of inflows, outflows, and net cash flow.
4. **Test SMS Parsing:** Tap **Paste SMS** > choose **EcoCash Sample** > tap **Use Extracted Transaction**. Notice instant extraction of `$18.50` and reference `MP261025.101`.
5. **Test 1-Tap Quick Sale:** Navigate to **Stock & Inventory** > tap **1-Tap Quick Sale**. Observe the live inventory decrement and the immediate cash entry written to the till.
6. **Test Debt Book:** Tap **Debts** to inspect customer receivables and supplier obligations.
7. **Test AI Assistant:** Tap **Assistant** and ask a question in English, Shona, or Ndebele (e.g., *"How is my business doing today?"*).

---

## 10. Verification Suite & Quality Assurance

CashFlow Mate maintains a strict quality gate verified by automated test suites and static analysis:

```bash
npm test
```

| Workspace / Module | Test Suite | Results | Quality Status |
| :--- | :--- | :--- | :--- |
| `@cashflow-mate/shared` | Vitest 2.1 | 22 / 22 Passed | ✅ 100% Green (Deterministic Math) |
| `@cashflow-mate/api` | Vitest 2.1 | 8 / 8 Passed | ✅ 100% Green (Endpoints & SQLite) |
| `my-app` (Mobile Services) | Vitest 5.0 | 74 / 74 Passed | ✅ 100% Green (Storage, Vault, SMS, Rates) |
| **Complete Monorepo** | **Vitest** | **104 / 104 Passed** | **✅ 100% Passing** |

- **Mobile TypeScript Verification:** `npx tsc --project my-app/tsconfig.json --noEmit` exits with **0 errors**.
- **Web TypeScript Verification:** `npx tsc --project apps/web/tsconfig.json --noEmit` exits with **0 errors**.
- **Anti-Vibecoding & Anti-Slop Audit:** Scanned 91 files with 0 violations and 0 warnings.
- **Web Distribution Build:** `npx expo export -p web` compiles cleanly.

---

## 11. Conclusion & Expected Social Impact

In developing economies like Zimbabwe, financial exclusion is often driven not by a lack of enterprise, but by a lack of accessible, resilient recordkeeping tools. Informal vendors are the backbone of local food security and community commerce, yet their creditworthiness remains invisible because their transactions are trapped on scraps of paper or lost SMS notifications.

By combining **local-first offline engineering**, **multi-currency drawer balancing**, **automated SMS parsing**, and **grounded Gemini AI intelligence**, CashFlow Mate provides local traders with an enterprise-grade operating system in the palm of their hand. The expected social outcome is greater financial autonomy, reduced end-of-day losses, and a durable bridge toward formal financial inclusion for informal vendors across Zimbabwe and the wider region.

---

## 12. License & Legal Disclaimers

- **Open Source License:** Released under the [MIT License](LICENSE). Copyright &copy; 2026 Maqhawe T Ngwenya.
- **Commercial Licensing:** Offline HMAC-SHA256 commercial activation engine available for multi-till enterprises via `tools/license-cli.ts`.
- **Operational Disclaimer:** CashFlow Mate is a financial recordkeeping and cash-flow intelligence assistant. It does not operate as a licensed deposit-taking bank, money transmitter, or certified tax/financial advisory firm.
- **Legal Terms & Privacy Policy:** Read the full legal agreements in [`docs/TERMS.md`](docs/TERMS.md) and [`docs/PRIVACY.md`](docs/PRIVACY.md).
