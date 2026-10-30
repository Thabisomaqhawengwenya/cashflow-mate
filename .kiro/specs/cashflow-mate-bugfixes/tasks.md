# CashFlow Mate Bugfixes - Implementation Tasks

This task list implements fixes for 6 bugs following the exploratory bugfix workflow: Explore → Preserve → Implement → Validate. Each bug includes property-based tests written BEFORE the fix to understand the bug, preservation tests to prevent regressions, and implementation tasks with validation.

**Priority Order:**
1. Bug 1 (MEDIUM): Debt Overpayment Validation - data corruption risk
2. Bug 3 (LOW): Transaction Amount Validation - defense-in-depth
3. Bug 2 (LOW-MEDIUM): CSV Date Parsing Ambiguity - UX improvement
4. Bug 4 (LOW): CSV Duplicate Detection - false positive reduction
5. Bug 5 (LOW): Unsafe Category Casting - type safety
6. Bug 6 (LOW): Unhandled Promise Rejections - error resilience

---

## Bug 1: Debt Overpayment Validation (MEDIUM Severity)

### Exploration Phase

- [ ] 1.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Debt Overpayment Acceptance
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate overpayments are currently accepted
  - **File**: `apps/api/src/services/debts.test.ts` (create if not exists)
  - **Test Implementation**:
    - Create test cases for overpayment scenarios from Bug Condition specification
    - Test 1: Full overpayment - debt with totalAmount=$100, paidAmount=$0, attempt $150 payment
    - Test 2: Partial overpayment - debt with totalAmount=$500, paidAmount=$400, attempt $200 payment
    - Test 3: Small overpayment - debt with totalAmount=$50, paidAmount=$40, attempt $15 payment
    - Assert that overpayments should be REJECTED with error message matching format: "Payment amount ($X.XX) exceeds outstanding balance ($Y.YY)"
    - Use deterministic arithmetic with roundCurrency() from @cashflow-mate/shared
  - Run test on UNFIXED code in `apps/api/src/services/debts.ts`
  - **EXPECTED OUTCOME**: Test FAILS (overpayments are accepted, paidAmount exceeds totalAmount)
  - Document counterexamples found:
    - Record exact failure scenarios (e.g., "Payment of $150 on $100 debt results in paidAmount=$150, status='settled'")
    - Note data corruption: paidAmount > totalAmount
    - Confirm bug exists as described in specification
  - Mark task complete when test is written, run, and failures are documented
  - _Bug_Condition: isBugCondition(input) where input.paymentAmount > (debt.totalAmount - debt.paidAmount) AND outstandingBalance > 0_
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### Preservation Phase

- [ ] 1.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Valid Payment Acceptance
  - **IMPORTANT**: Follow observation-first methodology
  - **File**: `apps/api/src/services/debts.test.ts`
  - **Test Implementation**:
    - Observe behavior on UNFIXED code for non-buggy inputs (valid payments where amount ≤ outstanding balance)
    - Test Case 1: Valid partial payment - debt $100 total, $20 paid, attempt $30 payment → observe paidAmount=$50, status='partially_paid'
    - Test Case 2: Exact settlement - debt $100 total, $50 paid, attempt $50 payment → observe paidAmount=$100, status='settled'
    - Test Case 3: First payment - new debt $500 total, attempt $100 payment → observe paidAmount=$100, status='partially_paid'
    - Test Case 4: Sequential payments - multiple valid payments in sequence → observe correct cumulative paidAmount
    - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
      - For all valid payments (amount ≤ outstanding), paidAmount increases correctly
      - Status transitions to 'settled' when paidAmount = totalAmount
      - Payment history retrieval returns accurate records
      - Debt statistics calculate totals correctly
    - Use fast-check or similar library for property-based testing
    - Use roundCurrency() for deterministic arithmetic
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Preservation: Valid payments (amount ≤ outstanding balance) must continue to be accepted and recorded correctly_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

### Implementation Phase

