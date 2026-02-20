---
status: testing
milestone: v1
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 02-01-SUMMARY.md, 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md
started: 2026-01-17T16:15:00Z
updated: 2026-01-17T16:15:00Z
---

## Current Test

number: 1
name: CLI Help Text
expected: |
  Run `pnpm build && node dist/index.js --help` and see usage documentation showing:
  - --connection-string option (required)
  - --db option (required)
  - --output option (required)
awaiting: user response

## Tests

### 1. CLI Help Text
expected: Run `pnpm build && node dist/index.js --help` shows usage with --connection-string, --db, --output options
result: [pending]

### 2. Missing Arguments Error
expected: Run `node dist/index.js` with no arguments shows clear error about missing required options
result: [pending]

### 3. Connection Error Handling
expected: Run with invalid connection string (e.g., postgres://localhost:9999/test) shows user-friendly connection error, not a stack trace
result: [pending]

### 4. End-to-End Generation
expected: Run against a real Postgres database with tables and foreign keys, outputs a .ts file with Zod schemas that:
  - Has PascalCase schema names (e.g., UserPost from user_posts)
  - Has camelCase property names (e.g., createdAt from created_at)
  - Has JSDoc comments with original table names
  - Has relation properties using z.lazy()
result: [pending]

### 5. Generated File Compiles
expected: The generated .ts file compiles with `npx tsc --noEmit <output.ts>` without errors (may need --skipLibCheck for zod internals)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0

## Gaps

[none yet]
