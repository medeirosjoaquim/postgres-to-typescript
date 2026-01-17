# Roadmap: Postgres to TypeScript

**Created:** 2026-01-17
**Depth:** Quick (3-5 phases)
**Core Value:** Given a Postgres connection, output Zod schemas + TypeScript types that accurately represent the database schema including relations.

## Overview

This roadmap delivers the Postgres-to-TypeScript CLI tool in 3 phases: (1) Foundation with CLI and database connection, (2) Schema introspection including tables, columns, and relations, (3) Type mapping and Zod/TypeScript output generation. Each phase delivers a testable capability that builds toward the complete tool.

## Phases

### Phase 1: Foundation + CLI

**Goal:** User can invoke the CLI with connection parameters and connect to a Postgres database.

**Dependencies:** None (starting phase)

**Requirements:**
- CLI-01: Tool accepts `--connection-string` flag for Postgres URL
- CLI-02: Tool accepts `--db` flag for database name
- CLI-03: Tool accepts `--output` flag for output file path
- CLI-04: Tool shows help/usage text when run with `--help` or invalid args
- INTRO-01: Tool connects to Postgres using provided connection string

**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Project setup and CLI argument parsing
- [x] 01-02-PLAN.md — Database connection with error handling

**Success Criteria:**
1. User can run `npx pg-to-ts --help` and see usage documentation
2. User can run `npx pg-to-ts --connection-string <url> --db <name> --output <path>` and tool connects successfully
3. User sees clear error message if connection fails or required args are missing

---

### Phase 2: Schema Introspection

**Goal:** Tool retrieves complete schema information from the database including tables, columns, primary keys, and foreign key relationships.

**Dependencies:** Phase 1 (requires database connection)

**Requirements:**
- INTRO-02: Tool retrieves list of all tables in the specified database
- INTRO-03: Tool retrieves columns for each table (name, type, nullable)
- INTRO-04: Tool detects primary keys for each table
- INTRO-05: Tool detects foreign key relationships between tables

**Plans:** 1 plan

Plans:
- [x] 02-01-PLAN.md — Schema introspection: types, tables, columns, keys, and foreign key relationships

**Success Criteria:**
1. User can connect to a database and tool logs discovered tables
2. Tool correctly identifies all columns with their Postgres types and nullable status
3. Tool correctly identifies foreign key relationships (which table references which)
4. Tool handles edge cases: empty database, tables with no foreign keys

---

### Phase 3: Type Mapping + Output Generation

**Goal:** Tool generates a complete TypeScript file with Zod schemas and inferred types for all tables with proper naming conventions and relation handling.

**Dependencies:** Phase 2 (requires introspected schema data)

**Requirements:**
- TYPE-01: Tool maps common Postgres types (text, varchar, int, bigint, boolean, timestamp, date) to Zod types
- TYPE-02: Tool maps JSON/JSONB columns to appropriate Zod type
- TYPE-03: Tool maps Postgres array columns (e.g., text[]) to Zod arrays
- TYPE-04: Tool maps custom Postgres enums to Zod enums
- TYPE-05: Tool handles nullable columns as `.nullable().optional()`
- OUT-01: Tool generates Zod schema for each table
- OUT-02: Tool generates TypeScript type via `z.infer<typeof Schema>`
- OUT-03: Schema names are PascalCase (e.g., `UserPost` from `user_posts`)
- OUT-04: Each schema has JSDoc comment with original table name
- OUT-05: Property names are camelCase (e.g., `createdAt` from `created_at`)
- OUT-06: Has-many relations represented as `z.lazy(() => Schema).array().optional()`
- OUT-07: Belongs-to relations represented as `z.lazy(() => Schema).optional()`
- OUT-08: Circular references handled correctly with `z.lazy()`
- OUT-09: Tool writes output to specified file path

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md — Type mapper and name transformation utilities
- [ ] 03-02-PLAN.md — Zod schema code generator with relation handling
- [ ] 03-03-PLAN.md — File writer and CLI integration

**Success Criteria:**
1. User runs tool against a database and receives a valid TypeScript file at the specified output path
2. Generated file compiles with `tsc` without errors
3. Generated Zod schemas validate sample data correctly (insert, select rows)
4. Relations between tables are correctly represented with `z.lazy()` for circular refs
5. All naming conventions applied: PascalCase schemas, camelCase properties, JSDoc with original names

---

## Progress

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| 1 - Foundation + CLI | ✓ Complete | 5 | 100% |
| 2 - Schema Introspection | ✓ Complete | 4 | 100% |
| 3 - Type Mapping + Output | Planned | 14 | 0% |

**Total Progress:** 9/23 requirements complete (39%)

---

## Coverage Validation

| Category | Requirements | Phase |
|----------|--------------|-------|
| CLI Interface | CLI-01, CLI-02, CLI-03, CLI-04 | Phase 1 |
| Database Introspection | INTRO-01 | Phase 1 |
| Database Introspection | INTRO-02, INTRO-03, INTRO-04, INTRO-05 | Phase 2 |
| Type Mapping | TYPE-01, TYPE-02, TYPE-03, TYPE-04, TYPE-05 | Phase 3 |
| Output Generation | OUT-01 through OUT-09 | Phase 3 |

**All 23 v1 requirements mapped. No orphans.**

---
*Roadmap created: 2026-01-17*