- [ ] 1.3 Fix debt overpayment validation

  - [ ] 1.3.1 Implement overpayment validation
    - **File**: `apps/api/src/services/debts.ts`
    - **Function**: `DebtService.recordPayment()`
    - **Location**: Lines ~89-96 (after retrieving existing debt, before calculating newPaid)
    - **Changes**:
      ```typescript
      // After: const existing = this.getById(businessId, debtId);
      // Add validation block:
      const roundedPayment = roundCurrency(paymentAmount);
      const outstandingBalance = roundCurrency(existing.totalAmount - existing.paidAmount);
      
      if (roundedPayment > outstandingBalance) {
        throw new Error(
          `Payment amount ($${roundedPayment.toFixed(2)}) exceeds outstanding balance ($${outstandingBalance.toFixed(2)})`
        );
      }
      ```
    - Replace direct `paymentAmount` usage with `roundedPayment` in subsequent calculations
    - Maintain existing settlement logic (status update when paidAmount >= totalAmount)
    - Error propagates to route handler for HTTP 400 response
    - _Bug_Condition: isBugCondition(input) where input.paymentAmount > outstandingBalance_
    - _Expected_Behavior: Reject overpayments with clear error message before database modification_
    - _Preservation: Valid payments continue to work identically to original function_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [ ] 1.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Overpayment Rejection
    - **IMPORTANT**: Re-run the SAME test from task 1.1 - do NOT write a new test
    - The test from task 1.1 encodes the expected behavior (overpayments rejected)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run: `npm test debts.test.ts` or equivalent in `apps/api`
    - **EXPECTED OUTCOME**: Test PASSES (overpayments now rejected with correct error message)
    - Verify error message format matches: "Payment amount ($X.XX) exceeds outstanding balance ($Y.YY)"
    - Verify no database modification occurs on rejection
    - _Requirements: 2.1, 2.2_

  - [ ] 1.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid Payment Acceptance
    - **IMPORTANT**: Re-run the SAME tests from task 1.2 - do NOT write new tests
    - Run preservation property tests from step 1.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all valid payment scenarios still work:
      - Partial payments accepted and recorded correctly
      - Exact settlement payments mark debt as 'settled'
      - Payment history retrieval accurate
      - Debt statistics calculations correct
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 1.4 Checkpoint - Verify all Bug 1 tests pass
  - Run full test suite in `apps/api`
  - Ensure original 93 tests still pass
  - Ensure new Bug 1 tests pass (exploration + preservation)
  - Verify deterministic arithmetic maintained with roundCurrency()

---

## Bug 2: CSV Date Parsing Ambiguity (LOW-MEDIUM Severity)

### Exploration Phase

- [ ] 2.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Ambiguous Date Silent Misparsing
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples demonstrating ambiguous dates are parsed without user confirmation
  - **File**: `apps/api/src/services/imports.test.ts` (create if not exists)
  - **Test Implementation**:
    - Create CSV test data with ambiguous dates from Bug Condition specification:
      - Date "05/06/2026" (could be May 6 or June 5)
      - Date "01/12/2025" (could be Jan 12 or Dec 1)
      - Date "10/11/2024" (could be Oct 11 or Nov 10)
    - Test that isBugCondition(input) is true: both date parts ≤12 AND no formatHint provided
    - Assert expected behavior: rows should be flagged with isAmbiguousDate=true and warning "Ambiguous date format - Review required"
    - Assert preview result should include hasAmbiguousDates=true and suggestedFormats=['DD/MM/YYYY', 'MM/DD/YYYY']
  - Run test on UNFIXED code in `apps/api/src/services/imports.ts`
  - **EXPECTED OUTCOME**: Test FAILS (ambiguous dates parsed without flags/warnings)
  - Document counterexamples found:
    - Record which dates were parsed without warning
    - Note assumed format (likely DD/MM/YYYY default)
    - Confirm no user control offered for format selection
  - Mark task complete when test is written, run, and failure is documented
  - _Bug_Condition: isBugCondition(input) where input.rawDate has both parts ≤12 AND no formatHint_
  - _Requirements: 1.1, 1.2, 1.3_

### Preservation Phase

- [ ] 2.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Unambiguous Date Parsing
  - **IMPORTANT**: Follow observation-first methodology
  - **File**: `apps/api/src/services/imports.test.ts`
  - **Test Implementation**:
    - Observe behavior on UNFIXED code for non-buggy inputs (unambiguous dates)
    - Test Case 1: ISO format "2026-06-05" → observe correct parsing to June 5, 2026
    - Test Case 2: Unambiguous DD/MM "25/06/2026" (day>12) → observe correct parsing to June 25, 2026
    - Test Case 3: Unambiguous with month>12 "13/01/2026" → observe correct parsing to January 13, 2026
    - Test Case 4: With formatHint → observe correct parsing according to hint
    - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
      - ISO 8601 dates parse unambiguously without user intervention
      - Dates where day>12 OR month>12 parse correctly
      - Dates with explicit formatHint use the provided format
      - Successfully parsed dates normalize to ISO format for storage
    - Use property-based testing with various date generation strategies
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Preservation: Unambiguous dates must continue to parse correctly without user intervention_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

### Implementation Phase

