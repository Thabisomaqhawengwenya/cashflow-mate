# Bugfix Requirements Document

## Introduction

This document addresses 6 identified bugs in CashFlow Mate, a financial tracking application for Zimbabwean traders. These bugs range from medium to low severity and impact data integrity, date parsing accuracy, validation robustness, duplicate detection, type safety, and error handling. The fixes prioritize Bug 1 (debt overpayment validation) due to its data corruption risk, followed by the remaining bugs in order. All fixes must maintain the existing 93-test suite passing and preserve deterministic financial arithmetic behavior.

## Bug Analysis

### Bug 1: Debt Overpayment Validation Missing (MEDIUM SEVERITY)

#### Current Behavior (Defect)

1.1 WHEN a user records a payment amount that exceeds the outstanding debt balance (e.g., $100 payment on a $50 debt) THEN the system accepts the overpayment without validation

1.2 WHEN the overpayment is recorded THEN the system adds the full payment amount to paidAmount, resulting in paidAmount exceeding totalAmount (e.g., paidAmount = $150 for a $50 debt)

1.3 WHEN the overpayment causes paidAmount to exceed or equal totalAmount THEN the system marks the debt as settled despite the logical inconsistency

1.4 WHEN these phantom credits are recorded THEN the financial records become corrupted with invalid debt states

#### Expected Behavior (Correct)

2.1 WHEN a user attempts to record a payment amount that exceeds the outstanding balance THEN the system SHALL reject the payment with a clear error message: "Payment amount ($X.XX) exceeds outstanding balance ($Y.YY)"

2.2 WHEN calculating outstanding balance for validation THEN the system SHALL compute it as (totalAmount - paidAmount) with deterministic arithmetic

2.3 WHEN a payment amount is less than or equal to the outstanding balance THEN the system SHALL accept and record the payment normally

2.4 WHEN a payment equals the outstanding balance exactly THEN the system SHALL mark the debt as settled with paidAmount = totalAmount

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user records a valid payment (amount ≤ outstanding balance) THEN the system SHALL CONTINUE TO add the payment to paidAmount correctly

3.2 WHEN a debt reaches full settlement through valid payments THEN the system SHALL CONTINUE TO mark it as settled

3.3 WHEN retrieving debt payment history THEN the system SHALL CONTINUE TO return all recorded payments

3.4 WHEN calculating debt statistics across all debts THEN the system SHALL CONTINUE TO compute totals accurately

---

### Bug 2: CSV Date Parsing Ambiguity (LOW-MEDIUM SEVERITY)

#### Current Behavior (Defect)

1.1 WHEN importing a CSV with ambiguous dates like "05/06/2026" (both parts ≤12) and no formatHint provided THEN the system defaults to DD/MM/YYYY but may heuristically fallback to MM/DD/YYYY

1.2 WHEN the heuristic logic triggers incorrectly THEN transactions may be recorded with wrong dates (May 6 instead of June 5, or vice versa)

1.3 WHEN both date components are ≤12 and detectedMapping.dateFormat is unavailable THEN the system proceeds with potentially incorrect parsing without user confirmation

1.4 WHEN date parsing errors occur silently THEN users have no visibility into which transactions were misparsed

#### Expected Behavior (Correct)

2.1 WHEN a CSV date format is ambiguous (both parts ≤12) and detectedMapping.dateFormat is available THEN the system SHALL use the detected format hint for parsing

2.2 WHEN a CSV date format is ambiguous and no reliable format can be determined THEN the system SHALL flag the affected rows in the import preview with a warning badge indicating "Ambiguous date format - Review required"

2.3 WHEN presenting the import preview THEN the system SHALL provide a UI control allowing users to specify global date format preference (DD/MM/YYYY vs MM/DD/YYYY)

2.4 WHEN the user selects a date format preference THEN the system SHALL reparse all ambiguous dates using the selected format before final import

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN importing CSV files with unambiguous dates (e.g., "25/06/2026" can only be DD/MM/YYYY) THEN the system SHALL CONTINUE TO parse them correctly without user intervention

3.2 WHEN dates are in ISO 8601 format (YYYY-MM-DD) THEN the system SHALL CONTINUE TO parse them unambiguously

3.3 WHEN all dates in a CSV follow a consistent detectable pattern THEN the system SHALL CONTINUE TO auto-detect and apply the format

3.4 WHEN successful date parsing occurs THEN the system SHALL CONTINUE TO normalize dates to ISO format for storage

---

### Bug 3: Transaction Amount Validation Bypass Potential (LOW SEVERITY)

#### Current Behavior (Defect)

1.1 WHEN creating a transaction via POST `/transactions`, the system relies solely on Zod schema validation for amount > 0 checking

1.2 WHEN the Zod schema is misconfigured or bypassed (e.g., through direct service calls) THEN zero or negative amounts could potentially reach the database

1.3 WHEN TransactionService.create() receives transaction data THEN it performs no explicit service-level validation for amount > 0

1.4 WHEN validation occurs only at the route layer THEN there is no defense-in-depth protection

#### Expected Behavior (Correct)

2.1 WHEN TransactionService.create() receives a transaction with amount ≤ 0 THEN the service SHALL explicitly reject it with error: "Transaction amount must be greater than zero"

2.2 WHEN TransactionService.create() receives a transaction with amount > 0 THEN the service SHALL validate and proceed with database insertion

2.3 WHEN amount validation fails at the service layer THEN the system SHALL return an appropriate error response before any database operation

