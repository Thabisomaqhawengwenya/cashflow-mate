# CashFlow Mate — Testing Strategy & Verification Suite

## 1. Test Philosophy & Coverage
CashFlow Mate requires high verification standards, particularly around financial correctness, zero-drift arithmetic, and safe import processing.

| Domain | Scope | Framework | Target Coverage |
| :--- | :--- | :--- | :--- |
| **Financial Engine** | Inflows, outflows, net cash flow, profit estimate, currency segregation, transfer exclusion. | Vitest | 100% logic branches |
| **Import Engine** | Column mapping, date formats (ISO, DD/MM/YYYY, MM/DD/YYYY), decimal formatting, duplicate detection. | Vitest | Key edge cases & malformed files |
| **Security & Auth** | Tenant isolation, bad passwords, unauthorized access attempts, token verification. | Vitest / Supertest | All protected endpoints |
| **UI Components & A11y** | WCAG 2.2 contrast, keyboard focus, screen-reader labels, responsive layout breakpoints. | Vitest + Manual inspection | Material 3 specifications |

## 2. Key Test Cases

### Financial Calculation Suite:
1. `should accurately sum recorded inflows excluding internal transfers`
2. `should exclude owner contributions and loan proceeds from operating revenue`
3. `should accurately sum recorded operating expenses excluding transfers and drawings`
4. `should compute net cash flow = recorded inflows - recorded outflows`
5. `should handle mixed currencies by segregating them without cross-currency contamination`
6. `should correctly calculate period-over-period delta and percentages without division by zero`

### Import Pipeline Suite:
1. `should parse standard CSV format with headers`
2. `should auto-detect and allow manual mapping of EcoCash / InnBucks / Bank CSV styles`
3. `should identify duplicate transactions matching reference, date, amount, and business`
4. `should gracefully report malformed rows without failing the entire import batch`

### Auth & Tenant Isolation Suite:
1. `should prevent User B from reading transactions belonging to User A`
2. `should reject requests with invalid or expired tokens`