- [ ] 2.3 Fix CSV date parsing ambiguity

  - [ ] 2.3.1 Extend ImportPreviewRow interface
    - **File**: `apps/api/src/services/imports.ts`
    - **Location**: ~line 18 (ImportPreviewRow interface)
    - **Changes**:
      ```typescript
      export interface ImportPreviewRow {
        // ... existing fields
        isAmbiguousDate?: boolean;  // NEW
        ambiguityWarning?: string;  // NEW
        // ... rest of fields
      }
      ```
    - _Requirements: 2.2_

  - [ ] 2.3.2 Extend ImportPreviewResult interface
    - **File**: `apps/api/src/services/imports.ts`
    - **Location**: ~line 27 (ImportPreviewResult interface)
    - **Changes**:
      ```typescript
      export interface ImportPreviewResult {
        // ... existing fields
        hasAmbiguousDates: boolean;  // NEW
        suggestedFormats: string[];  // NEW: ['DD/MM/YYYY', 'MM/DD/YYYY']
      }
      ```
    - _Requirements: 2.2, 2.3_

  - [ ] 2.3.3 Implement ambiguous date detection in parseAndPreview()
    - **File**: `apps/api/src/services/imports.ts`
    - **Function**: `ImportService.parseAndPreview()`
    - **Location**: ~lines 40-150 (in row processing loop after date parsing)
    - **Changes**:
      ```typescript
      // After extracting rawDate from row
      let isAmbiguousDate = false;
      let ambiguityWarning: string | undefined;
      
      const parsed = rawDate.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
      if (parsed && !mapping.dateFormat && !rawDate.match(/^\d{4}/)) {  // Not ISO format
        const part1 = parseInt(parsed[1], 10);
        const part2 = parseInt(parsed[2], 10);
        if (part1 <= 12 && part2 <= 12) {
          isAmbiguousDate = true;
          ambiguityWarning = 'Ambiguous date format - Review required';
          hasAmbiguousDates = true;  // Track at function level
        }
      }
      
      // Add to previewRows.push():
      previewRows.push({
        // ... existing fields
        isAmbiguousDate,
        ambiguityWarning,
        // ... rest of fields
      });
      ```
    - Initialize `hasAmbiguousDates = false` at function start
    - Add to return statement:
      ```typescript
      return {
        // ... existing fields
        hasAmbiguousDates,
        suggestedFormats: hasAmbiguousDates ? ['DD/MM/YYYY', 'MM/DD/YYYY'] : []
      };
      ```
    - _Bug_Condition: isBugCondition(input) where both date parts ≤12 AND no formatHint_
    - _Expected_Behavior: Flag ambiguous dates with warning, provide format options_
    - _Requirements: 2.2, 2.3_

  - [ ] 2.3.4 Enhance normalizeDate() with user format preference
    - **File**: `apps/api/src/services/imports.ts`
    - **Function**: `ImportService.normalizeDate()`
    - **Location**: ~lines 235-285
    - **Changes**:
      - Add optional parameter: `private static normalizeDate(raw: string, formatHint?: string, userSelectedFormat?: string): string | null`
      - Add priority logic:
        ```typescript
        const parsed = rawDate.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
        if (parsed) {
          const part1 = parseInt(parsed[1], 10);
          const part2 = parseInt(parsed[2], 10);
          const year = parsed[3];
          
          // Priority: userSelectedFormat > formatHint > heuristics > default
          if (userSelectedFormat === 'MM/DD/YYYY') {
            return `${year}-${pad(part1)}-${pad(part2)}`;
          } else if (userSelectedFormat === 'DD/MM/YYYY' || formatHint === 'DD/MM/YYYY') {
            return `${year}-${pad(part2)}-${pad(part1)}`;
          } else if (part1 <= 12 && part2 > 12) {
            // Unambiguous: part1 is month
            return `${year}-${pad(part1)}-${pad(part2)}`;
          } else {
            // Default to DD/MM/YYYY
            return `${year}-${pad(part2)}-${pad(part1)}`;
          }
        }
        ```
    - Note: Full re-parse with user-selected format may require frontend enhancement and additional API endpoint/parameter
    - _Expected_Behavior: Use user-selected format when provided, maintain existing logic otherwise_
    - _Preservation: Existing format detection logic preserved for unambiguous cases_
    - _Requirements: 2.1, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [ ] 2.3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Ambiguous Date Flagging
    - **IMPORTANT**: Re-run the SAME test from task 2.1 - do NOT write a new test
    - The test from task 2.1 encodes the expected behavior (ambiguous dates flagged)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run: `npm test imports.test.ts` or equivalent in `apps/api`
    - **EXPECTED OUTCOME**: Test PASSES (ambiguous dates now flagged with warnings)
    - Verify isAmbiguousDate=true for dates with both parts ≤12
    - Verify ambiguityWarning contains "Ambiguous date format - Review required"
    - Verify hasAmbiguousDates=true in preview result
    - Verify suggestedFormats includes both DD/MM/YYYY and MM/DD/YYYY
    - _Requirements: 2.2, 2.3_

  - [ ] 2.3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Unambiguous Date Parsing
    - **IMPORTANT**: Re-run the SAME tests from task 2.2 - do NOT write new tests
    - Run preservation property tests from step 2.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all unambiguous date scenarios still work:
      - ISO format dates parse correctly
      - Dates with day>12 or month>12 parse without flags
      - Dates with formatHint use the hint correctly
      - Dates normalize to ISO format for storage
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 2.4 Checkpoint - Verify all Bug 2 tests pass
  - Run full test suite in `apps/api`
  - Ensure original 93 tests still pass
  - Ensure new Bug 2 tests pass (exploration + preservation)
  - Note: Full UI integration for format selection may be deferred to frontend enhancement task

