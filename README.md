# pg-to-ts

Generate Zod schemas and TypeScript types from PostgreSQL database schemas.

## Overview

`pg-to-ts` is a CLI tool that connects to a PostgreSQL database, introspects its schema, and generates a TypeScript file containing both Zod schemas (for runtime validation) and TypeScript interfaces (for compile-time type safety). This ensures your application types stay synchronized with your database schema.

## Features

- **Complete Database Introspection**: Automatically detects tables, columns, primary keys, and foreign key relationships
- **TypeScript Interfaces**: Generates clean TypeScript interfaces with proper type inference
- **Zod Schemas**: Generates runtime-validatable Zod schemas for input validation and API contracts
- **Relationship Mapping**: Automatically maps `belongs-to` and `has-many` relationships using `z.lazy()` for circular references
- **Naming Convention Conversion**: Converts `snake_case` database names to `camelCase` properties and `PascalCase` type names
- **Comprehensive Type Support**: Maps PostgreSQL types to TypeScript/Zod equivalents including arrays, JSON, timestamps, and enums
- **Circular Reference Handling**: Uses `z.lazy()` to handle self-referential and circular table relationships

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd pg-to-ts

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

## Usage

### Basic Usage

```bash
pg-to-ts \
  --connection-string "postgresql://user:password@localhost:5432" \
  --db my_database \
  --output ./types/database.ts
```

### CLI Options

| Option | Short | Description | Required |
|--------|-------|-------------|----------|
| `--connection-string` | `-c` | PostgreSQL connection URL | Yes |
| `--db` | `-d` | Database name | Yes |
| `--output` | `-o` | Output file path for generated types | Yes |
| `--help` | `-h` | Show help information | No |
| `--version` | `-V` | Show version number | No |

### Example Output

Given a database with `users` and `posts` tables where posts reference users:

```typescript
import { z } from 'zod';

// ============================================================================
// TypeScript Interfaces (for proper type inference with z.lazy)
// ============================================================================

export interface Users {
  id: number;
  email: string;
  createdAt?: Date | null;
  posts?: Posts[];
}

export interface Posts {
  id: number;
  userId: number;
  title: string;
  user?: Users;
}

// ============================================================================
// Zod Schemas
// ============================================================================

/** Table: users */
export const UsersSchema: z.ZodType<Users> = z.object({
  id: z.number().int(),
  email: z.string(),
  createdAt: z.coerce.date().nullable().optional(),
  posts: z.lazy(() => PostsSchema).array().optional(),
});

/** Table: posts */
export const PostsSchema: z.ZodType<Posts> = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  title: z.string(),
  user: z.lazy(() => UsersSchema).optional(),
});
```

## Type Mapping

### PostgreSQL to TypeScript/Zod

| PostgreSQL Type | TypeScript Type | Zod Schema |
|-----------------|-----------------|------------|
| `text`, `varchar`, `char` | `string` | `z.string()` |
| `integer`, `int`, `int4` | `number` | `z.number().int()` |
| `bigint`, `int8` | `bigint` | `z.bigint()` |
| `real`, `float4`, `numeric` | `number` | `z.number()` |
| `boolean`, `bool` | `boolean` | `z.boolean()` |
| `timestamp`, `timestamptz`, `date` | `Date` | `z.coerce.date()` |
| `time`, `timetz` | `string` | `z.string()` |
| `json`, `jsonb` | `unknown` | `z.unknown()` |
| `uuid` | `string` | `z.string()` |
| `bytea` | `Buffer` | `z.instanceof(Buffer)` |
| `text[]`, `integer[]`, etc. | `string[]`, `number[]` | `z.array(z.string())`, etc. |
| Custom enums | union of string literals | `z.enum(['value1', 'value2'])` |

### Nullable Columns

Nullable columns are represented as `.nullable().optional()` in Zod schemas and as `property?: Type | null` in TypeScript interfaces.

## Relationships

### Belongs-To Relationships

When a table has a foreign key column (e.g., `posts.user_id` referencing `users.id`), the tool generates:

- A `user?: Users` property in the TypeScript interface
- A `user: z.lazy(() => UsersSchema).optional()` property in the Zod schema

Property names are derived from the foreign key column name:
- `user_id` becomes `user`
- `author_id` becomes `author`
- `userid` becomes `userRel` (to avoid conflicts)

### Has-Many Relationships

When a table is referenced by another table's foreign key, the tool generates:

- A `posts?: Posts[]` property in the TypeScript interface
- A `posts: z.lazy(() => PostsSchema).array().optional()` property in the Zod schema

### Self-Referential Relationships

Tables that reference themselves (e.g., an `employees` table with `manager_id` referencing `id`) get a `children` property representing the has-many side of the relationship.

### Multiple Foreign Keys to Same Table

When a table has multiple foreign keys referencing the same table (e.g., `created_by_id` and `updated_by_id` both referencing `users`), the tool generates unique property names:
- `createdByUser` for `created_by_id`
- `updatedByUser` for `updated_by_id`

## Architecture

```
src/
├── index.ts              # Entry point and main execution flow
├── cli.ts                # CLI argument parsing with Commander
├── db.ts                 # PostgreSQL connection management
├── introspect/           # Database introspection module
│   ├── index.ts          # Module exports
│   ├── introspect.ts     # SQL queries for schema introspection
│   └── types.ts          # Introspection type definitions
└── generator/            # Code generation module
    ├── index.ts          # Module exports
    ├── schema-generator.ts  # Zod schema and interface generation
    ├── type-mapper.ts    # PostgreSQL to Zod type mapping
    ├── name-utils.ts     # snake_case to camelCase/PascalCase conversion
    └── file-writer.ts    # Output file writing utilities
```

### How It Works

1. **Connection**: Establishes a connection to the PostgreSQL database using the provided connection string
2. **Introspection**: Queries PostgreSQL system catalogs (`information_schema`, `pg_constraint`, etc.) to retrieve:
   - All tables in the public schema
   - Columns with their types, nullability, and defaults
   - Primary key constraints
   - Foreign key relationships
3. **Generation**: Transforms the introspected schema into:
   - TypeScript interfaces with camelCase properties
   - Zod schemas with proper type mappings and relationships
4. **Output**: Writes the generated code to the specified file path

## Development

### Scripts

```bash
# Build the project
pnpm run build

# Run in development mode
pnpm run dev -- --connection-string "..." --db "..." --output "..."

# Run module self-tests
node dist/generator/type-mapper.js
node dist/generator/name-utils.js
node dist/generator/schema-generator.js
```

### Project Structure

- **ES Modules**: Uses ES modules with `.js` extensions in imports
- **TypeScript**: Strict mode enabled with ES2022 target
- **Node.js**: Requires Node.js 18+ for native fetch and other features

## Requirements

- Node.js 18 or higher
- PostgreSQL 12 or higher
- Access to PostgreSQL system catalogs for introspection

## Limitations

- Only introspects tables in the `public` schema
- Does not support views, materialized views, or other database objects
- Custom PostgreSQL types fall back to `string` representation
- Does not generate migration scripts or schema diffs
- No watch mode for automatic regeneration (planned for v2)

## Future Enhancements

Planned features for future versions:

- Watch mode for automatic regeneration when schema changes
- Configuration file support (`.pg-to-ts.json`)
- Table filtering (include/exclude patterns)
- Custom type mapping overrides
- Support for additional schemas beyond `public`
- Enum type introspection from database constraints

## License

ISC

## Contributing

Contributions are welcome. Please ensure your code follows the existing patterns and includes appropriate tests.
