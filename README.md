# CashFlow Mate 🇿🇼
### AI-Powered Mobile Money & Cash-Flow Assistant for Small Traders in Zimbabwe

> **Product Positioning:** *“Understand your money. Make better business decisions.”*  
> **Target Audience:** Informal market vendors, tuck-shop operators, grocery stalls, clothing vendors, and microbusinesses across Zimbabwe.  
> **Author & Project Lead:** Mr Q (Maqhawe T Ngwenya)  
> **Repository:** [https://github.com/Thabisomaqhawengwenya/cashflow-mate](https://github.com/Thabisomaqhawengwenya/cashflow-mate)  
> **Official Release:** [v1.2.0 (Review Edition)](https://github.com/Thabisomaqhawengwenya/cashflow-mate/releases/tag/v1.2.0)

---

## 📲 Android APK Download & Installation

| Platform | Download Link | Build Type | Status |
| :--- | :--- | :--- | :--- |
| **Android (APK v1.2.0 — Latest Review)** | [📦 **GitHub Release v1.2.0 Assets**](https://github.com/Thabisomaqhawengwenya/cashflow-mate/releases/tag/v1.2.0) | Standalone Preview Release (`com.maqhawe.cashflowmate`) | ✅ Review Release |
| **Android (APK v1.1.0 — Direct Install)** | [⬇️ **Download CashFlow Mate v1.1.0 APK**](https://github.com/Thabisomaqhawengwenya/cashflow-mate/releases/download/v1.1.0/CashFlowMate-v1.1.0.apk) | Standalone Installable APK (`97.5 MB`) | ✅ Live Production |
| **Expo EAS Cloud Build** | [🌐 **Expo Build Details**](https://expo.dev/accounts/maqhawengwenya/projects/cashflow-mate/builds/cba8389e-d954-4371-a8e5-5d1c61eb17ed) | EAS Cloud Artifact (`cba8389e`) | ✅ Verified |
| **Android (APK v1.0.0 — Legacy)** | [⬇️ Download CashFlow Mate v1.0.0 APK](https://github.com/Thabisomaqhawengwenya/cashflow-mate/releases/download/v1.0.0/CashFlowMate-v1.0.0.apk) | Standalone Preview APK | 📦 Archived |

### 🚀 Android Quick Install Steps
1. **Download:** Tap the [Download CashFlow Mate v1.1.0 APK](https://github.com/Thabisomaqhawengwenya/cashflow-mate/releases/download/v1.1.0/CashFlowMate-v1.1.0.apk) link directly from your Android phone browser.
2. **Open:** Tap the downloaded file from your notification tray or *Downloads* folder.
3. **Allow Installation:** If prompted by Android, enable *"Install unknown apps"* for your browser or file manager.
4. **Launch:** Open **CashFlow Mate** from your home screen. Full offline till capabilities run immediately without requiring Expo Go or internet access.

---

## 1. Problem Statement & Mission

Small informal traders in Zimbabwe (managing queues at Mbare Musika, Makoni, Renkini, or suburban tuckshops) face a unique financial reality. Their day-to-day revenue is split across:
1. Physical US Dollar banknotes ($1, $2, $5, $10, $20).
2. Zimbabwe Gold (ZiG / ZWG) received via EcoCash or OneMoney.
3. South African Rand (ZAR) notes and coins.
4. InnBucks US Dollar customer vouchers.

Because records are scattered across SMS notifications, paper slips, and memory, traders cannot easily determine:
- *"What is my true daily profit after taking out kombi transport and supplier costs?"*
- *"How much cash do I actually hold across my 3 separate currency drawers?"*
- *"Which customers took mealie-meal or cooking oil on credit and still owe the stall?"*
- *"Did the float in my till balance with what my sales recorded today?"*

**CashFlow Mate** resolves this with an **offline-first mobile till** and **web management dashboard** featuring **deterministic mathematical accuracy**, **automated EcoCash SMS parsing**, and **grounded Gemini AI intelligence**.

---

## 2. Core Mobile & Web Capabilities

### 📱 1. Multi-Currency 3-Drawer Cashbox (USD, ZiG, ZAR)
- Separate independent ledger drawers for **US Dollars ($)**, **Zimbabwe Gold (ZiG / EcoCash)**, and **South African Rand (R)**.
- Unified portfolio valuation converting all balances to USD equivalent using configurable official or parallel market rates.
- Privacy Shield Mode: One-tap `••••` mask toggles total visibility when customers are peering over the till counter.

### ⚡ 2. Instant EcoCash & InnBucks SMS Quick-Paste Parser
- High-speed regex parser recognizing official Zimbabwean mobile money formats:
  - **EcoCash:** `Transfer Confirmation: USD 18.50 from JOHN MOYO. Approval Code: MP261025.101`
  - **InnBucks:** `Payment Received: USD 15.00 from KUDZAI CHIPATO. Ref: IB-782910`
  - **Bakers Inn:** `Delivery payment voucher: USD 33.00 for 30 loaves`
- 1-tap test chips allow reviewers to paste and verify extraction in under 2 seconds.

### 📦 3. Stock Inventory & 1-Tap Quick Sale
- Live shelf stock management with low-stock badges.
- **1-Tap Quick Sale:** Decrements inventory count by 1 and writes an immediate cash inflow record to the till.

### 📄 4. Quotations, Invoices & Native WhatsApp Sharing
- Create itemized quotations and pro-forma invoices with tax and due-date controls.
- **Native Mobile Sharing:** Directly invokes Android/iOS `Share.share` with clean text summaries formatted for WhatsApp merchant chats.
- Convert settled quotes into confirmed cash transactions with one tap.

### ⚖️ 5. Day-End Shift Balancing (Z-Report)
- Physical till count reconciliation at close of day.
- Computes exact variance between physically counted banknotes and system records, flagging shortages or surpluses before closing.

### 👥 6. Customer & Supplier Credit Book (Mukando & Debts)
- Distinguishes between **Customer Credit** (*Owed to Me*) and **Supplier Credit / Mukando Rounds** (*I Owe*).
- Enforces strict non-overpayment limits and tracks partial repayments over time.

### 🎨 7. UI Studio & Atmospheric Appearance Engine
- **11 Curated Brand Palettes:** Royal Navy, Heritage Emerald Pine, Obsidian Midnight, Market Terracotta, Imperial Plum, Crimson Velvet, Sahara Gold, Zambezi Teal, Midnight Indigo, Savanna Olive, and Monochrome Steel.
- **4 Corner Geometries:** Full Pill (`9999px`), Expressive Large (`24px`), Squircle (`16px`), and Sharp (`6px`).
- **4 Navigation Bar Styles:** Floating Pill Dock (with smart collision protection), Curved Sheet, Compact Pill, and Classic Dock.
- **Instant Cross-Screen Sync:** Profile edits and photo compression downsample to `<25 KB`, preventing storage quota errors and syncing across tabs in real time.

### 🧠 8. Grounded AI Assistant (Google Gemini 1.5 Flash + Local Fallback)
- Natural language cash-flow explanations in **English, Shona, and Ndebele**.
- Strict deterministic guardrails: The AI is restricted to explaining pre-calculated numbers. All math is computed deterministically in TypeScript with zero floating-point drift.
- Seamless offline rule-based fallback when cellular Wi-Fi or API keys are unavailable.

---

## 3. Technology Architecture & Monorepo Layout

```
cashflow-mate/
├── apps/
│   ├── web/               # React 18, Vite, TypeScript, Material 3 Expressive SPA
│   └── api/               # Node.js 24, Express, TypeScript, Native node:sqlite, Gemini API
├── my-app/                # React Native, Expo SDK 58, Expo Router, TypeScript mobile app
├── packages/
│   └── shared/            # Deterministic math engine, Zod schemas, types, licensing logic
├── database/
│   ├── migrations/        # SQL migration schemas (SQLite & PostgreSQL / Supabase compatible)
│   └── seed/              # Realistic Zimbabwean tuckshop synthetic demo data
├── tools/
│   ├── preview.mjs        # Production multi-client local preview daemon (port 8089)
│   ├── license-cli.ts     # Offline HMAC-SHA256 enterprise license generator
│   └── council/           # Multi-agent coordination hub and audit intercom
└── docs/                  # Project specifications, test strategies, and architectural blueprints
```

---

## 4. Verification Suite & Test Results

The codebase is governed by a 100% automated test suite passing across all workspaces:

```bash
npm run test
```

| Package / Workspace | Framework | Tests | Status |
| :--- | :--- | :--- | :--- |
| `@cashflow-mate/shared` | Vitest 2.1 | 22 / 22 passed | ✅ 100% Green |
| `@cashflow-mate/api` | Vitest 2.1 | 8 / 8 passed | ✅ 100% Green |
| `my-app` (Mobile Services) | Vitest 5.0 | 79 / 79 passed | ✅ 100% Green |
| **Total Monorepo Suite** | **Vitest** | **109 / 109 passed** | **✅ 100% Clean Pass** |

- **Mobile TypeScript Verification:** `npx tsc --project my-app/tsconfig.json --noEmit` exits with **0 errors**.
- **Web TypeScript Verification:** `npx tsc --project apps/web/tsconfig.json --noEmit` exits with **0 errors**.
- **API Build Verification:** `npm --workspace=@cashflow-mate/api run build` exits with **0 errors**.

---

## 5. Quick Start & Local Setup

### 1. Prerequisites
- **Node.js:** v20.0.0 or higher (v24.x recommended).
- **npm:** v10.0.0 or higher.
- No external database or C++ toolchain required (uses native standard library `node:sqlite`).

### 2. Installation
```bash
git clone https://github.com/Thabisomaqhawengwenya/cashflow-mate.git
cd cashflow-mate
npm install
```

### 3. Start the Unified Development Stack
```bash
# Runs API (:3001) and Web (:5173) concurrently
npm run dev
```

### 4. Run the Mobile App (Expo)
```bash
cd my-app
npx expo start
```
- Press `w` to open in your web browser.
- Press `a` to launch in an Android Emulator or scan the QR code with Expo Go.

### 5. Launch the Local Production Preview
```bash
node tools/preview.mjs
```
Opens the unified review dashboard at **[http://localhost:8089](http://localhost:8089)**.

---

## 6. Reviewer Demo Guide (Under 2 Minutes)

To evaluate CashFlow Mate rapidly without creating a new store:
1. Open **[http://localhost:8089](http://localhost:8089)** or launch the Android APK.
2. The app pre-loads with a realistic Harare tuckshop (*Mbare Fresh Produce & Tuckshop*).
3. **Test 3-Drawer Cashbox:** Tap **USD**, **ZiG**, and **ZAR** chips at the top of Home. Observe instant balance recalculations.
4. **Test SMS Parsing:** Tap **Paste SMS** > tap **EcoCash Sample** > tap **Use Extracted Transaction**. Notice instant extraction of `$18.50` and reference `MP261025.101`.
5. **Test 1-Tap Sale:** Scroll to **Business Suite** > tap **Stock & Inventory** > tap **1-Tap Quick Sale**. Observe live stock reduction and till cash increment.
6. **Test WhatsApp Quote Sharing:** Tap **Quotes & Invoices** > tap **Share Quote** to view formatted digital quote summary.
7. **Test Profile Customization:** Tap your avatar > tap **Edit Stall Profile** > change stall name or select an avatar preset > tap **Save Profile**. Header and sidebar update instantaneously.

---

## 7. The Council of AI Agents

CashFlow Mate was architected and verified under the command of **Mr Q** through a coordinated council of specialized autonomous engineering engines:

- **Supreme Commander:** Mr Q (Maqhawe T Ngwenya)
- **Field Commander (2iC):** Antigravity
- **Chief Strategic Thinker:** DeepSeek R1
- **Architectural Inquisitor:** Claude Code
- **Aesthetic Craftsman:** Material 3 Expressive & Spacing Specialist
- **Core Systems Engineer:** Deterministic Engine & Offline SQLite Architect
- **Security Sentinel:** Auth Throttling & Tenant Isolation Guardian
- **Zim Market Analyst:** Regional Currency & Informal Economy Specialist
- **Council Hub & Intercom:** `tools/council/` and `tools/deepseek-bridge`

---

## 8. License & Disclaimers

- **License:** Official MIT License. Copyright &copy; 2026 Maqhawe T Ngwenya (Mr Q). All rights reserved.
- **Enterprise Offline Activation:** Offline licensing engine governed by cryptographic HMAC-SHA256 software keys via `tools/license-cli.ts`.
- **Disclaimer:** CashFlow Mate is a financial recordkeeping and cash-flow intelligence assistant. It does not operate as a licensed deposit-taking bank or lending entity.
