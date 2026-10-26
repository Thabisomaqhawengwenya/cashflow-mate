# CashFlow Mate — Security & Privacy Architecture

## 1. Authentication & Tenant Authorization
- **Password Security**: Passwords hashed with `bcryptjs` (salt rounds = 10). Plaintext passwords are never logged, stored, or transmitted in responses.
- **JWT Authorization**: Authenticated API routes verify JSON Web Tokens bearing `userId` and `businessId`.
- **Tenant Isolation**: Every database query explicitly qualifies rows by `business_id`. Cross-tenant data access is strictly rejected at the SQL and service layer.
- **Client-Side Secrets Protection**: No secret API keys (e.g. `GEMINI_API_KEY`, database admin tokens) are ever sent or exposed to the client bundle.

## 2. File Upload & Processing Security
- **File Constraints**: Only CSV files (`text/csv`, `text/plain`, `.csv`) up to a maximum size of 5MB are accepted.
- **In-Memory Streaming / Safe Temp Handling**: Uploads are processed with deterministic parsers that reject path traversal, shell commands, or executable payloads.
- **File Sanitization**: Malformed CSV lines, invalid date formats, and unexpected numeric types are safely trapped and routed to the import review summary rather than crashing the worker.

## 3. Responsible AI Data Minimization
- **Strict Data Minimization**: When requesting AI categorization or explanations, only sanitized descriptions and monetary totals are passed. Phone numbers, customer identities, and personal notes are scrubbed.
- **Zero Hallucination Grounding**: The AI is never given raw SQL access or execution privileges. Financial facts are strictly pre-calculated deterministically by the Node.js calculation engine and passed as verified immutable context.
- **Schema Validation**: Every response returned by the LLM is validated against Zod schemas; malformed, unexpected, or injected responses fall back to deterministic heuristics.

## 4. Privacy & Data Ownership
- **User Control**: Users can inspect, correct, export (CSV), and permanently delete their transactions and business profiles at any time.
- **Audit Trails**: Major mutations (transaction updates, imports, batch deletions) record timestamps and status changes.
