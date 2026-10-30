# CashFlow Mate Bugfixes Design

## Overview

This design document addresses 6 identified bugs in CashFlow Mate, a financial tracking application for Zimbabwean traders. The fixes span data validation (debt overpayment, transaction amounts), user experience improvements (CSV date parsing ambiguity, duplicate detection), code quality (unsafe type casting), and error handling (unhandled promises). All fixes must maintain deterministic financial arithmetic and preserve the existing 93-test suite passing rate.

**Priority Order:**
1. Bug 1 (MEDIUM): Debt Overpayment Validation - data corruption risk
2. Bug 3 (LOW): Transaction Amount Validation - defense-in-depth
3. Bug 2 (LOW-MEDIUM): CSV Date Parsing Ambiguity - UX improvement
4. Bug 4 (LOW): CSV Duplicate Detection - false positive reduction
5. Bug 5 (LOW): Unsafe Category Casting - type safety
6. Bug 6 (LOW): Unhandled Promise Rejections - error resilience

## Glossary

- **Bug_Condition (C)**: The condition that triggers each bug - varies per bug (overpayment, ambiguous date, missing validation, false duplicate, type bypass, unhandled rejection)
- **Property (P)**: The desired behavior when bug conditions occur - proper validation, user confirmation, type safety, error handling
- **Preservation**: Existing functionality that must remain unchanged - valid payments, successful imports, accurate financial calculations
- **DebtService.recordPayment()**: The function in `apps/api/src/services/debts.ts` that records debt payments and updates debt status
- **ImportService.parseAndPreview()**: The function in `apps/api/src/services/imports.ts` that parses CSV files and detects duplicates
- **TransactionService.create()**: The function in `apps/api/src/services/transactions.ts` that creates transaction records
- **Outstanding Balance**: The remaining debt amount calculated as (totalAmount - paidAmount)
- **Ambiguous Date**: A date where both components are ≤12 (e.g., "05/06/2026" could be May 6 or June 5)
- **Composite Key**: The duplicate detection key: `${rawRef || ''}_${parsedDate}_${parsedAmount}_${rawDesc}`
- **CategoryKey**: The TypeScript type defining valid transaction categories in the shared package
- **roundCurrency()**: Utility function from @cashflow-mate/shared that ensures deterministic arithmetic

## Bug 1 Details: Debt Overpayment Validation

### Bug Condition

The bug manifests when a user records a payment amount that exceeds the outstanding debt balance. The `DebtService.recordPayment()` function accepts any payment amount without validation, allowing paidAmount to exceed totalAmount.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { debtId: string, paymentAmount: number }
  OUTPUT: boolean
  
  debt := getDebtById(input.debtId)
  outstandingBalance := debt.totalAmount - debt.paidAmount
  
  RETURN input.paymentAmount > outstandingBalance
         AND outstandingBalance > 0
         AND recordPayment_accepts_without_error(input.paymentAmount)
END FUNCTION
```

### Examples

- **Overpayment Example**: Debt with totalAmount=$100, paidAmount=$0, attempting payment of $150
  - Expected: Reject with error "Payment amount ($150.00) exceeds outstanding balance ($100.00)"
  - Actual: Accepts payment, sets paidAmount=$150, marks as settled (DATA CORRUPTION)

- **Overpayment on Partial**: Debt with totalAmount=$500, paidAmount=$400, attempting payment of $200
  - Expected: Reject with error "Payment amount ($200.00) exceeds outstanding balance ($100.00)"
  - Actual: Accepts payment, sets paidAmount=$600, marks as settled (DATA CORRUPTION)

- **Exact Payment**: Debt with totalAmount=$100, paidAmount=$50, attempting payment of $50
  - Expected: Accept payment, set paidAmount=$100, mark as settled
  - Actual: Works correctly (no bug)

- **Valid Partial Payment**: Debt with totalAmount=$100, paidAmount=$20, attempting payment of $30
  - Expected: Accept payment, set paidAmount=$50, status remains 'partially_paid'
  - Actual: Works correctly (no bug)

## Bug 2 Details: CSV Date Parsing Ambiguity

### Bug Condition

The bug manifests when importing a CSV file with dates where both day and month components are ≤12 (e.g., "05/06/2026"), and no reliable formatHint is available. The system defaults to DD/MM/YYYY but may incorrectly interpret dates.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { rawDate: string, formatHint?: string }
  OUTPUT: boolean
  
  parsed := rawDate.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  IF NOT parsed RETURN false
  
  part1 := parseInt(parsed[1])
  part2 := parseInt(parsed[2])
  
  RETURN part1 <= 12
         AND part2 <= 12
         AND input.formatHint IS undefined
         AND rawDate NOT in ISO_FORMAT
END FUNCTION
```

### Examples

- **Ambiguous Date Example 1**: "05/06/2026" with no formatHint
  - Expected: Flag with warning, allow user to select DD/MM/YYYY or MM/DD/YYYY
  - Actual: Defaults to DD/MM/YYYY (June 5), but could be MM/DD/YYYY (May 6)

- **Ambiguous Date Example 2**: "01/12/2025" with no formatHint
  - Expected: Flag with warning, allow user to select format
  - Actual: Defaults to DD/MM/YYYY (December 1), but could be MM/DD/YYYY (January 12)

- **Unambiguous Date**: "25/06/2026" with no formatHint
  - Expected: Parse as DD/MM/YYYY (June 25) - only valid interpretation
  - Actual: Works correctly (no bug)

- **ISO Format**: "2026-06-05"
  - Expected: Parse unambiguously as June 5, 2026
  - Actual: Works correctly (no bug)

## Bug 3 Details: Transaction Amount Validation Bypass

### Bug Condition

The bug manifests when TransactionService.create() receives transaction data with amount ≤ 0, but validation only occurs at the route layer via Zod schema. Direct service calls could bypass validation.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { amount: number, bypassedZod: boolean }
  OUTPUT: boolean
  
  RETURN input.amount <= 0
         AND input.bypassedZod = true
         AND TransactionService.create_has_no_amount_validation()
END FUNCTION
```

### Examples

- **Zero Amount via Direct Call**: Service called with amount=0
  - Expected: Reject with error "Transaction amount must be greater than zero"
  - Actual: Potentially reaches database (defense-in-depth failure)

- **Negative Amount via Direct Call**: Service called with amount=-50
  - Expected: Reject with error "Transaction amount must be greater than zero"
  - Actual: Potentially reaches database (defense-in-depth failure)

- **Valid Amount via Route**: Route handler receives amount=100, Zod validates
  - Expected: Pass validation, create transaction
  - Actual: Works correctly (no bug)

- **Zero Amount via Route**: Route handler receives amount=0, Zod rejects
  - Expected: Reject at route layer with Zod error
  - Actual: Works correctly (no bug at route layer)

## Bug 4 Details: CSV Duplicate Detection False Positives

### Bug Condition

The bug manifests when multiple legitimate transactions in a CSV file have the same date, amount, and description but missing or empty rawRef values. These are flagged as duplicates and may be automatically skipped.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { transactions: Transaction[] }
  OUTPUT: boolean
  
  FOR EACH tx IN input.transactions DO
    compositeKey := `${tx.rawRef || ''}_${tx.date}_${tx.amount}_${tx.description}`
    IF compositeKey starts_with "_" (empty rawRef)
       AND seenInFile.has(compositeKey)
       AND tx is flagged as duplicate with automatic exclusion
    THEN RETURN true
  END FOR
  
  RETURN false
END FUNCTION
```

### Examples

- **False Positive Example**: Two transactions with rawRef=null, date="2026-01-15", amount=50, description="Tomatoes purchase"
  - Expected: Flag as "Possible duplicate - Review recommended" (not automatic exclusion)
  - Actual: Second transaction flagged as duplicate and may be skipped (DATA LOSS)

- **True Duplicate Example**: Two transactions with rawRef="TXN12345", same date, amount, description
  - Expected: Flag as "Confirmed duplicate" and skip
  - Actual: Works correctly (no bug)