2.4 WHEN both route-level (Zod) and service-level validations are present THEN the system SHALL provide defense-in-depth protection

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN valid transactions (amount > 0) are submitted THEN the system SHALL CONTINUE TO create them successfully

3.2 WHEN Zod schema validation catches invalid amounts at the route layer THEN the system SHALL CONTINUE TO reject them before reaching the service

3.3 WHEN transaction creation includes all required fields THEN the system SHALL CONTINUE TO store them in the database

3.4 WHEN retrieving transactions THEN the system SHALL CONTINUE TO return all stored records with accurate amounts

---

### Bug 4: CSV Intra-File Duplicate Detection False Positives (LOW SEVERITY)

#### Current Behavior (Defect)

1.1 WHEN detecting duplicates during CSV import, the system uses composite key: `${rawRef || ''}_${parsedDate}_${parsedAmount}_${rawDesc}`

1.2 WHEN rawRef is null or empty for multiple transactions THEN legitimate transactions with the same date, amount, and description are flagged as duplicates

1.3 WHEN legitimate transactions are incorrectly flagged THEN they may be automatically skipped during import

1.4 WHEN false positives occur THEN users lose valid transaction data without clear indication

#### Expected Behavior (Correct)

2.1 WHEN rawRef is present for transactions THEN the system SHALL use the full composite key for exact duplicate matching

2.2 WHEN rawRef is missing or empty for multiple transactions with same date, amount, and description THEN the system SHALL flag them with "Possible duplicate - Review recommended" warning (not automatic exclusion)

2.3 WHEN presenting duplicate warnings in import preview THEN the system SHALL differentiate between "Confirmed duplicate" (exact rawRef match) and "Possible duplicate" (missing rawRef)

2.4 WHEN users review flagged transactions THEN the system SHALL allow manual selection of which transactions to include/exclude

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN transactions have unique rawRef values THEN the system SHALL CONTINUE TO import them without false duplicate warnings

3.2 WHEN exact duplicates exist (same rawRef, date, amount, description) THEN the system SHALL CONTINUE TO flag them as confirmed duplicates

3.3 WHEN checking against existing database transactions THEN the system SHALL CONTINUE TO detect true cross-import duplicates

3.4 WHEN duplicate detection succeeds correctly THEN the system SHALL CONTINUE TO prevent genuine duplicate imports

---

### Bug 5: Unsafe Category Type Casting (LOW SEVERITY)

#### Current Behavior (Defect)

1.1 WHEN creating a transaction via POST `/transactions`, the code uses `category: validated.category as any` to bypass TypeScript type safety

1.2 WHEN the type assertion `as any` is used THEN TypeScript cannot verify that validated.category matches the expected CategoryKey type

1.3 WHEN there is a type mismatch between Zod schema output and TransactionService input THEN invalid category values could theoretically reach the database

1.4 WHEN type safety is bypassed THEN runtime errors or data inconsistencies may occur without compile-time detection

#### Expected Behavior (Correct)

2.1 WHEN passing category from validated data to TransactionService THEN the system SHALL use proper type guards or validated mapping instead of `as any`

2.2 WHEN category type validation is implemented THEN the system SHALL ensure CategoryKey type alignment between Zod schema and service interface

2.3 WHEN an invalid category value is detected THEN the system SHALL reject it with a clear error message

2.4 WHEN type safety is enforced THEN TypeScript SHALL catch type mismatches at compile time

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN valid category values are provided THEN the system SHALL CONTINUE TO create transactions successfully

3.2 WHEN category is one of the defined CategoryKey values THEN the system SHALL CONTINUE TO store it correctly

3.3 WHEN retrieving transactions with categories THEN the system SHALL CONTINUE TO return them with proper type information

3.4 WHEN filtering or grouping by category THEN the system SHALL CONTINUE TO operate correctly

---

### Bug 6: Unhandled Promise Rejection in Mobile Settings (LOW SEVERITY)

#### Current Behavior (Defect)

1.1 WHEN MobileSecurityService.getSecuritySettings() promise rejects THEN there is no `.catch()` handler to capture the error

1.2 WHEN MobileLicenseService.getActiveLicense() promise rejects THEN there is no `.catch()` handler to capture the error

1.3 WHEN unhandled promise rejections occur THEN the UI may be left in an inconsistent state with undefined or stale data

1.4 WHEN errors occur silently THEN users have no indication that settings failed to load

#### Expected Behavior (Correct)

2.1 WHEN MobileSecurityService.getSecuritySettings() is called THEN the promise SHALL include a `.catch()` handler or be wrapped in try-catch with await

2.2 WHEN MobileLicenseService.getActiveLicense() is called THEN the promise SHALL include a `.catch()` handler or be wrapped in try-catch with await

2.3 WHEN promise rejection occurs THEN the error SHALL be logged appropriately for debugging

2.4 WHEN promise rejection occurs THEN the system SHALL set fallback state values to prevent undefined behavior

2.5 WHEN critical settings fail to load THEN the system SHALL optionally display a non-intrusive error indicator to the user

#### Unchanged Behavior (Regression Prevention)

3.1 WHEN MobileSecurityService.getSecuritySettings() resolves successfully THEN the system SHALL CONTINUE TO update security state correctly

3.2 WHEN MobileLicenseService.getActiveLicense() resolves successfully THEN the system SHALL CONTINUE TO update license state correctly

3.3 WHEN all promises resolve without errors THEN the UI SHALL CONTINUE TO display settings accurately

3.4 WHEN settings are modified by the user THEN the system SHALL CONTINUE TO persist changes correctly
