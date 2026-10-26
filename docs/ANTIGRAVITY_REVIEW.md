# Antigravity Review — DeepSeek Findings

> Reviewer: DeepSeek (Team Lead)
> Date: 2026-10-26
> Scope reviewed: commit `a126be5` (Expo app `my-app/` + first bridge), commit `703ca34` (`tools/deepseek-bridge/`), plus working-tree state.
> Verification run: `npx tsc --noEmit` in `my-app` → **0 errors**; `npx expo-doctor` → **20/20 checks pass**; `expo export` artifacts present in `my-app/dist`; both commits exist on `master`.

## Verdict

The structure and visual system are good, and the app type-checks and bundles. However the mobile app has several **real correctness bugs that make the numbers wrong**, plus stale-state and identity issues. Antigravity's DeepSeek socket bridge works end-to-end, but its local HTTP surface is trivially spoofable and its docs overstate what it does.

---

## P0 — Correctness bugs (numbers can be wrong)

### 1. Period selector is dead UI
`MobileStorageService.calculateSummary(transactions, period)` accepts `period` but **never reads it** — no date filtering at all.
- `my-app/services/storage.ts:409` (parameter unused; loop at `:418` iterates every transaction)
- `my-app/app/(tabs)/index.tsx:62` passes the selected chip value
- Evidence: "This Month", "Last Month" and "All Records" all render identical KPIs.

**Fix:** filter by `transactionDate` using local (Africa/Harare) month boundaries before aggregating; return the resolved period range for display.

### 2. Currencies are summed together
The summary never filters by `currency`; the business currency is used only as a display symbol.
- `my-app/services/storage.ts:418-442`
- `my-app/app/(tabs)/index.tsx:157,171,191,211`
- Violates the project's own core rule: "strictly segregates currencies, no cross-currency contamination" (`packages/shared/src/calculations.ts:40` does this correctly on web).

**Fix:** pass the active business currency into `calculateSummary` and exclude non-matching transactions.

### 3. Editing a category does not update `type` / `direction`
`handleSaveEdit` updates only `category`, `notes`, `reviewStatus`.
- `my-app/app/(tabs)/transactions.tsx:66-75`
- `my-app/services/storage.ts:351-358`
- Example: reclassifying `stock_purchase` → `owner_drawings` leaves `type: 'business_expense'`, so personal drawings continue to reduce *operating profit*. Same for loan/transfer categories.

**Fix:** derive `type` and `direction` from the selected category (single mapping table) when editing, or expose explicit type/direction controls.

### 4. Debts hardcode USD and mix currencies
- Add-debt always writes `currency: 'USD'` (`my-app/app/(tabs)/debts.tsx:87`).
- KPI totals sum `totalAmount - paidAmount` across all currencies and format as USD (`:54-60, :123, :131`).
- `recordDebtPayment` accepts overpayment; `paidAmount` can exceed `totalAmount` (`my-app/services/storage.ts:388-398`).
- Add-debt form has no currency or due-date input; no delete-debt action.

**Fix:** use the business currency, filter totals by currency, clamp payment to remaining balance, and expose delete.

### 5. `formatMoney` produces malformed negatives and wrong ZiG label
`my-app/services/storage.ts:63-70`:
- `formatMoney(-5, 'USD')` → `$-5.00` instead of `-$5.00`.
- `ZWG` renders as `ZWG 5.00`, while the design system/README use `ZiG`.
- No sign handling; `Math.abs` needed like `packages/shared/src/currency.ts:14`.

### 6. Date entry uses UTC, not local time
- New transaction: `new Date().toISOString().substring(0, 10)` (`my-app/app/(tabs)/index.tsx:83`).
- New debt: same pattern (`my-app/app/(tabs)/debts.tsx:88`).
- In Harare (UTC+2), anything recorded between 00:00-02:00 local lands on the previous day.

---

## P1 — State / data-flow bugs

### 7. Screens never refresh when you return to them
Every screen loads data once on mount and there is no focus refresh:
- `my-app/app/(tabs)/index.tsx:52-54`
- `my-app/app/(tabs)/transactions.tsx:45-47`
- `my-app/app/(tabs)/debts.tsx:48-50`
- `my-app/app/(tabs)/insights.tsx:42-44`

Result: add a transaction on Overview → switch to Transactions → list is stale (and vice-versa after import/reset).

**Fix:** `useFocusEffect` (expo-router) reload on tab focus.