- **Unique Transactions**: Transactions with different rawRef values
  - Expected: Import all without duplicate warnings
  - Actual: Works correctly (no bug)

- **Same Amount Different Days**: Two transactions, same amount/description but different dates
  - Expected: Import both (not duplicates)
  - Actual: Works correctly (no bug)

## Bug 5 Details: Unsafe Category Type Casting

### Bug Condition

The bug manifests in the POST `/transactions` route handler where `validated.category as any` bypasses TypeScript type safety, potentially allowing invalid category values to reach the database.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { category: string, useTypeAssertion: boolean }
  OUTPUT: boolean
  
  RETURN input.useTypeAssertion = true
         AND input.category NOT IN valid_CategoryKey_values
         AND TypeScript_cannot_detect_mismatch_at_compile_time()
END FUNCTION
```

### Examples

- **Invalid Category with 'as any'**: Zod outputs category="invalid_cat", code uses `as any`
  - Expected: TypeScript compile error or runtime validation error
  - Actual: May reach database due to type safety bypass

- **Valid Category with 'as any'**: Zod outputs category="business_expense", code uses `as any`
  - Expected: Create transaction successfully
  - Actual: Works but bypasses type safety (risk remains)

- **Valid Category with Proper Types**: Zod outputs valid CategoryKey, properly typed
  - Expected: Create transaction successfully with type safety
  - Actual: Desired behavior (no 'as any')

## Expected Behavior

### Bug 1: Debt Overpayment Validation

#### Validation Logic

_For any_ debt payment where the payment amount exceeds the outstanding balance (totalAmount - paidAmount), the system SHALL reject the payment and return a clear error message.

**Pseudocode:**
```
FUNCTION recordPayment_fixed(businessId, debtId, paymentAmount)
  debt := getDebtById(businessId, debtId)
  IF debt IS null THEN
    THROW Error("Debt record not found.")
  END IF
  
  roundedPayment := roundCurrency(paymentAmount)
  outstandingBalance := roundCurrency(debt.totalAmount - debt.paidAmount)
  
  // VALIDATION: Check for overpayment
  IF roundedPayment > outstandingBalance THEN
    THROW Error(`Payment amount ($${roundedPayment.toFixed(2)}) exceeds outstanding balance ($${outstandingBalance.toFixed(2)})`)
  END IF
  
  newPaid := roundCurrency(debt.paidAmount + roundedPayment)
  newStatus := IF newPaid >= debt.totalAmount THEN 'settled' ELSE 'partially_paid'
  
  UPDATE debts SET paid_amount = newPaid, status = newStatus
  WHERE business_id = businessId AND id = debtId
  
  RETURN getDebtById(businessId, debtId)
END FUNCTION
```

#### Preservation Requirements

**Unchanged Behaviors:**
- Valid payments (amount ≤ outstanding balance) must continue to be accepted and recorded
- Debt settlement logic (marking as 'settled' when paidAmount = totalAmount) must continue to work
- Payment history retrieval must continue to return accurate records
- Debt statistics and totals must continue to be calculated correctly

**Scope:**
All inputs where payment amount ≤ outstanding balance should be completely unaffected by this fix. This includes:
- Partial payments that don't settle the debt
- Exact payments that fully settle the debt
- First payments on new debts
- Final payments on nearly-settled debts

### Bug 2: CSV Date Parsing Ambiguity

#### Enhanced Detection and User Confirmation

_For any_ CSV import with ambiguous dates (both components ≤12) and no reliable formatHint, the system SHALL flag affected rows and provide UI controls for format selection.

**Pseudocode:**
```
FUNCTION parseAndPreview_fixed(businessId, csvContent, customMapping, defaultCurrency)
  // ... existing parsing logic ...
  
  hasAmbiguousDates := false
  
  FOR EACH row IN records DO
    rawDate := row[mapping.dateColumn]
    parsed := rawDate.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
    
    IF parsed AND parseInt(parsed[1]) <= 12 AND parseInt(parsed[2]) <= 12
       AND NOT mapping.dateFormat THEN
      row.isAmbiguousDate := true
      row.ambiguityWarning := "Ambiguous date format - Review required"
      hasAmbiguousDates := true
    END IF
    
    // Parse with detected or default format
    parsedDate := normalizeDate(rawDate, mapping.dateFormat)
    // ... rest of row processing ...
  END FOR
  
  RETURN {
    // ... existing return fields ...
    hasAmbiguousDates: hasAmbiguousDates,
    suggestedFormats: ['DD/MM/YYYY', 'MM/DD/YYYY']
  }
END FUNCTION

FUNCTION normalizeDate_fixed(rawDate, formatHint, userSelectedFormat)
  // ... existing ISO and unambiguous date handling ...
  
  parsed := rawDate.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  IF parsed THEN
    part1 := parseInt(parsed[1])
    part2 := parseInt(parsed[2])
    year := parsed[3]
    
    // Use user-selected format if provided
    IF userSelectedFormat = 'MM/DD/YYYY' THEN
      RETURN `${year}-${pad(part1)}-${pad(part2)}`
    ELSE IF userSelectedFormat = 'DD/MM/YYYY' OR formatHint = 'DD/MM/YYYY' THEN
      RETURN `${year}-${pad(part2)}-${pad(part1)}`
    ELSE IF part1 <= 12 AND part2 > 12 THEN
      // Unambiguous: part1 is month
      RETURN `${year}-${pad(part1)}-${pad(part2)}`
    ELSE
      // Default to DD/MM/YYYY
      RETURN `${year}-${pad(part2)}-${pad(part1)}`
    END IF
  END IF
  
  // ... existing fallback logic ...
END FUNCTION
```

#### Preservation Requirements

**Unchanged Behaviors:**
- Unambiguous dates (e.g., "25/06/2026") must continue to parse correctly without user intervention
- ISO 8601 dates (YYYY-MM-DD) must continue to parse unambiguously
- Dates with detectable patterns must continue to auto-detect format
- Successfully parsed dates must continue to normalize to ISO format for storage

**Scope:**
All dates that can be parsed unambiguously should be completely unaffected by this fix. This includes:
- ISO format dates
- Dates where only one interpretation is valid (day > 12 or month > 12)
- Dates with explicit format hints from previous imports

### Bug 3: Transaction Amount Validation

#### Service-Level Defense-in-Depth

_For any_ transaction creation where amount ≤ 0, the TransactionService.create() SHALL explicitly reject it before database operations.

**Pseudocode:**
```
FUNCTION create_fixed(businessId, data)
  // VALIDATION: Service-level amount check
  IF data.amount IS undefined OR data.amount <= 0 THEN
    THROW Error("Transaction amount must be greater than zero")
  END IF
  
  id := generateUUID()
  now := getCurrentTimestamp()
  
  // ... existing insertion logic ...
  
  INSERT INTO transactions (id, business_id, amount, ...) 
  VALUES (id, businessId, data.amount, ...)
  
  RETURN getById(businessId, id)