---

## Bug 3: Transaction Amount Validation (LOW Severity)

### Exploration Phase

- [ ] 3.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Service-Level Validation Bypass
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples demonstrating service-level validation is missing
  - **File**: `apps/api/src/services/transactions.test.ts` (create if not exists)
  - **Test Implementation**:
    - Test direct service calls (bypassing route layer Zod validation) from Bug Condition specification
    - Test Case 1: Zero amount - call TransactionService.create() with amount=0
    - Test Case 2: Negative amount - call TransactionService.create() with amount=-50
    - Test Case 3: Undefined amount - call TransactionService.create() with amount=undefined
    - Assert expected behavior: service should reject with error "Transaction amount must be greater than zero"
    - Test bypasses route handler to demonstrate defense-in-depth gap
  - Run test on UNFIXED code in `apps/api/src/services/transactions.ts`
  - **EXPECTED OUTCOME**: Test FAILS (invalid amounts may reach database or cause errors)
  - Document counterexamples found:
    - Record whether zero/negative amounts reach database
    - Note any database errors or constraint violations
    - Confirm service has no explicit amount validation
  - Mark task complete when test is written, run, and failure is documented
  - _Bug_Condition: isBugCondition(input) where input.amount ≤ 0 AND bypassedZod = true_
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### Preservation Phase

- [ ] 3.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Valid Transaction Creation
  - **IMPORTANT**: Follow observation-first methodology
  - **File**: `apps/api/src/services/transactions.test.ts`
  - **Test Implementation**:
    - Observe behavior on UNFIXED code for non-buggy inputs (valid amounts > 0)
    - Test Case 1: Small amount - create transaction with amount=$0.01 → observe successful creation
    - Test Case 2: Large amount - create transaction with amount=$999,999.99 → observe successful creation
    - Test Case 3: Random amounts - generate random amounts > 0 → observe all create successfully
    - Test Case 4: Via route handler - POST /transactions with valid amount → observe Zod + service both work
    - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
      - All transactions with amount > 0 create successfully
      - Route-level Zod validation continues to work
      - Transaction insertion includes all required fields
      - Transaction retrieval returns accurate amounts
    - Use property-based testing for amount generation
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Preservation: Valid transactions (amount > 0) must continue to create successfully_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

### Implementation Phase

- [ ] 3.3 Fix transaction amount validation

  - [ ] 3.3.1 Implement service-level amount validation
    - **File**: `apps/api/src/services/transactions.ts`
    - **Function**: `TransactionService.create()`
    - **Location**: ~line 110 (beginning of create() method, before database operations)
    - **Changes**:
      ```typescript
      static create(businessId: string, data: Partial<Transaction>): Transaction {
        // Service-level validation for defense-in-depth
        if (data.amount === undefined || data.amount <= 0) {
          throw new Error('Transaction amount must be greater than zero');
        }
        
        const db = getDb();
        // ... rest of existing logic unchanged
      }
      ```
    - Error propagates to route handler for HTTP 400 response
    - Maintain all existing transaction insertion logic
    - _Bug_Condition: isBugCondition(input) where input.amount ≤ 0_
    - _Expected_Behavior: Reject invalid amounts at service layer before database operations_
    - _Preservation: Valid amounts continue to create transactions identically to original_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Service-Level Validation
    - **IMPORTANT**: Re-run the SAME test from task 3.1 - do NOT write a new test
    - The test from task 3.1 encodes the expected behavior (service validates amounts)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run: `npm test transactions.test.ts` or equivalent in `apps/api`
    - **EXPECTED OUTCOME**: Test PASSES (service now rejects invalid amounts)
    - Verify error message matches: "Transaction amount must be greater than zero"
    - Verify no database operations occur on rejection
    - Verify defense-in-depth: both route and service layers validate
    - _Requirements: 2.1, 2.3_

  - [ ] 3.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid Transaction Creation
    - **IMPORTANT**: Re-run the SAME tests from task 3.2 - do NOT write new tests
    - Run preservation property tests from step 3.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all valid transaction scenarios still work:
      - Transactions with amount > 0 create successfully
      - Route-level Zod validation continues to work
      - All required fields stored correctly
      - Transaction retrieval returns accurate data
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.4 Checkpoint - Verify all Bug 3 tests pass
  - Run full test suite in `apps/api`
  - Ensure original 93 tests still pass
  - Ensure new Bug 3 tests pass (exploration + preservation)
  - Verify defense-in-depth: both Zod (route) and service validation work

---

## Bug 4: CSV Duplicate Detection False Positives (LOW Severity)

### Exploration Phase

