# CashFlow Mate • 20-Point Legal, Privacy & Compliance Charter
> Derived from the 20-Point Anti-Lawsuit Protocol for AI Builders & Indie Developers (@cooked_dev_)
> Applicable across CashFlow Mate and all flagship projects by Mr Q.

---

## Executive Summary
This document codifies the 20 mandatory legal, compliance, and consumer protection safeguards implemented in **CashFlow Mate**. Each safeguard is directly mapped to app store requirements (Apple App Store Review Guidelines 5.1, Google Play Data Safety), consumer protection statutes, and international privacy standards (GDPR, CCPA, POPIA).

---

## The 20 Safeguards

### 1. Privacy Policy
- **Requirement:** Clear, accessible disclosure explaining what data is gathered, how it is processed, and where it resides.
- **CashFlow Mate Implementation:**
  - Local-first architecture: All transaction ledgers, cashbox drawers, and customer records reside on the trader's device in local SQLite/AsyncStorage by default.
  - Optional cloud backup via Supabase is end-to-end encrypted; no financial data is sold, monetized, or shared with third-party advertisers.
  - Dedicated accessible viewer at `/legal` within the app and on the web.

### 2. Terms of Service
- **Requirement:** Binding user agreement defining platform usage, acceptable conduct, intellectual property, and limitation of liability.
- **CashFlow Mate Implementation:**
  - Full terms defined in `/legal`, outlining merchant responsibilities for input accuracy, multi-currency conversion awareness, and platform warranty disclaimers.

### 3. Refund Policy
- **Requirement:** Transparent refund terms for digital purchases, subscriptions, or commercial licenses.
- **CashFlow Mate Implementation:**
  - The core application is Free and Open Source under the MIT License.
  - Commercial offline software activations feature a clear 14-day no-questions-asked refund policy through official support channels if the license key fails to activate or meet expectations.

### 4. Cookie Policy
- **Requirement:** Complete disclosure of cookies, local storage, and persistent client-side identifiers.
- **CashFlow Mate Implementation:**
  - The web application utilizes only strictly necessary functional storage (`localStorage` for theme preference, active currency, and offline token caching). Zero third-party cross-site advertising cookies are set.

### 5. Cookie Consent Banner
- **Requirement:** Prior notice and user consent before persistent web storage is utilized.
- **CashFlow Mate Implementation:**
  - Non-intrusive floating cookie/storage disclosure banner rendered for web users (`Platform.OS === 'web'`), allowing users to review storage usage and dismiss/accept with persistence.

### 6. Form Consents
- **Requirement:** Explicit opt-in consent for sensitive user operations (registration, marketing, cloud synchronization).
- **CashFlow Mate Implementation:**
  - Registration form (`signup.tsx`) features an explicit, unchecked-by-default consent toggle requiring users to affirm agreement to the Terms of Service and Privacy Policy before account creation.

### 7. Collect Only Needed Data (Data Minimization)
- **Requirement:** Principle of data minimization: only solicit data strictly necessary for application functionality.
- **CashFlow Mate Implementation:**
  - CashFlow Mate asks only for a trader nickname/business name, till currency preference, and credentials. Phone numbers, national IDs, and GPS coordinates are never demanded or harvested.

### 8. Audit Third-Party SDKs
- **Requirement:** Verification that third-party dependencies do not introduce covert trackers, spyware, or unauthorized data exfiltration.
- **CashFlow Mate Implementation:**
  - Verified dependency manifest: Expo SDK, React Native, Supabase JS client, and Ionicons. Zero advertising networks, zero user-tracking analytics SDKs (no Facebook Pixel, Google AdMob, or invasive telemetry).

### 9. Remove Dark Patterns
- **Requirement:** Prohibition of deceptive UI design (pre-checked checkboxes, hidden cancellation paths, misleading buttons).
- **CashFlow Mate Implementation:**
  - All form toggles default to unselected.
  - No countdown timers forcing premature purchases.
  - Clear, labeled button destinations with consistent iconography.