END FUNCTION
```

#### Preservation Requirements

**Unchanged Behaviors:**
- Valid transactions (amount > 0) must continue to create successfully
- Zod schema validation at route layer must continue to catch invalid amounts
- Transaction insertion with all required fields must continue to work
- Transaction retrieval must continue to return accurate amounts

**Scope:**
All inputs with valid amounts (amount > 0) should be completely unaffected by this fix. This includes:
- Manual transaction creation via POST /transactions
- CSV import transaction creation
- Transaction updates that don't modify amount
- Transaction queries and summaries

### Bug 4: CSV Duplicate Detection

#### Differentiated Duplicate Classification

_For any_ CSV import with transactions that have missing rawRef values, the system SHALL differentiate between "Confirmed duplicates" (matching rawRef) and "Possible duplicates" (same date/amount/description).

**Pseudocode:**
```
FUNCTION parseAndPreview_fixed(businessId, csvContent, customMapping, defaultCurrency)
  // ... existing parsing logic ...
  
  seenInFile := new Map<string, { count: number, hasRef: boolean }>()
  
  FOR EACH row IN records DO
    // ... existing extraction and parsing ...
    
    isDuplicate := false
    duplicateReason := undefined
    duplicateType := undefined  // NEW: 'confirmed' or 'possible'
    
    IF isValid AND parsedAmount AND parsedDate THEN
      // Check for intra-file duplicates
      IF rawRef AND rawRef.trim() != '' THEN
        // Has reference - exact duplicate detection
        fileKey := `ref:${rawRef}`
        IF seenInFile.has(fileKey) THEN
          isDuplicate := true
          duplicateType := 'confirmed'
          duplicateReason := 'Confirmed duplicate - Same reference number appears multiple times'
        ELSE
          seenInFile.set(fileKey, { count: 1, hasRef: true })
        END IF
      ELSE
        // No reference - possible duplicate detection
        fileKey := `data:${parsedDate}_${parsedAmount}_${parsedDescription}`
        IF seenInFile.has(fileKey) THEN
          isDuplicate := true
          duplicateType := 'possible'
          duplicateReason := 'Possible duplicate - Review recommended (no reference number)'
        ELSE
          seenInFile.set(fileKey, { count: 1, hasRef: false })
        END IF
      END IF
      
      // Database check (existing logic enhanced)
      IF NOT isDuplicate THEN
        existing := checkDatabaseDuplicate(businessId, rawRef, parsedDate, parsedAmount, parsedDescription)
        IF existing AND rawRef THEN
          isDuplicate := true
          duplicateType := 'confirmed'
          duplicateReason := 'Confirmed duplicate - Matching reference exists in database'
        ELSE IF existing AND NOT rawRef THEN
          isDuplicate := true
          duplicateType := 'possible'
          duplicateReason := 'Possible duplicate - Similar transaction exists (review recommended)'
        END IF
      END IF
    END IF
    
    previewRows.push({
      // ... existing fields ...
      isDuplicate: isDuplicate,
      duplicateType: duplicateType,  // NEW
      duplicateReason: duplicateReason,
      autoSkip: (duplicateType = 'confirmed')  // NEW: Only auto-skip confirmed
    })
  END FOR
  
  RETURN { /* ... */ }
END FUNCTION
```

#### Preservation Requirements

**Unchanged Behaviors:**
- Transactions with unique rawRef values must continue to import without false warnings
- Exact duplicates (same rawRef, date, amount, description) must continue to be flagged as confirmed
- Cross-import duplicate detection against database must continue to work
- True duplicate prevention must continue to protect data integrity

**Scope:**
All transactions with unique identifying information should be completely unaffected by this fix. This includes:
- Transactions with unique reference numbers
- Transactions with unique combinations of date/amount/description
- First occurrence of any transaction pattern
- Legitimate recurring transactions (same amount, different dates)

### Bug 5: Unsafe Category Type Casting

#### Proper Type Safety Implementation

_For any_ category value passed from validated data to TransactionService, the system SHALL use proper type guards or validated mapping instead of `as any`.

**Pseudocode:**
```
// Type guard function
FUNCTION isValidCategory(value: unknown): boolean
  validCategories := [
    'uncategorized', 'business_income', 'business_expense',
    'inventory_purchase', 'inventory_sale', 'personal_drawing',
    // ... all valid CategoryKey values
  ]
  RETURN typeof value = 'string' AND value IN validCategories
END FUNCTION

// Fixed route handler
FUNCTION POST_transactions_fixed(req, res)
  businessId := req.user.businessId
  validated := manualTransactionSchema.parse(req.body)
  
  // Type-safe category validation
  IF NOT isValidCategory(validated.category) THEN
    THROW Error(`Invalid category: ${validated.category}`)
  END IF
  
  created := TransactionService.create(businessId, {
    ...validated,
    category: validated.category  // No 'as any' - type is proven valid
  })
  
  res.status(201).json(created)
END FUNCTION
```

#### Preservation Requirements

**Unchanged Behaviors:**
- Valid category values must continue to create transactions successfully
- Category storage in database must continue to work correctly
- Category retrieval with proper type information must continue to work
- Category filtering and grouping operations must continue to function

**Scope:**
All transactions with valid CategoryKey values should be completely unaffected by this fix. This includes:
- All existing transaction creation paths
- Category updates via PUT /transactions/:id
- Category-based filtering and reporting
- AI-based category suggestions

### Bug 6: Unhandled Promise Rejections

#### Comprehensive Error Handling

_For any_ promise from MobileSecurityService.getSecuritySettings() or MobileLicenseService.getActiveLicense() that rejects, the system SHALL handle the error gracefully with logging and fallback state.

**Pseudocode:**
```
FUNCTION useEffect_settings_fixed()
  // Enhanced promise handling with error handlers
  
  MobileStorageService.getBusiness()
    .then((biz) => {
      setBusiness(biz)
      IF biz?.name THEN setEditStallName(biz.name)
    })
    .catch((error) => {
      console.error('Failed to load business:', error)
      setBusiness(null)
    })
  
  MobileLicenseService.getActiveLicense()
    .then((lic) => {
      setLicense(lic)
      setKeyInput(lic.key)
    })
    .catch((error) => {
      console.error('Failed to load license:', error)
      setLicense({ status: 'trial', key: '', activatedAt: null, expiresAt: null })
    })
  
  MobileSecurityService.getSecuritySettings()
    .then(setSecurity)
    .catch((error) => {
      console.error('Failed to load security settings:', error)
      setSecurity({ hasPIN: false, pinSetAt: null, biometricEnabled: false })
    })
  
  MobileAuthService.getSession()
    .then((sess) => {
      setSession(sess)
      IF sess?.username OR sess?.name THEN
        setEditUsername(sess.username OR sess.name)
      END IF
    })
    .catch((error) => {
      console.error('Failed to load session:', error)
      setSession(null)
    })
  
  // ... rest of useEffect ...
