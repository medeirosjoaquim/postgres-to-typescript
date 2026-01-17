# Postgres to TypeScript

## What This Is

A CLI tool that connects to a PostgreSQL database, introspects its schema, and generates a TypeScript file containing Zod schemas and inferred types representing all tables, columns, and relations. Run it anytime to "x-ray" your database and get an accurate, type-safe representation.

## Core Value

Given a Postgres connection, output Zod schemas + TypeScript types that accurately represent the database schema including relations.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] CLI accepts `--connection-string`, `--db`, and `--output` flags
- [ ] Connects to PostgreSQL database using connection string
- [ ] Introspects all tables in the specified database
- [ ] Introspects all columns with their types (maps Postgres types to TypeScript/Zod types)
- [ ] Detects foreign key relationships between tables
- [ ] Generates Zod schemas for each table
- [ ] Generates TypeScript types via `z.infer<typeof Schema>`
- [ ] Interface names are PascalCase with JSDoc comment showing original table name
- [ ] Property names are camelCase (converted from snake_case)
- [ ] Nullable columns represented as `.nullable().optional()` in Zod
- [ ] Has-many relations represented as `z.lazy(() => Schema).array().optional()`
- [ ] Belongs-to relations represented as `z.lazy(() => Schema).optional()`
- [ ] Outputs a single TypeScript file at the specified path

### Out of Scope

- Web API / HTTP server — this is CLI-only
- Schema migrations or diffing — read-only introspection
- Support for databases other than PostgreSQL — Postgres only for v1
- Watch mode / auto-regeneration — manual invocation only
- Prisma schema generation — we generate Zod/TS, not Prisma schemas

## Context

- Using Prisma as the introspection layer (can connect to Postgres and read schema)
- Output uses Zod for runtime validation capabilities + TypeScript type inference
- Target users are developers who want to keep application types in sync with database schema
- The tool is invoked manually when schema changes, not as part of a build pipeline

## Constraints

- **Tech stack**: TypeScript, Prisma (for introspection), Zod (for output schemas)
- **Runtime**: Node.js CLI application
- **Output**: Single `.ts` file with Zod schemas and inferred types

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Zod over pure TypeScript interfaces | Provides runtime validation + type inference | — Pending |
| PascalCase interfaces, camelCase properties | TypeScript conventions while preserving DB name in comments | — Pending |
| Prisma for DB introspection | Mature, well-tested Postgres introspection capabilities | — Pending |
| Relations as optional properties | Relations may not always be loaded/included | — Pending |

---
*Last updated: 2026-01-17 after initialization*
