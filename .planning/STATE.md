# Project State: Postgres to TypeScript

## Project Reference

**Core Value:** Given a Postgres connection, output Zod schemas + TypeScript types that accurately represent the database schema including relations.

**Current Focus:** Phase 3 in progress - Type Mapping + Output

## Current Position

**Milestone:** v1 - Core CLI Tool
**Phase:** 3 of 3 (Type Mapping + Output)
**Plan:** 1 of ? complete
**Status:** In progress
**Last activity:** 2026-01-17 - Completed 03-01-PLAN.md

**Progress:**
```
Phase 1: [##########] Foundation + CLI (2/2 plans, 100%)
Phase 2: [##########] Schema Introspection (1/1 plans, 100%)
Phase 3: [##........] Type Mapping + Output (1/? plans)

Overall: [####................] ~20% (4 plans complete)
```

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 4 |
| Plans Failed | 0 |
| Requirements Done | 16/23 (CLI-01-04, INTRO-01-05, TYPE-01-05, OUT-03, OUT-05) |
| Session Count | 5 |

## Accumulated Context

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| 3-phase structure | Natural data flow: CLI -> Introspection -> Generation | 2026-01-17 |
| Zod for output | Provides runtime validation + TypeScript type inference | 2026-01-17 |
| Direct SQL for introspection | Simpler than Prisma, no additional dependency needed | 2026-01-17 |
| ESM with NodeNext | Modern Node.js compatibility, native ES modules | 2026-01-17 |
| Commander for CLI | Mature, TypeScript-friendly, requiredOption support | 2026-01-17 |
| pg Pool for connection | Industry standard, handles connection pooling | 2026-01-17 |
| Specific error messages | ECONNREFUSED, ENOTFOUND, auth - helps user diagnose | 2026-01-17 |
| udt_name for types | Precise Postgres types (int4, _text) vs generic (integer, ARRAY) | 2026-01-17 |
| z.coerce.date() for timestamps | Handles both string and Date inputs flexibly | 2026-01-17 |
| z.bigint() for bigint/int8 | JavaScript bigint for large integers | 2026-01-17 |
| z.unknown() fallback | Safe fallback for JSON types and unrecognized Postgres types | 2026-01-17 |
| .nullable().optional() chain | Standard Zod pattern for nullable database columns | 2026-01-17 |

### Learnings

- Commander's `requiredOption` provides built-in validation for mandatory flags
- pg error codes can be checked via `(error as any).code` for ECONNREFUSED, ENOTFOUND
- information_schema.columns gives udt_name for precise Postgres type names
- pg_constraint contype='p' for primary keys, contype='f' for foreign keys
- Postgres arrays can be `text[]` (SQL) or `_text` (internal) notation
- Self-test pattern with `import.meta.url === file://${process.argv[1]}` works for ESM

### TODOs

- [x] Plan Phase 1: Foundation + CLI
- [x] Set up project structure (TypeScript, dependencies)
- [x] Implement CLI argument parsing
- [x] Implement database connection (Plan 02)
- [x] Implement schema introspection (Plan 02-01)
- [x] Implement type mapping utilities (Plan 03-01)
- [ ] Implement schema generation (Plan 03-02)
- [ ] Integrate into CLI and output to file

### Blockers

(None)

## Session Continuity

### Last Session

**Date:** 2026-01-17
**Accomplishment:** Completed Plan 03-01: Type mapping and name transformation utilities
**Stopped At:** Plan 03-01 complete
**Next Action:** Plan 03-02 - Schema generation using type mapping

### Resume Context

Phase 3 Plan 01 complete. Tool can now:
- Parse command line arguments (--connection-string, --db, --output)
- Connect to PostgreSQL database using pg Pool
- Introspect database schema with introspectDatabase()
- Map Postgres types to Zod types with mapPostgresTypeToZod()
- Map enums to Zod enums with mapEnumToZod()
- Transform names with toPascalCase() and toCamelCase()

Key files:
- `src/db.ts` - DatabaseConnection interface, connectToDatabase, disconnectFromDatabase
- `src/cli.ts` - CLI entry point with argument parsing
- `src/introspect/types.ts` - ColumnSchema, ForeignKeySchema, TableSchema, DatabaseSchema
- `src/introspect/introspect.ts` - introspectDatabase() function with SQL queries
- `src/introspect/index.ts` - Barrel export
- `src/generator/name-utils.ts` - toPascalCase, toCamelCase
- `src/generator/type-mapper.ts` - mapPostgresTypeToZod, mapEnumToZod, getZodTypeMapping
- `src/generator/index.ts` - Barrel export

Commits this session: 9cc54cc (name-utils), 0e3876d (type-mapper), 3a30eef (generator index)

---
*State initialized: 2026-01-17*
*Last updated: 2026-01-17*