END FUNCTION
```

#### Preservation Requirements

**Unchanged Behaviors:**
- Successful promise resolution must continue to update state correctly
- Security settings display when loaded must continue to work
- License information display when loaded must continue to work
- All other settings functionality must continue to work

**Scope:**
All successful promise resolutions should be completely unaffected by this fix. This includes:
- Successful loading of security settings
- Successful loading of license information
- Successful loading of business and session data
- User interactions that modify settings

## Hypothesized Root Causes

### Bug 1: Debt Overpayment Validation

Based on the bug description, the root cause is:

1. **Missing Validation Logic**: The `recordPayment()` function was implemented without considering the overpayment scenario. The code directly adds paymentAmount to paidAmount without checking if it would exceed totalAmount.

2. **Insufficient Business Logic**: The status update logic (`if (newPaid >= existing.totalAmount)`) was designed to handle settlement but not to prevent overpayment. The `>=` check allows paidAmount to exceed totalAmount.

3. **Lack of Defensive Programming**: No guard clause exists at the beginning of the function to validate payment amount against outstanding balance.

### Bug 2: CSV Date Parsing Ambiguity

Based on the bug description, the root causes are:

1. **Silent Default Assumption**: The `normalizeDate()` function defaults to DD/MM/YYYY for ambiguous dates without notifying the user or offering a choice.

2. **Insufficient Heuristic Logic**: The current heuristic (`part1 <= 12 && part2 > 12`) only handles cases where one component is clearly invalid as a month. When both are valid (≤12), it silently defaults.

3. **No UI Feedback Loop**: The import preview doesn't flag ambiguous dates or provide controls for users to specify their preferred format.

4. **Format Hint Underutilization**: The `formatHint` parameter exists but isn't surfaced to users or stored from previous successful imports.

### Bug 3: Transaction Amount Validation Bypass

Based on the bug description, the root cause is:

1. **Single Layer Validation**: Validation only exists at the route layer via Zod schema. The service layer trusts all inputs without re-validation.

2. **Lack of Defense-in-Depth**: Direct service calls (from tests, internal functions, or future API changes) could bypass Zod validation at the route layer.

3. **Service Signature Trusts Callers**: The `create()` function signature accepts `Partial<Transaction>` with optional amount, allowing potentially invalid values.

### Bug 4: CSV Duplicate Detection False Positives

Based on the bug description, the root causes are:

1. **Oversimplified Composite Key**: Using `${rawRef || ''}_${parsedDate}_${parsedAmount}_${rawDesc}` treats empty rawRef the same as any other value. When rawRef is empty for multiple rows, they all get the same composite key prefix (`_...`).

2. **No Differentiation Logic**: The duplicate detection treats all matches the same, whether they have exact reference matches or just similar data patterns.

3. **Automatic Exclusion Without Review**: The `skipDuplicates` flag in `commitImport()` automatically excludes all flagged duplicates without allowing user review of "possible" vs "confirmed" duplicates.

### Bug 5: Unsafe Category Type Casting

Based on the bug description, the root causes are:

1. **Type Mismatch Between Layers**: Potential mismatch between Zod schema output type and TransactionService input type for the category field.

2. **Quick Fix with Type Assertion**: Developer used `as any` as a quick workaround to bypass TypeScript errors instead of properly aligning types.

3. **Lack of Runtime Type Guard**: No runtime validation ensures the category value is actually a valid CategoryKey before passing to the service.

### Bug 6: Unhandled Promise Rejections

Based on the bug description, the root causes are:

1. **Missing Error Handlers**: Promise chains lack `.catch()` handlers for `getSecuritySettings()` and `getActiveLicense()` calls.

2. **Incomplete useEffect Pattern**: The useEffect hook initiates async operations but doesn't implement error handling best practices.

3. **No Fallback State**: When promises reject, state variables remain in their initial state (possibly undefined), leading to UI inconsistencies.

4. **Silent Failures**: Without error logging, failures in settings loading are invisible to developers and users.

## Correctness Properties

Property 1: Bug 1 - Debt Overpayment Rejection

_For any_ debt payment where the payment amount exceeds the outstanding balance (calculated as totalAmount - paidAmount using deterministic arithmetic), the fixed DebtService.recordPayment function SHALL reject the payment with error message "Payment amount ($X.XX) exceeds outstanding balance ($Y.YY)" before any database modification occurs.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug 1 - Preservation of Valid Payments

_For any_ debt payment where the payment amount is less than or equal to the outstanding balance, the fixed DebtService.recordPayment function SHALL produce exactly the same behavior as the original function, correctly adding the payment to paidAmount and updating status to 'settled' when paidAmount equals totalAmount.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 3: Bug 2 - Ambiguous Date Flagging

_For any_ CSV import row with a date in format DD/MM/YYYY or MM/DD/YYYY where both components are ≤12 and no formatHint is available, the fixed ImportService.parseAndPreview function SHALL flag the row with isAmbiguousDate=true and include the warning "Ambiguous date format - Review required" in the preview result.

**Validates: Requirements 2.2, 2.3**

Property 4: Bug 2 - Preservation of Unambiguous Dates

_For any_ CSV import row with unambiguous dates (ISO format, or DD/MM/YYYY where day>12 or month>12, or with explicit formatHint), the fixed ImportService SHALL produce exactly the same parsing behavior as the original function, parsing dates correctly without user intervention.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 5: Bug 3 - Service-Level Amount Validation

_For any_ transaction creation request where amount ≤ 0, the fixed TransactionService.create function SHALL reject the request with error "Transaction amount must be greater than zero" before any database operation, regardless of whether Zod validation was applied.

**Validates: Requirements 2.1, 2.3**

Property 6: Bug 3 - Preservation of Valid Transactions

_For any_ transaction creation request where amount > 0, the fixed TransactionService.create function SHALL produce exactly the same behavior as the original function, successfully creating the transaction in the database with all provided fields.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 7: Bug 4 - Differentiated Duplicate Classification

_For any_ CSV import with multiple rows having the same date, amount, and description but missing rawRef values, the fixed ImportService.parseAndPreview function SHALL flag them as duplicateType='possible' with reason "Possible duplicate - Review recommended" instead of automatic exclusion, while transactions with matching rawRef values SHALL be flagged as duplicateType='confirmed'.

**Validates: Requirements 2.2, 2.3, 2.4**

Property 8: Bug 4 - Preservation of True Duplicate Detection

_For any_ CSV import with transactions having unique rawRef values or unique combinations of date/amount/description, the fixed ImportService SHALL produce exactly the same behavior as the original function, importing them without false duplicate warnings and correctly detecting true duplicates with matching references.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 9: Bug 5 - Type-Safe Category Handling

_For any_ transaction creation via POST /transactions, the fixed route handler SHALL validate that the category value is a valid CategoryKey using proper type guards before passing to TransactionService.create, rejecting invalid categories with error "Invalid category: {value}" without using type assertions like 'as any'.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 10: Bug 5 - Preservation of Valid Category Transactions

_For any_ transaction creation with a valid CategoryKey value, the fixed route handler SHALL produce exactly the same behavior as the original handler, successfully creating the transaction with proper type information and without compile-time or runtime errors.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 11: Bug 6 - Promise Rejection Handling

_For any_ promise rejection from MobileSecurityService.getSecuritySettings() or MobileLicenseService.getActiveLicense(), the fixed modal.tsx useEffect SHALL catch the error, log it for debugging, and set fallback state values (empty security settings for security, trial license for license) to prevent undefined behavior and UI inconsistencies.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 12: Bug 6 - Preservation of Successful Promise Resolution

_For any_ successful promise resolution from MobileSecurityService.getSecuritySettings() or MobileLicenseService.getActiveLicense(), the fixed modal.tsx useEffect SHALL produce exactly the same behavior as the original code, correctly updating state with the resolved values.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Bug 1: Debt Overpayment Validation

**File**: `apps/api/src/services/debts.ts`

**Function**: `DebtService.recordPayment()`

**Specific Changes**:

1. **Add Validation Logic**: Insert validation block after retrieving existing debt
   ```typescript
   const roundedPayment = roundCurrency(paymentAmount);
   const outstandingBalance = roundCurrency(existing.totalAmount - existing.paidAmount);
   
   if (roundedPayment > outstandingBalance) {
     throw new Error(
       `Payment amount ($${roundedPayment.toFixed(2)}) exceeds outstanding balance ($${outstandingBalance.toFixed(2)})`
     );
   }
   ```

2. **Use Rounded Payment**: Replace direct `paymentAmount` usage with `roundedPayment` for deterministic arithmetic

3. **Maintain Existing Logic**: Keep status update logic (`>=` check for settlement) unchanged

4. **Error Handling**: Let error propagate to route handler for proper HTTP response

**Lines to Modify**: Approximately lines 89-96 in current file

### Bug 2: CSV Date Parsing Ambiguity

**File**: `apps/api/src/services/imports.ts`

**Functions**: `ImportService.parseAndPreview()`, `ImportService.normalizeDate()`

**Specific Changes**:

1. **Add Ambiguity Detection**: In `parseAndPreview()`, detect ambiguous dates
   ```typescript
   // After parsing rawDate
   let isAmbiguousDate = false;
   let ambiguityWarning: string | undefined;
   
   const parsed = rawDate.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
   if (parsed && !mapping.dateFormat) {
     const part1 = parseInt(parsed[1], 10);
     const part2 = parseInt(parsed[2], 10);
     if (part1 <= 12 && part2 <= 12) {
       isAmbiguousDate = true;
       ambiguityWarning = 'Ambiguous date format - Review required';
     }
   }
   ```

2. **Add Fields to ImportPreviewRow**: Extend interface with `isAmbiguousDate?: boolean` and `ambiguityWarning?: string`

3. **Add Fields to ImportPreviewResult**: Extend interface with `hasAmbiguousDates: boolean` and `suggestedFormats: string[]`

4. **Enhance normalizeDate()**: Add `userSelectedFormat` parameter to allow user override
   ```typescript
   private static normalizeDate(raw: string, formatHint?: string, userSelectedFormat?: string): string | null
   ```

5. **Priority Order**: Use userSelectedFormat > formatHint > heuristics > default

**Lines to Modify**: 
- ImportPreviewRow interface: ~line 18
- ImportPreviewResult interface: ~line 27
- parseAndPreview(): ~lines 40-150
- normalizeDate(): ~lines 235-285

### Bug 3: Transaction Amount Validation

**File**: `apps/api/src/services/transactions.ts`

**Function**: `TransactionService.create()`

**Specific Changes**:

1. **Add Service-Level Validation**: Insert at the beginning of `create()`
   ```typescript
   static create(businessId: string, data: Partial<Transaction>): Transaction {
     // Service-level validation for defense-in-depth
     if (data.amount === undefined || data.amount <= 0) {
       throw new Error('Transaction amount must be greater than zero');
     }
     
     const db = getDb();
     // ... rest of existing logic
   }
   ```

2. **Maintain Existing Logic**: Keep all transaction insertion logic unchanged

3. **Error Propagation**: Let error propagate to route handler for proper HTTP response

**Lines to Modify**: ~line 110 (beginning of create() method)

### Bug 4: CSV Duplicate Detection

**File**: `apps/api/src/services/imports.ts`

**Interface/Function**: `ImportPreviewRow` interface, `ImportService.parseAndPreview()`

**Specific Changes**:

1. **Enhance ImportPreviewRow Interface**: Add new fields
   ```typescript
   export interface ImportPreviewRow {
     // ... existing fields
     isDuplicate: boolean;
     duplicateType?: 'confirmed' | 'possible';  // NEW
     duplicateReason?: string;
     autoSkip?: boolean;  // NEW: Only true for confirmed duplicates
     // ... existing fields
   }
   ```

2. **Refactor Duplicate Detection Logic**: Replace simple Set with Map for differentiated tracking
   ```typescript
   const seenInFile = new Map<string, { count: number, hasRef: boolean }>();
   
   // In the row processing loop:
   let duplicateType: 'confirmed' | 'possible' | undefined;
   
   if (rawRef && rawRef.trim()) {
     const refKey = `ref:${rawRef}`;
     if (seenInFile.has(refKey)) {
       isDuplicate = true;
       duplicateType = 'confirmed';
       duplicateReason = 'Confirmed duplicate - Same reference number';
     } else {
       seenInFile.set(refKey, { count: 1, hasRef: true });
     }
   } else {
     const dataKey = `data:${parsedDate}_${parsedAmount}_${rawDesc}`;
     if (seenInFile.has(dataKey)) {
       isDuplicate = true;
       duplicateType = 'possible';
       duplicateReason = 'Possible duplicate - Review recommended (no reference)';
     } else {
       seenInFile.set(dataKey, { count: 1, hasRef: false });
     }
   }
   ```

3. **Set autoSkip Flag**: Only auto-skip confirmed duplicates
   ```typescript
   previewRows.push({
     // ... existing fields
     isDuplicate,
     duplicateType,
     duplicateReason,
     autoSkip: duplicateType === 'confirmed'
   });
   ```

4. **Update commitImport()**: Respect autoSkip flag instead of just isDuplicate
   ```typescript
   if (row.autoSkip && skipDuplicates) {
     duplicateSkipped++;
     continue;
   }
   ```

**Lines to Modify**:
- ImportPreviewRow interface: ~line 18
- parseAndPreview() duplicate detection: ~lines 85-135
- commitImport() skip logic: ~line 180

### Bug 5: Unsafe Category Type Casting

**File**: `apps/api/src/routes/transactions.ts`

**Function**: POST `/` route handler

**Specific Changes**:

1. **Add Type Guard Function** (at module level or imported from shared):
   ```typescript
   function isValidCategory(value: unknown): value is CategoryKey {
     const validCategories: CategoryKey[] = [
       'uncategorized',
       'business_income',
       'business_expense',
       'inventory_purchase',
       'inventory_sale',
       'personal_drawing',
       'loan_principal_repayment',
       'loan_interest_payment',
       'tax_payment',
       'equipment_purchase',
       'rent',
       'utilities',
       'marketing',
       'staff_wages',
       'transport'
     ];
     return typeof value === 'string' && validCategories.includes(value as CategoryKey);
   }
   ```

2. **Add Runtime Validation**: After Zod validation
   ```typescript
   const validated = manualTransactionSchema.parse(req.body);
   
   if (!isValidCategory(validated.category)) {
     res.status(400).json({ error: `Invalid category: ${validated.category}` });
     return;
   }
   ```

3. **Remove 'as any' Assertion**: Use validated.category directly
   ```typescript
   const created = TransactionService.create(businessId, {
     ...validated,
     category: validated.category  // No 'as any'
   });
   ```

4. **Alternative Approach**: Fix type alignment in shared package schema to ensure Zod output matches CategoryKey exactly

**Lines to Modify**: ~lines 96-103 in POST handler

**Note**: This fix may require checking/updating the `manualTransactionSchema` definition in `@cashflow-mate/shared` to ensure proper type alignment.

### Bug 6: Unhandled Promise Rejections

**File**: `my-app/app/modal.tsx` (Expo mobile app)

**Function**: `useEffect()` hook in ModalScreen component

**Specific Changes**:

1. **Add Error Handlers to Promise Chains**: Add `.catch()` to each promise
   ```typescript
   useEffect(() => {
     MobileStorageService.getBusiness()
       .then((biz) => {
         setBusiness(biz);
         if (biz?.name) setEditStallName(biz.name);
       })
       .catch((error) => {
         console.error('Failed to load business profile:', error);
         setBusiness(null);
       });
     
     MobileLicenseService.getActiveLicense()
       .then((lic) => {
         setLicense(lic);
         setKeyInput(lic.key);
       })
       .catch((error) => {
         console.error('Failed to load license information:', error);
         setLicense({
           status: 'trial',
           key: '',
           activatedAt: null,
           expiresAt: null
         });
       });
     
     MobileSecurityService.getSecuritySettings()
       .then(setSecurity)
       .catch((error) => {
         console.error('Failed to load security settings:', error);
         setSecurity({
           hasPIN: false,
           pinSetAt: null,
           biometricEnabled: false
         });
       });
     
     MobileAuthService.getSession()
       .then((sess) => {
         setSession(sess);
         if (sess?.username || sess?.name) {
           setEditUsername(sess.username || sess.name);
         }
       })
       .catch((error) => {
         console.error('Failed to load session:', error);
         setSession(null);
       });
     
     // Similar for other promises (rates, sync status)
   }, []);
   ```

2. **Define Fallback States**: Ensure fallback values match expected types

3. **Optional Enhancement**: Add user-visible error indicator (non-intrusive toast or banner) for critical failures

**Lines to Modify**: ~lines 77-97 in useEffect

**Note**: Similar pattern should be applied to other promise chains in the file (MobileExchangeService.getRates, MobileSyncService.getSyncStatus)

## Data Flow Changes

### Bug 1: Debt Overpayment Validation

**Before Fix:**
```
User submits payment → Route handler → DebtService.recordPayment() 
→ Calculate newPaid → Update database → Return updated debt
```

**After Fix:**
```
User submits payment → Route handler → DebtService.recordPayment() 
→ Retrieve debt → Calculate outstanding balance 
→ [NEW] Validate payment ≤ outstanding 
→ If invalid: throw error → Route returns 400 
→ If valid: Calculate newPaid → Update database → Return updated debt
```

**Impact**: Adds one validation step before database modification. Error response returns earlier in invalid cases.

### Bug 2: CSV Date Parsing Ambiguity

**Before Fix:**
```
User uploads CSV → parseAndPreview() → Parse dates with default DD/MM/YYYY 
→ Return preview → User confirms → commitImport()
```

**After Fix:**
```
User uploads CSV → parseAndPreview() → Parse dates 
→ [NEW] Detect ambiguous dates → Flag in preview 
→ Return preview with ambiguity warnings 
→ [NEW] UI shows format selector 
→ User selects format and confirms → parseAndPreview() again with formatHint 
→ commitImport()
```

**Impact**: Adds ambiguity detection step and potential re-parse with user-selected format. May require additional API call to re-parse with selected format.

### Bug 3: Transaction Amount Validation

**Before Fix:**
```
User submits transaction → Route handler → Zod validation 
→ TransactionService.create() → Insert database → Return created transaction
```

**After Fix:**
```
User submits transaction → Route handler → Zod validation 
→ TransactionService.create() → [NEW] Validate amount > 0 
→ If invalid: throw error → Route returns 400 
→ If valid: Insert database → Return created transaction
```

**Impact**: Adds service-level validation as second layer. Provides protection for direct service calls.

### Bug 4: CSV Duplicate Detection

**Before Fix:**
```
parseAndPreview() → For each row → Build composite key (rawRef || '')_date_amount_desc 
→ Check if seen → If duplicate: flag with isDuplicate=true 
→ commitImport() → Skip all isDuplicate rows if skipDuplicates=true
```

**After Fix:**
```
parseAndPreview() → For each row 
→ [NEW] If has rawRef: use ref:${rawRef} key → Check if seen 
→ If duplicate: flag with duplicateType='confirmed', autoSkip=true 
→ [NEW] If no rawRef: use data:${date_amount_desc} key → Check if seen 
→ If duplicate: flag with duplicateType='possible', autoSkip=false 
→ commitImport() → Skip only rows with autoSkip=true
```

**Impact**: Replaces simple duplicate flag with differentiated classification. Reduces false positive auto-skips.

### Bug 5: Unsafe Category Type Casting

**Before Fix:**
```
POST /transactions → Zod validation → validated.category 
→ Pass to service with 'as any' → Database insert
```

**After Fix:**
```
POST /transactions → Zod validation → validated.category 
→ [NEW] Type guard check → If invalid: return 400 error 
→ If valid: Pass to service without type assertion → Database insert
```

**Impact**: Adds runtime type validation step. Improves type safety without changing data flow for valid inputs.

### Bug 6: Unhandled Promise Rejections

**Before Fix:**
```
Component mount → useEffect() → Promise.then() → Update state 
→ If promise rejects: Unhandled rejection → State remains undefined
```

**After Fix:**
```
Component mount → useEffect() → Promise.then() → Update state 
→ [NEW] .catch() → Log error → Set fallback state → UI renders with defaults
```

**Impact**: Adds error handling branch to promise chains. Ensures state is always defined.

## Testing Strategy

### Validation Approach

The testing strategy follows a three-phase approach: 
1. **Exploratory Testing**: Surface counterexamples on unfixed code to confirm root causes
2. **Fix Verification**: Verify fixes work correctly for all bug conditions
3. **Preservation Testing**: Ensure existing behavior remains unchanged for non-bug inputs

All tests must maintain the existing 93-test suite passing rate. Financial arithmetic must remain deterministic using `roundCurrency()` from shared package.

### Bug 1: Debt Overpayment Validation

#### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that overpayments are currently accepted.

**Test Plan**: Write tests that attempt overpayments on various debt scenarios. Run these tests on the UNFIXED code to observe data corruption.

**Test Cases**:
1. **Full Overpayment Test**: Create debt with $100 total, attempt $200 payment (will be accepted on unfixed code)
2. **Partial Overpayment Test**: Create debt with $500 total, pay $400, then attempt $200 (will be accepted, creating $600 paid)
3. **Small Overpayment Test**: Create debt with $50 total, pay $40, attempt $15 (will be accepted, creating $55 paid)
4. **Exact Payment Test**: Create debt with $100 total, attempt $100 payment (should work on both)

**Expected Counterexamples**:
- paidAmount exceeds totalAmount in database
- Debts marked as 'settled' despite logical inconsistency
- No error returned to caller

#### Fix Checking

**Goal**: Verify that for all inputs where overpayment is attempted, the fixed function rejects the payment.

**Test Plan**: Write property-based tests that generate random debt states and overpayment amounts, asserting rejection with proper error message.

**Pseudocode:**
```
FOR ALL debt WHERE debt.totalAmount > debt.paidAmount DO
  outstandingBalance := debt.totalAmount - debt.paidAmount
  overpayment := outstandingBalance + randomPositiveAmount()
  
  result := EXPECT_ERROR(recordPayment_fixed(debt.id, overpayment))
  ASSERT result.error.message CONTAINS "exceeds outstanding balance"
  ASSERT result.error.message CONTAINS outstandingBalance.toFixed(2)