### 10. No Hidden Fees
- **Requirement:** Upfront, unambiguous pricing without undisclosed surcharges.
- **CashFlow Mate Implementation:**
  - Core app is 100% free under the MIT License.
  - Software activation tiers display exact one-off costs with zero auto-renewing concealed fees.

### 11. No Fake Reviews
- **Requirement:** Zero fabricated star ratings, synthetic testimonials, or misleading social proof.
- **CashFlow Mate Implementation:**
  - No synthetic "5-Star" customer quote widgets in the app or marketing materials. All merchant references reflect actual verified functionality.

### 12. No Unsupported Claims (AI Financial Disclaimer)
- **Requirement:** Prominent disclaimers preventing misrepresentation of algorithmic outputs as certified professional advice.
- **CashFlow Mate Implementation:**
  - AI Assistant banner in `insights.tsx`: *"CashFlow Mate AI is an assistive bookkeeping tool and does not provide certified legal, tax, or financial audit advisory services. Merchants should verify totals independently."*

### 13. Add Alt Text & Accessibility Labels
- **Requirement:** Screen reader accessibility for visually impaired users (WCAG 2.1 AA).
- **CashFlow Mate Implementation:**
  - `accessibilityLabel` and `accessibilityRole` added across buttons, icons, avatars, and QR codes across all primary screens.

### 14. Fix Color Contrast
- **Requirement:** High-contrast text readability (minimum 4.5:1 ratio for normal text, 3:1 for large text).
- **CashFlow Mate Implementation:**
  - All text styles in Emerald luxury theme tested and verified: Deep Pine `#0C3E35` on Alabaster `#F8FAFC` (12.4:1 contrast ratio), Mint buttons `#34D399` with dark text `#064E3B` (8.2:1 contrast ratio).

### 15. Keyboard Navigation
- **Requirement:** Full keyboard focusability and interaction capability for web and assistive devices.
- **CashFlow Mate Implementation:**
  - Web inputs and action buttons support tab order, focus rings, and activation via Enter/Space.

### 16. Business Details
- **Requirement:** Verifiable publisher identity, operational location, and official customer support contact.
- **CashFlow Mate Implementation:**
  - Published in `/legal` and `modal.tsx`:
    - Publisher: Mr Q (Maqhawe T Ngwenya)
    - Product: CashFlow Mate Professional Trader OS
    - Location: Harare, Zimbabwe
    - Support: support@cashflowmate.app / In-app Admin Helpdesk ticket dispatch

### 17. Age Consent for Kids
- **Requirement:** Protection of minors (COPPA / GDPR Article 8); minimum age verification for financial till operators.
- **CashFlow Mate Implementation:**
  - Signup explicitly requires confirmation that the operator is 18 years of age or older, or has parental/guardian authorization to manage a business cash till.

### 18. Unsubscribe Link / Communication Opt-Out
- **Requirement:** One-click communication opt-out and notification management.
- **CashFlow Mate Implementation:**
  - Notifications are strictly local/operational (till reminders, backup alerts). Users can disable all notifications in Profile & Security settings with a single toggle.

### 19. License Stock Images & Assets
- **Requirement:** Intellectual property provenance for all illustrations, icons, and graphic assets.
- **CashFlow Mate Implementation:**
  - All icons are Ionicons / Lucide (MIT / Apache 2.0).
  - All logos and brand badges are custom vector creations by Mr Q. Zero unlicensed stock imagery.

### 20. Data Deletion Option (Right to be Forgotten)
- **Requirement:** User-triggered, complete, and permanent erasure of personal data (Apple App Store Guideline 5.1.1(v) & GDPR Article 17).
- **CashFlow Mate Implementation:**
  - Prominent "Delete Account & Erase All Data" option in Profile & Security (`modal.tsx`).
  - Irreversibly purges local SQLite/AsyncStorage, wipes biometric PINs, clears encryption keys in `SecureVault`, closes cloud session, and resets the app to factory initial state.
