# Requirements: Postgres to TypeScript

**Defined:** 2026-01-17
**Core Value:** Given a Postgres connection, output Zod schemas + TypeScript types that accurately represent the database schema including relations.

## v1 Requirements

### CLI Interface

- [x] **CLI-01**: Tool accepts `--connection-string` flag for Postgres URL
- [x] **CLI-02**: Tool accepts `--db` flag for database name
- [x] **CLI-03**: Tool accepts `--output` flag for output file path
- [x] **CLI-04**: Tool shows help/usage text when run with `--help` or invalid args

### Database Introspection

- [x] **INTRO-01**: Tool connects to Postgres using provided connection string
- [x] **INTRO-02**: Tool retrieves list of all tables in the specified database
- [x] **INTRO-03**: Tool retrieves columns for each table (name, type, nullable)
- [x] **INTRO-04**: Tool detects primary keys for each table
- [x] **INTRO-05**: Tool detects foreign key relationships between tables

### Type Mapping

- [x] **TYPE-01**: Tool maps common Postgres types (text, varchar, int, bigint, boolean, timestamp, date) to Zod types
- [x] **TYPE-02**: Tool maps JSON/JSONB columns to appropriate Zod type
- [x] **TYPE-03**: Tool maps Postgres array columns (e.g., text[]) to Zod arrays
- [x] **TYPE-04**: Tool maps custom Postgres enums to Zod enums
- [x] **TYPE-05**: Tool handles nullable columns as `.nullable().optional()`

### Output Generation

- [x] **OUT-01**: Tool generates Zod schema for each table
- [x] **OUT-02**: Tool generates TypeScript type via `z.infer<typeof Schema>`
- [x] **OUT-03**: Schema names are PascalCase (e.g., `UserPost` from `user_posts`)
- [x] **OUT-04**: Each schema has JSDoc comment with original table name
- [x] **OUT-05**: Property names are camelCase (e.g., `createdAt` from `created_at`)
- [x] **OUT-06**: Has-many relations represented as `z.lazy(() => Schema).array().optional()`
- [x] **OUT-07**: Belongs-to relations represented as `z.lazy(() => Schema).optional()`
- [x] **OUT-08**: Circular references handled correctly with `z.lazy()`
- [x] **OUT-09**: Tool writes output to specified file path

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
| CLI-01 | Phase 1 | Complete |
| CLI-02 | Phase 1 | Complete |
| CLI-03 | Phase 1 | Complete |
| CLI-04 | Phase 1 | Complete |
| INTRO-01 | Phase 1 | Complete |
| INTRO-02 | Phase 2 | Complete |
| INTRO-03 | Phase 2 | Complete |
| INTRO-04 | Phase 2 | Complete |
| INTRO-05 | Phase 2 | Complete |
| TYPE-01 | Phase 3 | Complete |
| TYPE-02 | Phase 3 | Complete |
| TYPE-03 | Phase 3 | Complete |
| TYPE-04 | Phase 3 | Complete |
| TYPE-05 | Phase 3 | Complete |
| OUT-01 | Phase 3 | Complete |
| OUT-02 | Phase 3 | Complete |
| OUT-03 | Phase 3 | Complete |
| OUT-04 | Phase 3 | Complete |
| OUT-05 | Phase 3 | Complete |
| OUT-06 | Phase 3 | Complete |
| OUT-07 | Phase 3 | Complete |
| OUT-08 | Phase 3 | Complete |
| OUT-09 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-01-17*
*Last updated: 2026-01-17 after roadmap creation - all requirements mapped to phases*