END FOR
```

**Property Test Cases**:
- Random debt amounts from $0.01 to $10,000
- Random overpayments from $0.01 to $1,000 over outstanding
- Edge case: overpayment by $0.01
- Edge case: payment exactly equals outstanding + floating point epsilon

#### Preservation Checking

**Goal**: Verify that for all valid payments (amount ≤ outstanding), the fixed function produces the same result as the original.

**Test Plan**: Write property-based tests that generate random valid payment scenarios and assert identical behavior.

**Pseudocode:**
```
FOR ALL debt WHERE debt.totalAmount > debt.paidAmount DO
  outstandingBalance := debt.totalAmount - debt.paidAmount
  validPayment := randomAmount(0.01, outstandingBalance)
  
  originalResult := recordPayment_original(debt.id, validPayment)
  fixedResult := recordPayment_fixed(debt.id, validPayment)
  
  ASSERT fixedResult.paidAmount = originalResult.paidAmount
  ASSERT fixedResult.status = originalResult.status
END FOR
```

**Test Cases**:
- Valid partial payments
- Exact settlement payments
- First payment on new debt
- Final payment on nearly-settled debt
- Multiple sequential payments
- Payments with floating-point arithmetic challenges

### Bug 2: CSV Date Parsing Ambiguity

#### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate ambiguous date parsing on unfixed code.

**Test Plan**: Create CSV files with ambiguous dates and observe which dates are misparsed when user expected different format.

**Test Cases**:
1. **All Ambiguous CSV**: File with dates like "01/02/2026", "03/04/2026", etc. (will parse as DD/MM on unfixed)
2. **Mixed Ambiguous**: File with "05/06/2026" (ambiguous) and "25/06/2026" (unambiguous) (no warning on unfixed)
3. **US Format Expected**: User expects MM/DD but system parses as DD/MM (silent misparsing)
4. **Format Hint Provided**: Dates with explicit formatHint (should work on both)

**Expected Counterexamples**:
- Ambiguous dates parsed without warning
- No UI control to select format
- Dates may be recorded incorrectly based on user's expectation

#### Fix Checking

**Goal**: Verify that all ambiguous dates are flagged and can be re-parsed with user-selected format.

**Test Plan**: Property-based tests generating dates where both components ≤12, asserting they're flagged.

**Pseudocode:**
```
FOR ALL date WHERE date.day <= 12 AND date.month <= 12 AND NOT ISO_FORMAT DO
  csvRow := formatAsCSV(date)
  result := parseAndPreview_fixed(csvRow, mapping, NO_FORMAT_HINT)
  
  ASSERT result.previewRows[0].isAmbiguousDate = true
  ASSERT result.previewRows[0].ambiguityWarning IS NOT NULL
  ASSERT result.hasAmbiguousDates = true