- [ ] 4.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - False Positive Duplicate Flagging
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples demonstrating legitimate transactions incorrectly flagged
  - **File**: `apps/api/src/services/imports.test.ts`
  - **Test Implementation**:
    - Create CSV test data with legitimate transactions lacking rawRef from Bug Condition specification
    - Test Case 1: Two legitimate purchases - both have rawRef=null, date="2026-01-15", amount=50, description="Tomatoes purchase"
    - Test Case 2: Same-day same-amount transactions - multiple legitimate transactions on same day
    - Test Case 3: With reference - two transactions with different rawRef values (should not be flagged)
    - Assert expected behavior:
      - Transactions without rawRef should be flagged as duplicateType='possible' (not 'confirmed')
      - autoSkip should be false for 'possible' duplicates
      - duplicateReason should contain "Review recommended"
      - Transactions with unique rawRef should not be flagged
  - Run test on UNFIXED code in `apps/api/src/services/imports.ts`
  - **EXPECTED OUTCOME**: Test FAILS (legitimate transactions flagged and may be auto-skipped)
  - Document counterexamples found:
    - Record which legitimate transactions were incorrectly flagged
    - Note whether autoSkip caused data loss
    - Confirm composite key `_date_amount_desc` causes false positives
  - Mark task complete when test is written, run, and failure is documented
  - _Bug_Condition: isBugCondition(input) where multiple transactions have rawRef=null AND same date/amount/description_
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### Preservation Phase

- [ ] 4.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - True Duplicate Detection
  - **IMPORTANT**: Follow observation-first methodology
  - **File**: `apps/api/src/services/imports.test.ts`
  - **Test Implementation**:
    - Observe behavior on UNFIXED code for non-buggy inputs (true duplicates and unique transactions)
    - Test Case 1: Unique rawRef - transactions with different rawRef values → observe no duplicate flags
    - Test Case 2: True duplicate - two transactions with same rawRef, date, amount, description → observe confirmed duplicate flag
    - Test Case 3: Different dates - same amount/description but different dates → observe no duplicate flags
    - Test Case 4: Database duplicates - transactions matching existing database records → observe cross-import duplicate detection
    - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
      - Transactions with unique rawRef import without false warnings
      - Exact duplicates (matching rawRef) flagged as confirmed
      - Cross-import duplicate detection against database works
      - True duplicate prevention protects data integrity
    - Use property-based testing for transaction generation
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Preservation: True duplicate detection must continue to work correctly_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

### Implementation Phase

