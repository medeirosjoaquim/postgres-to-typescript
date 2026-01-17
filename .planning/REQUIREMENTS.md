# Requirements: Postgres to TypeScript

**Defined:** 2026-01-17
**Core Value:** Given a Postgres connection, output Zod schemas + TypeScript types that accurately represent the database schema including relations.

## v1 Requirements

### CLI Interface

- [ ] **CLI-01**: Tool accepts `--connection-string` flag for Postgres URL
- [ ] **CLI-02**: Tool accepts `--db` flag for database name
- [ ] **CLI-03**: Tool accepts `--output` flag for output file path
- [ ] **CLI-04**: Tool shows help/usage text when run with `--help` or invalid args

### Database Introspection

- [ ] **INTRO-01**: Tool connects to Postgres using provided connection string
- [ ] **INTRO-02**: Tool retrieves list of all tables in the specified database
- [ ] **INTRO-03**: Tool retrieves columns for each table (name, type, nullable)
- [ ] **INTRO-04**: Tool detects primary keys for each table
- [ ] **INTRO-05**: Tool detects foreign key relationships between tables

### Type Mapping

- [ ] **TYPE-01**: Tool maps common Postgres types (text, varchar, int, bigint, boolean, timestamp, date) to Zod types
- [ ] **TYPE-02**: Tool maps JSON/JSONB columns to appropriate Zod type
- [ ] **TYPE-03**: Tool maps Postgres array columns (e.g., text[]) to Zod arrays
- [ ] **TYPE-04**: Tool maps custom Postgres enums to Zod enums
- [ ] **TYPE-05**: Tool handles nullable columns as `.nullable().optional()`

### Output Generation

- [ ] **OUT-01**: Tool generates Zod schema for each table
- [ ] **OUT-02**: Tool generates TypeScript type via `z.infer<typeof Schema>`
- [ ] **OUT-03**: Schema names are PascalCase (e.g., `UserPost` from `user_posts`)
- [ ] **OUT-04**: Each schema has JSDoc comment with original table name
- [ ] **OUT-05**: Property names are camelCase (e.g., `createdAt` from `created_at`)
- [ ] **OUT-06**: Has-many relations represented as `z.lazy(() => Schema).array().optional()`
- [ ] **OUT-07**: Belongs-to relations represented as `z.lazy(() => Schema).optional()`
- [ ] **OUT-08**: Circular references handled correctly with `z.lazy()`
- [ ] **OUT-09**: Tool writes output to specified file path

## v2 Requirements

### Enhanced Features

- **FEAT-01**: Watch mode to auto-regenerate when schema changes
- **FEAT-02**: Config file support (.pg-to-ts.json) for default options
- **FEAT-03**: Table filtering (include/exclude patterns)
- **FEAT-04**: Custom type mapping overrides

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web API / HTTP server | CLI-only tool |
| Schema migrations | Read-only introspection, not a migration tool |
| Other databases (MySQL, SQLite) | Postgres-only for v1 |
| Prisma schema generation | We generate Zod/TS, not Prisma schemas |
| Build pipeline integration | Manual invocation only for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | Phase 1 | Pending |
| CLI-02 | Phase 1 | Pending |
| CLI-03 | Phase 1 | Pending |
| CLI-04 | Phase 1 | Pending |
| INTRO-01 | Phase 1 | Pending |
| INTRO-02 | Phase 2 | Pending |
| INTRO-03 | Phase 2 | Pending |
| INTRO-04 | Phase 2 | Pending |
| INTRO-05 | Phase 2 | Pending |
| TYPE-01 | Phase 3 | Pending |
| TYPE-02 | Phase 3 | Pending |
| TYPE-03 | Phase 3 | Pending |
| TYPE-04 | Phase 3 | Pending |
| TYPE-05 | Phase 3 | Pending |
| OUT-01 | Phase 3 | Pending |
| OUT-02 | Phase 3 | Pending |
| OUT-03 | Phase 3 | Pending |
| OUT-04 | Phase 3 | Pending |
| OUT-05 | Phase 3 | Pending |
| OUT-06 | Phase 3 | Pending |
| OUT-07 | Phase 3 | Pending |
| OUT-08 | Phase 3 | Pending |
| OUT-09 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-01-17*
*Last updated: 2026-01-17 after roadmap creation - all requirements mapped to phases*