END FOR
```

**Test Cases**:
- Dates with day=1-12, month=1-12
- User selects MM/DD/YYYY format and re-parses
- User selects DD/MM/YYYY format and re-parses
- Verify correct parsing based on selected format

#### Preservation Checking

**Goal**: Verify that unambiguous dates continue to parse correctly without user intervention.

**Test Plan**: Property-based tests with unambiguous dates (ISO, day>12, month>12, or formatHint) asserting no flags.

**Pseudocode:**
```
FOR ALL date WHERE (date.day > 12 OR date.month > 12 OR ISO_FORMAT OR HAS_FORMAT_HINT) DO
  csvRow := formatAsCSV(date)
  result := parseAndPreview_fixed(csvRow, mapping)
  
  ASSERT result.previewRows[0].isAmbiguousDate IS false OR undefined
  ASSERT result.previewRows[0].parsedDate = expectedDate(date)
END FOR
```

**Test Cases**:
- ISO 8601 dates (YYYY-MM-DD)
- Dates with day > 12 (e.g., "25/06/2026")
- Dates with explicit formatHint
- Dates with month > 12 in first position (e.g., "13/01/2026" only valid as DD/MM)

### Bug 3: Transaction Amount Validation

#### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples demonstrating that service-level validation is missing on unfixed code.

**Test Plan**: Directly call TransactionService.create() with invalid amounts, bypassing route validation.

**Test Cases**:
1. **Zero Amount Direct Call**: Call service with amount=0 (may reach database on unfixed)
2. **Negative Amount Direct Call**: Call service with amount=-50 (may reach database on unfixed)
3. **Undefined Amount**: Call service with amount=undefined (may cause database error)
4. **Route Layer Validation**: Call via POST /transactions with amount=0 (Zod catches on both)

**Expected Counterexamples**:
- Direct service calls with invalid amounts reach database
- No error thrown at service layer
- Defense-in-depth is missing

#### Fix Checking

**Goal**: Verify that service-level validation rejects all invalid amounts.

**Test Plan**: Property-based tests calling service directly with invalid amounts.

**Pseudocode:**
```
FOR ALL amount WHERE amount <= 0 DO
  result := EXPECT_ERROR(TransactionService.create_fixed(businessId, { amount: amount }))
  ASSERT result.error.message = "Transaction amount must be greater than zero"