- [ ] 4.3 Fix CSV duplicate detection

  - [ ] 4.3.1 Extend ImportPreviewRow interface
    - **File**: `apps/api/src/services/imports.ts`
    - **Location**: ~line 18 (ImportPreviewRow interface)
    - **Changes**:
      ```typescript
      export interface ImportPreviewRow {
        // ... existing fields
        isDuplicate: boolean;
        duplicateType?: 'confirmed' | 'possible';  // NEW
        duplicateReason?: string;
        autoSkip?: boolean;  // NEW: Only true for confirmed duplicates
        // ... rest of fields
      }
      ```
    - _Requirements: 2.2, 2.3_

  - [ ] 4.3.2 Implement differentiated duplicate detection in parseAndPreview()
    - **File**: `apps/api/src/services/imports.ts`
    - **Function**: `ImportService.parseAndPreview()`
    - **Location**: ~lines 85-135 (duplicate detection logic in row processing loop)
    - **Changes**:
      - Replace simple Set with Map for differentiated tracking:
        ```typescript
        const seenInFile = new Map<string, { count: number, hasRef: boolean }>();
        ```
      - In row processing loop:
        ```typescript
        let isDuplicate = false;
        let duplicateType: 'confirmed' | 'possible' | undefined;
        let duplicateReason: string | undefined;
        
        if (isValid && parsedAmount && parsedDate) {
          // Check for intra-file duplicates
          if (rawRef && rawRef.trim() !== '') {
            // Has reference - exact duplicate detection
            const refKey = `ref:${rawRef}`;
            if (seenInFile.has(refKey)) {
              isDuplicate = true;
              duplicateType = 'confirmed';
              duplicateReason = 'Confirmed duplicate - Same reference number appears multiple times';
            } else {
              seenInFile.set(refKey, { count: 1, hasRef: true });
            }
          } else {
            // No reference - possible duplicate detection
            const dataKey = `data:${parsedDate}_${parsedAmount}_${parsedDescription}`;
            if (seenInFile.has(dataKey)) {
              isDuplicate = true;
              duplicateType = 'possible';
              duplicateReason = 'Possible duplicate - Review recommended (no reference number)';
            } else {
              seenInFile.set(dataKey, { count: 1, hasRef: false });
            }
          }
          
          // Database check (enhance existing logic)
          if (!isDuplicate) {
            const existing = await this.checkDatabaseDuplicate(businessId, rawRef, parsedDate, parsedAmount, parsedDescription);
            if (existing && rawRef) {
              isDuplicate = true;
              duplicateType = 'confirmed';
              duplicateReason = 'Confirmed duplicate - Matching reference exists in database';
            } else if (existing && !rawRef) {
              isDuplicate = true;
              duplicateType = 'possible';
              duplicateReason = 'Possible duplicate - Similar transaction exists (review recommended)';
            }
          }
        }
        
        previewRows.push({
          // ... existing fields
          isDuplicate,
          duplicateType,
          duplicateReason,
          autoSkip: duplicateType === 'confirmed'  // Only auto-skip confirmed
        });
        ```
    - _Bug_Condition: isBugCondition(input) where rawRef is missing AND date/amount/description match_
    - _Expected_Behavior: Differentiate 'confirmed' (with rawRef) from 'possible' (without rawRef) duplicates_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 4.3.3 Update commitImport() to respect autoSkip flag
    - **File**: `apps/api/src/services/imports.ts`
    - **Function**: `ImportService.commitImport()`
    - **Location**: ~line 180 (duplicate skip logic)
    - **Changes**:
      ```typescript
      // Replace: if (row.isDuplicate && skipDuplicates)
      // With:
      if (row.autoSkip && skipDuplicates) {
        duplicateSkipped++;
        continue;
      }
      ```
    - Only confirmed duplicates (autoSkip=true) are automatically excluded
    - Possible duplicates require manual review
    - _Expected_Behavior: Only auto-skip confirmed duplicates_
    - _Preservation: True duplicates continue to be prevented_
    - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4_

  - [ ] 4.3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Differentiated Duplicate Classification
    - **IMPORTANT**: Re-run the SAME test from task 4.1 - do NOT write a new test
    - The test from task 4.1 encodes the expected behavior (differentiated duplicate types)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run: `npm test imports.test.ts` or equivalent in `apps/api`
    - **EXPECTED OUTCOME**: Test PASSES (legitimate transactions now flagged as 'possible' not 'confirmed')
    - Verify duplicateType='possible' for transactions without rawRef
    - Verify autoSkip=false for 'possible' duplicates
    - Verify duplicateType='confirmed' for transactions with matching rawRef
    - Verify duplicateReason contains appropriate text
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 4.3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - True Duplicate Detection
    - **IMPORTANT**: Re-run the SAME tests from task 4.2 - do NOT write new tests
    - Run preservation property tests from step 4.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all true duplicate scenarios still work:
      - Transactions with unique rawRef import without warnings
      - Exact duplicates flagged correctly
      - Cross-import database duplicate detection works
      - Data integrity protection maintained
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4.4 Checkpoint - Verify all Bug 4 tests pass
  - Run full test suite in `apps/api`
  - Ensure original 93 tests still pass
  - Ensure new Bug 4 tests pass (exploration + preservation)
  - Verify false positive reduction while maintaining true duplicate detection

---

## Bug 5: Unsafe Category Type Casting (LOW Severity)

### Exploration Phase