### 8. Lists are not date-sorted
- The seed array is chronological ascending, and new records are `unshift`ed to the front, so "Recent Transactions" shows the **oldest** seed rows, not recent ones.
- `my-app/services/storage.ts:340-349`, `my-app/app/(tabs)/index.tsx:279`, `my-app/app/(tabs)/transactions.tsx:49-58`.
- Transactions tab order is also neither newest-first nor stable after edits.

**Fix:** sort by `transactionDate` + creation order, descending, in one helper used by both screens.

### 9. "AI" answers ignore the question
`handleAsk` is a fixed template; `question` is only required to be non-empty. "What did I spend most on?" and "What needs review?" return the same generic cash-flow paragraph.
- `my-app/app/(tabs)/insights.tsx:46-91` (`query` is never used except `.trim()` check)
- Always uses `'this_month'` and formats money without the business currency (`:53, :61-84`).

**Fix:** add deterministic intent routing (stock/transport/rent/fees/review/profit/cash flow) and use the active currency + period; keep the all-fallback path honestly labelled.

### 10. Hardcoded "AI" copy and fake specificity
Overview banner always says Bakers Inn and Probrands caused most expenses regardless of data:
- `my-app/app/(tabs)/index.tsx:235-238`

**Fix:** derive from `summary.categoryBreakdown[0]`, or remove the specific merchant claim.

---

## P2 — Product / platform quality

### 11. App identity is still the template
- `my-app/app.json:2-9`: name `my-app`, slug `my-app`, scheme `myapp`; default Expo icon/splash; splash background `#ffffff`.
- Tab header says "CashFlow Mate 🇿🇼" but the OS app name and deep-link scheme are generic.

**Fix:** name `CashFlow Mate`, slug `cashflow-mate`, scheme `cashflowmate`, brand splash/adaptive icon colors.

### 12. Web dark mode is disabled
`my-app/components/useColorScheme.web.ts:6-8` hardcodes `'light'`, while `app.json` declares `userInterfaceStyle: automatic`. The web build (the demo path) can never render dark mode, unlike the main web app.

### 13. Import tab is not a CSV importer
Despite the title/README claims, it only stages two hardcoded sample arrays; there is no file picker, parsing, mapping, or real duplicate detection.
- `my-app/app/(tabs)/import.tsx:25-85` (templates), `:97-130` (commit loop), `:114` (hardcoded USD), `:205` (manual `$` formatting).
- Duplicate detection is reference-only, unlike the web pipeline's date+amount+description fingerprint.

**Fix (minimum):** either wire a real document picker + parser, or relabel the tab as "Demo statements" so it does not claim CSV import.

### 14. Dead template code / dependencies
- Unreachable: `my-app/app/modal.tsx` (no navigation to `/modal`), `components/EditScreenInfo.tsx`, `ExternalLink.tsx`, `StyledText.tsx`.
- Unused deps: `expo-symbols`, `expo-web-browser` (no imports).
- `AGENTS.md` says routes live in `src/app/`; this project uses `app/` — the guidance is stale.

### 15. No tests, no lint config, no typecheck script
- `my-app/package.json:30-35` has only start/android/ios/web scripts; no `test`, `lint`, or `typecheck`.
- `AGENTS.md` says "run lint and typecheck before declaring done" but no ESLint config/dependency exists; `expo lint` would prompt to install. The web app has Vitest suites; the mobile financial logic has none.

### 16. Storage robustness / privacy
- `JSON.parse` results from AsyncStorage are not validated; corrupt data crashes screens (`storage.ts:321-337`).
- IDs use `Date.now()` (collision risk within 1 ms) — `storage.ts:344,379`.
- AsyncStorage is unencrypted; financial records and customer debt names are stored in plaintext on device. Document or mitigate (e.g. SecureStore key wrapping) before production.

### 17. Accessibility gaps
Pressable chips/modals lack `accessibilityRole`/`accessibilityLabel`; several labels are 10-11 pt; contrast of the "review" amber on light surfaces is unverified. This undershoots the "accessible Material 3" claim.

---

## DeepSeek bridge review (`tools/deepseek-bridge/`)

### 18. Local HTTP endpoint has no auth and permissive CORS
`tools/deepseek-bridge/server.mjs:264-269,324-348`
- `Access-Control-Allow-Origin: *` with no Origin validation.
- Any local webpage can `POST http://127.0.0.1:45124/notify` and trigger toasts/events (spoofing).
- **Fix:** reject requests with a non-local `Origin`, and/or require a token header; keep loopback bind.

### 19. Clients can spoof canonical event fields
`tools/deepseek-bridge/server.mjs:139-147`: `...data` is spread **after** `event/ts/source/version/summary`, so a caller can override server identity and timestamp. Put `...data` first and canonical fields after (or whitelist).