END FOR
```

**Test Cases**:
- amount = 0
- amount = -1
- amount = -1000
- amount = undefined
- amount = null
- amount = NaN
- amount = -0.01

#### Preservation Checking

**Goal**: Verify that valid amounts continue to create transactions successfully.

**Test Plan**: Property-based tests with valid amounts asserting identical behavior.

**Pseudocode:**
```
FOR ALL amount WHERE amount > 0 DO
  originalResult := TransactionService.create_original(businessId, { amount: amount })
  fixedResult := TransactionService.create_fixed(businessId, { amount: amount })
  
  ASSERT fixedResult.amount = originalResult.amount
  ASSERT fixedResult.id IS NOT NULL
END FOR
```

**Test Cases**:
- Small amounts ($0.01)
- Large amounts ($999,999.99)
- Random amounts
- Route layer + service layer validation (both pass)

### Bug 4: CSV Duplicate Detection

#### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples showing false positives on unfixed code.

**Test Plan**: Create CSV files with legitimate transactions that have no rawRef but same date/amount/description.

**Test Cases**:
1. **Same Day Same Amount**: Two legitimate purchases of tomatoes for $50 on same day (will be flagged as duplicate on unfixed)
2. **Weekly Recurring**: Same rent payment of $200 every month on different dates (should not be flagged)
3. **With Reference**: Two transactions with different rawRef values (should not be flagged on both)
4. **True Duplicate**: Two rows with same rawRef (should be flagged on both)

**Expected Counterexamples**:
- Legitimate transactions without references flagged as duplicates
- Automatic exclusion of valid data
- User has no way to override false positives

#### Fix Checking

**Goal**: Verify that transactions without rawRef are flagged as "possible" not "confirmed" duplicates.

**Test Plan**: Property-based tests generating transactions without references, asserting correct classification.

**Pseudocode:**
```
FOR ALL transactions WHERE tx1.rawRef IS NULL AND tx2.rawRef IS NULL
    AND tx1.date = tx2.date AND tx1.amount = tx2.amount AND tx1.description = tx2.description DO
  
  result := parseAndPreview_fixed([tx1, tx2])
  
  duplicateRow := result.previewRows.find(r => r.isDuplicate)
  ASSERT duplicateRow.duplicateType = 'possible'
  ASSERT duplicateRow.autoSkip = false
  ASSERT duplicateRow.duplicateReason CONTAINS "Review recommended"
END FOR
```

**Test Cases**:
- Multiple transactions with no rawRef, same data
- Transactions with rawRef matches (confirmed duplicates)
- Mixed: some with ref, some without
- Database duplicate detection (existing transactions)

#### Preservation Checking

**Goal**: Verify that true duplicate detection continues to work correctly.

**Test Plan**: Property-based tests with unique transactions and true duplicates asserting correct behavior.

**Pseudocode:**
```
FOR ALL transactions WHERE each has unique rawRef OR unique date/amount/description DO
  originalResult := parseAndPreview_original(transactions)
  fixedResult := parseAndPreview_fixed(transactions)
  
  ASSERT fixedResult.validRows = originalResult.validRows
  ASSERT fixedResult.duplicateRows = originalResult.duplicateRows
  
  FOR EACH row IN fixedResult.previewRows WHERE NOT row.isDuplicate DO
    ASSERT row is imported successfully
  END FOR
END FOR
```

**Test Cases**:
- Unique transactions with references
- Unique transactions without references but different amounts
- Confirmed duplicates with matching rawRef
- Cross-import duplicate detection from database

### Bug 5: Unsafe Category Type Casting

#### Exploratory Bug Condition Checking

**Goal**: Demonstrate that 'as any' bypasses type safety on unfixed code.

**Test Plan**: Attempt to pass invalid category values and observe TypeScript's inability to catch at compile time.

**Test Cases**:
1. **Invalid String**: Manually construct request with category="invalid_category" (may reach database if Zod misconfigured)
2. **Type Assertion Bypass**: Show that 'as any' suppresses TypeScript errors
3. **Valid Category**: Pass valid CategoryKey (works on both)
4. **Zod Catches**: Zod validation catches invalid categories at route layer (if configured correctly)

**Expected Counterexamples**:
- Type assertion prevents compile-time checking
- Runtime type mismatches possible if Zod schema misaligned
- No explicit type guard exists

#### Fix Checking

**Goal**: Verify that type guard validates categories and rejects invalid values.

**Test Plan**: Unit tests attempting invalid categories, asserting rejection.

**Test Cases**:
- Invalid category string
- Null/undefined category
- Empty string category
- Valid CategoryKey values (should pass)
- Type guard returns correct boolean

#### Preservation Checking

**Goal**: Verify that valid categories continue to work correctly.

**Test Plan**: Property-based tests with all valid CategoryKey values asserting successful creation.

**Pseudocode:**
```
FOR ALL category IN validCategoryKeys DO
  originalResult := POST_transactions_original({ category: category })
  fixedResult := POST_transactions_fixed({ category: category })
  
  ASSERT fixedResult.category = originalResult.category
  ASSERT fixedResult.id IS NOT NULL
END FOR
```

**Test Cases**:
- All 15 valid CategoryKey values
- Transaction creation via route
- Transaction updates with category changes
- Category-based filtering and grouping

### Bug 6: Unhandled Promise Rejections

#### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples showing promise rejections causing undefined state on unfixed code.

**Test Plan**: Mock service failures and observe UI behavior on unfixed code.

**Test Cases**:
1. **Security Settings Failure**: Mock getSecuritySettings() rejection (state remains undefined on unfixed)
2. **License Failure**: Mock getActiveLicense() rejection (state remains undefined on unfixed)
3. **Multiple Failures**: Both services fail (UI may crash or show incorrect data)
4. **Successful Load**: All services succeed (works on both)

**Expected Counterexamples**:
- Unhandled promise rejections logged to console
- State variables remain undefined
- UI renders with undefined data
- No error indication to user

#### Fix Checking

**Goal**: Verify that all promise rejections are caught and handled with fallback state.

**Test Plan**: Unit tests mocking service failures, asserting error handlers are called.

**Test Cases**:
- Mock getSecuritySettings() rejection, assert console.error called and fallback state set
- Mock getActiveLicense() rejection, assert fallback license state set
- Verify fallback state values match expected types
- Verify UI renders correctly with fallback data

#### Preservation Checking

**Goal**: Verify that successful promise resolutions continue to update state correctly.

**Test Plan**: Unit tests mocking successful service responses, asserting state updates.

**Pseudocode:**
```
FOR ALL service IN [MobileSecurityService, MobileLicenseService, ...] DO
  mockedResponse := validServiceResponse()
  mockService(service, mockedResponse)
  
  originalBehavior := useEffect_original()
  fixedBehavior := useEffect_fixed()
  
  ASSERT fixedBehavior.state = originalBehavior.state
  ASSERT fixedBehavior.state = mockedResponse