- [ ] 5.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Type Safety Bypass with 'as any'
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples demonstrating 'as any' bypasses type safety
  - **File**: `apps/api/src/routes/transactions.test.ts` (create if not exists)
  - **Test Implementation**:
    - Test invalid category handling from Bug Condition specification
    - Test Case 1: Invalid category string - attempt POST with category="invalid_category"
    - Test Case 2: Empty category - attempt POST with category=""
    - Test Case 3: Null category - attempt POST with category=null
    - Assert expected behavior: should reject with error "Invalid category: {value}"
    - Note: This may require mocking or bypassing Zod validation to demonstrate the type safety gap
    - Test should verify that route handler validates category before passing to service
  - Run test on UNFIXED code in `apps/api/src/routes/transactions.ts`
  - **EXPECTED OUTCOME**: Test FAILS ('as any' allows invalid categories to pass type checking)
  - Document counterexamples found:
    - Record whether TypeScript catches invalid categories at compile time (it won't due to 'as any')
    - Note whether runtime behavior depends on Zod schema alignment
    - Confirm 'as any' assertion bypasses type safety
  - Mark task complete when test is written, run, and failure is documented
  - _Bug_Condition: isBugCondition(input) where useTypeAssertion=true AND category is invalid_
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### Preservation Phase

- [ ] 5.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Valid Category Transaction Creation
  - **IMPORTANT**: Follow observation-first methodology
  - **File**: `apps/api/src/routes/transactions.test.ts`
  - **Test Implementation**:
    - Observe behavior on UNFIXED code for non-buggy inputs (valid CategoryKey values)
    - Test all valid CategoryKey values from shared package:
      - 'uncategorized', 'business_income', 'business_expense', 'inventory_purchase', 'inventory_sale',
      - 'personal_drawing', 'loan_principal_repayment', 'loan_interest_payment', 'tax_payment',
      - 'equipment_purchase', 'rent', 'utilities', 'marketing', 'staff_wages', 'transport'
    - For each valid category → observe successful transaction creation
    - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
      - All valid CategoryKey values create transactions successfully
      - Category stored correctly in database
      - Category retrieval returns proper type information
      - Category filtering and grouping operations work
    - Use property-based testing iterating over all valid categories
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Preservation: Valid category values must continue to create transactions successfully_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

### Implementation Phase

- [ ] 5.3 Fix unsafe category type casting

  - [ ] 5.3.1 Add type guard function for CategoryKey validation
    - **File**: `apps/api/src/routes/transactions.ts`
    - **Location**: Module level (before route handlers) or import from shared package
    - **Changes**:
      ```typescript
      // Type guard function
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
    - Alternative: Check if CategoryKey enum/type is available in shared package and import validation logic
    - _Requirements: 2.1, 2.2_

  - [ ] 5.3.2 Add runtime category validation in POST handler
    - **File**: `apps/api/src/routes/transactions.ts`
    - **Function**: POST `/` route handler
    - **Location**: ~lines 96-103 (after Zod validation, before service call)
    - **Changes**:
      ```typescript
      const validated = manualTransactionSchema.parse(req.body);
      
      // Add type-safe category validation
      if (!isValidCategory(validated.category)) {
        res.status(400).json({ error: `Invalid category: ${validated.category}` });
        return;
      }
      
      const created = TransactionService.create(businessId, {
        ...validated,
        category: validated.category  // Remove 'as any' assertion
      });
      ```
    - Remove 'as any' type assertion
    - Let TypeScript verify type safety with proper type guard
    - _Bug_Condition: isBugCondition(input) where category is invalid_
    - _Expected_Behavior: Validate category with type guard, reject invalid values_
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 5.3.3 Verify Zod schema alignment with CategoryKey type
    - **File**: Check `@cashflow-mate/shared` package schema definitions
    - **Goal**: Ensure manualTransactionSchema.category output type matches CategoryKey
    - If misalignment exists, update Zod schema to match CategoryKey exactly
    - This ensures type safety from validation through to service layer
    - _Requirements: 2.4_

  - [ ] 5.3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Type-Safe Category Validation
    - **IMPORTANT**: Re-run the SAME test from task 5.1 - do NOT write a new test
    - The test from task 5.1 encodes the expected behavior (invalid categories rejected)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run: `npm test transactions.test.ts` or equivalent in `apps/api`
    - **EXPECTED OUTCOME**: Test PASSES (invalid categories now rejected)
    - Verify error message matches: "Invalid category: {value}"
    - Verify type guard correctly identifies valid vs invalid categories
    - Verify no 'as any' assertions remain in code
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 5.3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid Category Transaction Creation
    - **IMPORTANT**: Re-run the SAME tests from task 5.2 - do NOT write new tests
    - Run preservation property tests from step 5.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all valid category scenarios still work:
      - All 15 CategoryKey values create transactions successfully
      - Categories stored correctly in database
      - Category retrieval and type information correct
      - Category filtering and grouping work
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5.4 Checkpoint - Verify all Bug 5 tests pass
  - Run full test suite in `apps/api`
  - Ensure original 93 tests still pass
  - Ensure new Bug 5 tests pass (exploration + preservation)
  - Verify TypeScript compilation succeeds without type assertions
  - Verify type safety enforced from validation through service layer

---

## Bug 6: Unhandled Promise Rejections (LOW Severity)

### Exploration Phase

- [ ] 6.1 Write bug condition exploration test
  - **Property 1: Bug Condition** - Unhandled Promise Rejection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples demonstrating promise rejections cause undefined state
  - **File**: Mobile app test file for modal component (location depends on mobile app structure)
  - **Note**: This bug is in the mobile app (`my-app/app/modal.tsx`), not the API. Test location may differ.
  - **Test Implementation**:
    - Mock service failures from Bug Condition specification:
      - Mock MobileSecurityService.getSecuritySettings() to reject with error
      - Mock MobileLicenseService.getActiveLicense() to reject with error
    - Assert expected behavior:
      - Errors should be caught and logged
      - Fallback state should be set (security settings with defaults, trial license)
      - UI should not crash or show undefined data
    - Test on UNFIXED code to observe unhandled rejections
  - Run test on UNFIXED code in `my-app/app/modal.tsx`
  - **EXPECTED OUTCOME**: Test FAILS (unhandled rejections, state remains undefined)
  - Document counterexamples found:
    - Record unhandled promise rejection warnings in console
    - Note whether state variables remain undefined
    - Confirm no error handlers exist for these promises
  - Mark task complete when test is written, run, and failure is documented
  - _Bug_Condition: isBugCondition(input) where promise rejects AND no .catch() handler_
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

### Preservation Phase

- [ ] 6.2 Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Successful Promise Resolution
  - **IMPORTANT**: Follow observation-first methodology
  - **File**: Mobile app test file for modal component
  - **Test Implementation**:
    - Observe behavior on UNFIXED code for non-buggy inputs (successful promise resolution)
    - Mock successful responses:
      - MobileSecurityService.getSecuritySettings() resolves with valid security settings
      - MobileLicenseService.getActiveLicense() resolves with valid license
      - MobileStorageService.getBusiness() resolves with valid business
      - MobileAuthService.getSession() resolves with valid session
    - For each successful promise → observe correct state update
    - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
      - Security settings update state correctly
      - License information updates state correctly
      - All state updates happen as expected
      - UI displays loaded data accurately
    - Use property-based testing with various valid response data
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Preservation: Successful promise resolution must continue to update state correctly_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

### Implementation Phase

- [ ] 6.3 Fix unhandled promise rejections

  - [ ] 6.3.1 Add error handlers to promise chains in useEffect
    - **File**: `my-app/app/modal.tsx`
    - **Function**: `useEffect()` hook in ModalScreen component
    - **Location**: ~lines 77-97
    - **Changes**:
      ```typescript
      useEffect(() => {
        // Add .catch() handlers to all promises
        
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
        
        // Apply similar pattern to other promises in useEffect
        MobileExchangeService.getRates()
          .then(setRates)
          .catch((error) => {
            console.error('Failed to load exchange rates:', error);
            setRates([]);
          });
        
        MobileSyncService.getSyncStatus()
          .then(setSyncStatus)
          .catch((error) => {
            console.error('Failed to load sync status:', error);
            setSyncStatus(null);
          });
      }, []);
      ```
    - Each promise chain now has .catch() handler
    - Errors logged to console for debugging
    - Fallback state values prevent undefined behavior
    - _Bug_Condition: isBugCondition(input) where promise rejects_
    - _Expected_Behavior: Catch all rejections, log errors, set fallback state_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 6.3.2 (Optional) Add user-visible error indicator
    - **File**: `my-app/app/modal.tsx`
    - **Enhancement**: Display non-intrusive toast or banner when critical settings fail to load
    - **Implementation**: Track error states and show user-friendly message
    - Example: "Some settings could not be loaded. Using default values."
    - This is optional enhancement beyond the core fix
    - _Requirements: 2.5 (optional)_

  - [ ] 6.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Promise Rejection Handling
    - **IMPORTANT**: Re-run the SAME test from task 6.1 - do NOT write a new test
    - The test from task 6.1 encodes the expected behavior (rejections handled gracefully)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run mobile app tests
    - **EXPECTED OUTCOME**: Test PASSES (promise rejections now caught and handled)
    - Verify console.error called with appropriate messages
    - Verify fallback state values set correctly
    - Verify no unhandled promise rejection warnings
    - Verify UI renders correctly with fallback data
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 6.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Successful Promise Resolution
    - **IMPORTANT**: Re-run the SAME tests from task 6.2 - do NOT write new tests
    - Run preservation property tests from step 6.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all successful promise scenarios still work:
      - Security settings load and update state correctly
      - License information loads and updates state correctly
      - All other promises resolve and update state correctly
      - UI displays loaded data accurately
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 6.4 Checkpoint - Verify all Bug 6 tests pass
  - Run mobile app test suite
  - Ensure new Bug 6 tests pass (exploration + preservation)
  - Verify no unhandled promise rejection warnings in console
  - Verify UI renders correctly with both successful loads and error fallbacks

---

## Final Integration and Validation

- [ ] 7.1 Run full test suite across all apps
  - **API Tests**: Run `npm test` in `apps/api`
  - **Web Tests**: Run `npm test` in `apps/web` (if applicable)
  - **Mobile Tests**: Run mobile app tests
  - **CRITICAL**: All original 93 tests MUST still pass
  - All new bugfix tests (exploration + preservation) MUST pass
  - Target: 93+ tests passing (original + new tests for 6 bugs)

- [ ] 7.2 Verify deterministic financial arithmetic preserved
  - Confirm all monetary calculations use roundCurrency() from @cashflow-mate/shared
  - Test floating-point edge cases in debt payments and transactions
  - Verify no new arithmetic precision issues introduced
  - Confirm financial totals remain accurate

- [ ] 7.3 Manual testing of critical paths
  - **Debt Payments**: Manually test overpayment rejection and valid payment acceptance
  - **CSV Import**: Manually test ambiguous date flagging and duplicate classification
  - **Transaction Creation**: Manually test amount validation at service layer
  - **Category Selection**: Manually test valid category handling without type assertions
  - **Mobile Settings**: Manually test settings load with network failures

- [ ] 7.4 Documentation and cleanup
  - Update API documentation if error messages changed
  - Document new ImportPreviewRow fields for frontend integration
  - Document date format selection UI requirements for Bug 2 full fix
  - Clean up any debug console.log statements
  - Ensure code comments explain validation logic

- [ ] 7.5 Final checkpoint
  - All 6 bugs fixed and validated
  - All exploration tests demonstrate bugs were real (initial failures documented)
  - All preservation tests pass (no regressions)
  - All bugfix tests pass (expected behavior achieved)
  - Original 93-test suite maintained
  - Deterministic arithmetic preserved
  - Ready for code review and deployment