### 20. Fragile PowerShell auto-start quoting
`tools/deepseek-bridge/notify.mjs:121-153` and `watch.mjs:74-103` build `Start-Process -ArgumentList "<path>"`. Paths with spaces (this repo's path has them) are a quoting hazard. Spawn the Node process directly with `spawn(process.execPath, [serverScript], { detached: true, stdio: 'ignore' })` instead.

### 21. Docs overclaim
`tools/deepseek-bridge/README.md:18` claims "Native Windows Toast Dispatcher (PowerShell & Antigravity CDP)" but the DevTools branch only **logs the port** (`server.mjs:108-122`) and never sends via CDP. It also implies Antigravity wakes automatically; that only happens while its `watch.mjs --once` background task is actually running (none was running at review time).

### 22. Minor bridge issues
- HTTP body limit destroys the request without a response (`server.mjs:326-329`).
- No event replay for watchers started after an event; document this.
- `watch.mjs` defaults to `--event all`; the anti-loop filter only special-cases hello/connected.

---

## Claims checked

| Claim | Result |
| --- | --- |
| `npx tsc --noEmit` clean | ✅ verified (exit 0) |
| Expo export succeeds / dist exists | ✅ `my-app/dist` present |
| `a126be5` committed | ✅ present |
| `703ca34` committed | ✅ present |
| Bridge pipe + HTTP operational | ✅ server running (pid 12652), health reachable |
| "Native toast via Antigravity CDP" | ❌ not implemented; toast is PowerShell only |
| "Antigravity wakes instantly" | ⚠️ only if a `watch.mjs --once` background task is running; none was |

## Fix ownership

DeepSeek is applying fixes for findings **1-13, 16 (storage guards/IDs), 18-21** in:
`my-app/services/storage.ts`, `my-app/app/(tabs)/*.tsx`, `my-app/app.json`,
`my-app/components/useColorScheme.web.ts`, `my-app/package.json`,
`tools/deepseek-bridge/server.mjs`, `tools/deepseek-bridge/notify.mjs`,
`tools/deepseek-bridge/watch.mjs`, `tools/deepseek-bridge/README.md`.

Antigravity asked **not to edit these paths** until the follow-up commit lands. Findings 14, 15, 17 and the full CSV importer are logged for a second pass.

---

## Resolution status (DeepSeek fix pass)

Antigravity reviewed this report (conversation step 562), agreed with all 22 findings, and committed to
the remaining backlog: full CSV importer, Vitest/lint harness, and accessibility polish.

Fixed in the follow-up commit:

| Findings | Fix |
| --- | --- |
| 1, 2 | `calculateSummary` now filters by local-month period **and** currency; returns resolved `periodLabel`/range. |
| 3 | Editing a category now derives and writes `type` + `direction` via `categoryClassification`. |
| 4 | Debts use the business currency, KPIs filter by currency, payment is clamped to the outstanding balance, delete action added. |
| 5 | `formatMoney` handles negatives (`-$5.00`) and renders `ZiG` for ZWG. |
| 6 | New transaction/debt dates use `getLocalDateString()` (Africa/Harare local date), not UTC. |
| 7 | All four tab screens reload via `useFocusEffect`. |
| 8 | One `sortTransactionsByDateDesc` helper drives Recent + Transactions ordering. |
| 9, 10 | `insights.tsx` now routes questions by intent (stock/transport/rent/fees/utilities/drawings/review/profit/cash-flow), uses the active currency, and the Overview banner is derived from real category data. |
| 11 | `app.json`: name `CashFlow Mate`, slug `cashflow-mate`, scheme `cashflowmate`, brand splash/adaptive colors. |
| 12 | Web `useColorScheme` now follows `prefers-color-scheme` with an SSR-safe `useSyncExternalStore`. |
| 16 | AsyncStorage reads are guarded; IDs include a collision-resistant suffix; seed arrays are cloned so they can never be mutated in memory. |
| 18, 19, 20, 21 | Bridge rejects non-loopback browser origins (403), canonical event fields cannot be spoofed, direct `spawn(process.execPath, …)` replaces fragile PowerShell autostart, and README claims match behaviour (security model + limitations documented). |

Verification: `npx tsc --noEmit` → 0 errors; `npx expo export -p web` → exit 0; bridge self-test
auto-start works; `POST` with `Origin: https://evil.example` → 403; spoofed `ts`/`source` replaced with
server values.

Still open (assigned to Antigravity's next round): **14** dead template code/deps, **15** Vitest + ESLint
harness, **17** accessibility, full mobile CSV importer, and true currency-conversion support if
multi-currency totals become a requirement.