END FOR
```

**Test Cases**:
- Successful security settings load
- Successful license load
- Successful business profile load
- Successful session load
- All services succeed together

### Unit Tests

#### Bug 1: Debt Overpayment
- Test overpayment rejection with various amounts
- Test error message format and content
- Test outstanding balance calculation with roundCurrency
- Test valid payments continue to work
- Test edge case: payment exactly equals outstanding

#### Bug 2: CSV Date Ambiguity
- Test ambiguous date detection (both parts ≤12)
- Test unambiguous date parsing (day>12, month>12, ISO)
- Test user format selection (DD/MM vs MM/DD)
- Test formatHint priority
- Test mixed ambiguous and unambiguous dates

#### Bug 3: Transaction Amount Validation
- Test service-level rejection of amount ≤ 0
- Test route-level Zod validation still works
- Test valid amounts create successfully
- Test error message format
- Test defense-in-depth (both layers)

#### Bug 4: CSV Duplicate Detection
- Test confirmed duplicate classification (matching rawRef)
- Test possible duplicate classification (no rawRef)
- Test autoSkip flag logic
- Test unique transactions not flagged
- Test database duplicate detection

#### Bug 5: Unsafe Category Casting
- Test type guard with valid categories
- Test type guard with invalid categories
- Test runtime validation rejects invalid
- Test valid categories create successfully
- Test TypeScript compile-time checking (if possible)

#### Bug 6: Unhandled Promises
- Test error handlers catch rejections
- Test fallback state values
- Test console.error logging
- Test successful resolutions update state
- Test UI renders with fallback data

### Property-Based Tests

#### Bug 1: Debt Overpayment
- Generate random debt amounts and overpayments, verify all rejected
- Generate random valid payments, verify all accepted
- Test with floating-point arithmetic edge cases

#### Bug 2: CSV Date Ambiguity
- Generate dates with day=1-12, month=1-12, verify all flagged
- Generate dates with day>12 or month>12, verify none flagged
- Test format selection changes parsed dates correctly

#### Bug 3: Transaction Amount Validation
- Generate amounts ≤0, verify all rejected at service layer
- Generate amounts >0, verify all accepted
- Test with large and small amounts

#### Bug 4: CSV Duplicate Detection
- Generate transactions without rawRef, verify flagged as "possible"
- Generate transactions with unique rawRef, verify not flagged
- Generate true duplicates, verify flagged as "confirmed"

#### Bug 5: Unsafe Category Casting
- Generate all valid CategoryKey values, verify all accepted
- Generate invalid category strings, verify all rejected
- Test type guard coverage

#### Bug 6: Unhandled Promises
- Mock random service failures, verify all caught
- Mock successful responses, verify state updates
- Test various error types

### Integration Tests

#### Bug 1: Debt Overpayment
- Full flow: Create debt → Attempt overpayment via API → Assert 400 error
- Full flow: Create debt → Make valid payments → Assert settlement
- Test with multiple debts and payments

#### Bug 2: CSV Date Ambiguity
- Full flow: Upload CSV with ambiguous dates → Preview shows flags → Select format → Re-parse → Import
- Test with real bank statement CSV files
- Test format persistence for user

#### Bug 3: Transaction Amount Validation
- Full flow: POST transaction with amount=0 → Assert 400 at route layer
- Full flow: Direct service call with amount=0 → Assert error at service layer
- Full flow: Valid transaction creation end-to-end

#### Bug 4: CSV Duplicate Detection
- Full flow: Upload CSV with possible duplicates → Preview shows warnings → User selects which to import → Import
- Full flow: Upload CSV with confirmed duplicates → Auto-skip confirmed → Import
- Test cross-import duplicate detection

#### Bug 5: Unsafe Category Casting
- Full flow: POST transaction with invalid category → Assert 400 error
- Full flow: POST transaction with valid category → Assert successful creation
- Test category filtering and reporting

#### Bug 6: Unhandled Promises
- Full flow: Open settings modal with service failures → UI renders with fallbacks → No crashes
- Full flow: Open settings modal with successful loads → UI displays correctly
- Test error recovery when services recover

### Test Suite Integration

All new tests must:
1. **Maintain 93/93 Passing**: No existing tests should break
2. **Use Deterministic Arithmetic**: All financial calculations use `roundCurrency()` from shared package
3. **Follow Existing Patterns**: Match test structure and naming conventions in `apps/api/src/api.test.ts`
4. **Run in CI**: All tests run in automated pipeline
5. **Fast Execution**: Property-based tests use reasonable iteration counts (100-1000)

## Backward Compatibility Considerations

### API Compatibility

**No Breaking Changes**:
- All fixes maintain existing API signatures
- Error responses use HTTP 400 (Bad Request) for validation failures
- Response schemas unchanged for valid inputs
- Route paths and methods unchanged

**New Optional Fields**:
- ImportPreviewRow gains optional fields (isAmbiguousDate, duplicateType, etc.)
- ImportPreviewResult gains optional fields (hasAmbiguousDates, suggestedFormats)
- These are additive and don't affect existing clients

### Database Compatibility

**No Schema Changes**:
- All fixes work with existing database schema
- No migrations required
- Existing data remains valid

**Data Integrity**:
- Bug 1 fix prevents future data corruption but doesn't repair existing corrupted debts
- Existing debts with paidAmount > totalAmount may need manual cleanup
- Consider one-time data cleanup script for production

### Client Compatibility

**Web App**:
- CSV import UI may need updates to show ambiguity warnings and format selector
- Debt payment UI unchanged (validation happens server-side)
- Transaction creation unchanged (validation happens server-side)

**Mobile App**:
- Settings modal changes are internal (error handling)
- No UI changes required for Bug 6 fix
- No breaking changes to service APIs

### Configuration Compatibility

**No Config Changes**:
- All fixes work with existing configuration
- No environment variable changes
- No deployment changes required

### Rollback Safety

All fixes can be safely rolled back by reverting code changes:
- **Bug 1**: Rollback removes overpayment validation (returns to buggy state)
- **Bug 2**: Rollback removes ambiguity detection (returns to silent default)
- **Bug 3**: Rollback removes service-level validation (returns to route-only validation)
- **Bug 4**: Rollback removes differentiated classification (returns to simple duplicate flag)
- **Bug 5**: Rollback restores 'as any' (returns to bypassed type safety)
- **Bug 6**: Rollback removes error handlers (returns to unhandled rejections)

No data cleanup needed for rollback since fixes are validation-only.

### Performance Considerations

**Minimal Performance Impact**:
- **Bug 1**: One additional subtraction operation per payment (negligible)
- **Bug 2**: Regex match and comparison per date (negligible for typical CSV sizes)
- **Bug 3**: One additional comparison per transaction creation (negligible)
- **Bug 4**: Map-based tracking instead of Set (negligible memory increase)
- **Bug 5**: Type guard check (negligible)
- **Bug 6**: Error handler registration (negligible)

**No N+1 Queries**:
- All fixes operate on in-memory data
- No additional database queries introduced

**CSV Import Performance**:
- Bug 2 and Bug 4 fixes operate within existing loop
- No additional parsing passes required (unless user re-parses with format selection)

### Deployment Strategy

**Recommended Approach**:
1. Deploy all fixes together (they're independent)
2. Run full test suite in staging (93/93 must pass)
3. Monitor error logs for validation errors after deployment
4. Optional: Run data cleanup script for existing corrupted debts (Bug 1)
5. Optional: Monitor CSV imports for ambiguity warnings (Bug 2)

**Feature Flags** (Optional):
- Not required since fixes are non-breaking
- Could add flags for gradual rollout if desired

**Monitoring**:
- Track validation error rates for each bug fix
- Monitor CSV import success rates
- Track mobile app error logs for promise rejections
- Alert on unexpected increases in validation errors
