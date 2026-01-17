# Project State: Postgres to TypeScript

## Project Reference

**Core Value:** Given a Postgres connection, output Zod schemas + TypeScript types that accurately represent the database schema including relations.

**Current Focus:** Phase 3 in progress - Type Mapping + Output

## Current Position

**Milestone:** v1 - Core CLI Tool
**Phase:** 3 of 3 (Type Mapping + Output)
**Plan:** 2 of ? complete
**Status:** In progress
**Last activity:** 2026-01-17 - Completed 03-02-PLAN.md

**Progress:**
```
Phase 1: [##########] Foundation + CLI (2/2 plans, 100%)
Phase 2: [##########] Schema Introspection (1/1 plans, 100%)
Phase 3: [####......] Type Mapping + Output (2/? plans)

Overall: [#####...............] ~25% (5 plans complete)
```

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans Completed | 5 |
| Plans Failed | 0 |
| Requirements Done | 21/23 (CLI-01-04, INTRO-01-05, TYPE-01-05, OUT-01-08) |
| Session Count | 6 |

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
| z.lazy() for relations | Handles circular references safely in belongs-to and has-many | 2026-01-17 |
| Derive belongs-to from FK | user_id column becomes user property (removes _id suffix) | 2026-01-17 |
| Has-many uses table name | If posts references users, users gets posts array | 2026-01-17 |
| Topological table sorting | Order tables so referenced appear before referencing | 2026-01-17 |

### Learnings

- Commander's `requiredOption` provides built-in validation for mandatory flags
- pg error codes can be checked via `(error as any).code` for ECONNREFUSED, ENOTFOUND
- information_schema.columns gives udt_name for precise Postgres type names
- pg_constraint contype='p' for primary keys, contype='f' for foreign keys
- Postgres arrays can be `text[]` (SQL) or `_text` (internal) notation
- Self-test pattern with `import.meta.url === file://${process.argv[1]}` works for ESM
- z.lazy() enables forward references in generated Zod schemas
- Relation direction can be derived from FK direction (A->B means A belongs-to B, B has-many A)

### TODOs

- [x] Plan Phase 1: Foundation + CLI
- [x] Set up project structure (TypeScript, dependencies)
- [x] Implement CLI argument parsing
- [x] Implement database connection (Plan 02)
- [x] Implement schema introspection (Plan 02-01)
- [x] Implement type mapping utilities (Plan 03-01)
- [x] Implement schema generation (Plan 03-02)
- [ ] Integrate into CLI and output to file

### Blockers

(None)

## Session Continuity

### Last Session

**Date:** 2026-01-17
**Accomplishment:** Completed Plan 03-02: Zod schema code generator with relation detection
**Stopped At:** Plan 03-02 complete
**Next Action:** Plan 03-03 - CLI integration and file output

### Resume Context

Phase 3 Plan 02 complete. Tool can now:
- Parse command line arguments (--connection-string, --db, --output)
- Connect to PostgreSQL database using pg Pool
- Introspect database schema with introspectDatabase()
- Map Postgres types to Zod types with mapPostgresTypeToZod()
- Map enums to Zod enums with mapEnumToZod()
- Transform names with toPascalCase() and toCamelCase()
- Generate complete Zod schema code with generateSchemas()
- Detect belongs-to and has-many relations from foreign keys
- Handle circular references via z.lazy()

Key files:
- `src/db.ts` - DatabaseConnection interface, connectToDatabase, disconnectFromDatabase
- `src/cli.ts` - CLI entry point with argument parsing
- `src/introspect/types.ts` - ColumnSchema, ForeignKeySchema, TableSchema, DatabaseSchema
- `src/introspect/introspect.ts` - introspectDatabase() function with SQL queries
- `src/introspect/index.ts` - Barrel export
- `src/generator/name-utils.ts` - toPascalCase, toCamelCase
- `src/generator/type-mapper.ts` - mapPostgresTypeToZod, mapEnumToZod, getZodTypeMapping
- `src/generator/schema-generator.ts` - generateSchemas() with relation detection
- `src/generator/index.ts` - Barrel export

Commits this session: 0f56c5f (schema-generator interfaces), 052cdd7 (generateSchemas implementation)

---
*State initialized: 2026-01-17*
*Last updated: 2026-01-17*
