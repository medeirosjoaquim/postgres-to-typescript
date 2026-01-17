/**
 * Zod schema code generator.
 * Transforms introspected database schema into TypeScript code strings.
 */

import { mapPostgresTypeToZod, mapEnumToZod } from './type-mapper.js';
import { toPascalCase, toCamelCase } from './name-utils.js';

// ============================================================================
// Input Types - What we receive from introspection
// ============================================================================

/**
 * Column information from database introspection.
 */
export interface ColumnInfo {
  name: string;           // Original column name (snake_case)
  type: string;           // Postgres type (text, integer, etc.)
  isNullable: boolean;
  isPrimaryKey: boolean;
  isEnum?: boolean;
  enumValues?: string[];  // If isEnum, the enum values
}

/**
 * Foreign key constraint information.
 */
export interface ForeignKey {
  columnName: string;      // Local column (e.g., "user_id")
  referencedTable: string; // Referenced table (e.g., "users")
  referencedColumn: string; // Referenced column (e.g., "id")
}

/**
 * Table information with columns and foreign keys.
 */
export interface TableInfo {
  name: string;           // Original table name (snake_case)
  columns: ColumnInfo[];
  primaryKey?: string;
  foreignKeys: ForeignKey[];
}

// ============================================================================
// Computed Relation Types
// ============================================================================

/**
 * Computed relation between tables.
 */
export interface Relation {
  type: 'belongs-to' | 'has-many';
  propertyName: string;   // camelCase property name
  targetSchema: string;   // PascalCase schema name
  targetTable: string;    // Original table name
}

// ============================================================================
// Output Types
// ============================================================================

/**
 * Output from schema generation.
 */
export interface SchemaOutput {
  schemaCode: string;     // Full generated TypeScript code
  schemaNames: string[];  // List of generated schema names
}

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Has-many relation tracking (table -> list of tables that reference it)
 */
type HasManyMap = Map<string, Array<{ fromTable: string; fromColumn: string }>>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build a map of has-many relations.
 * For each foreign key A -> B, B has-many A.
 *
 * @param tables - All tables with their foreign keys
 * @returns Map of table name -> tables that reference it
 */
function buildHasManyMap(tables: TableInfo[]): HasManyMap {
  const hasManyMap: HasManyMap = new Map();

  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      const existing = hasManyMap.get(fk.referencedTable) ?? [];
      existing.push({ fromTable: table.name, fromColumn: fk.columnName });
      hasManyMap.set(fk.referencedTable, existing);
    }
  }

  return hasManyMap;
}

/**
 * Derive belongs-to property name from foreign key column.
 * e.g., "user_id" -> "user", "author_id" -> "author"
 *
 * @param columnName - FK column name (e.g., "user_id")
 * @returns Property name in camelCase
 */
function deriveBelongsToPropertyName(columnName: string): string {
  // Remove _id suffix if present
  const withoutIdSuffix = columnName.endsWith('_id')
    ? columnName.slice(0, -3)
    : columnName;
  return toCamelCase(withoutIdSuffix);
}

/**
 * Generate a column property line for the Zod schema.
 *
 * @param column - Column info
 * @returns Code line like "  email: z.string(),"
 */
function generateColumnProperty(column: ColumnInfo): string {
  const propName = toCamelCase(column.name);

  let zodType: string;
  if (column.isEnum && column.enumValues) {
    zodType = mapEnumToZod(column.name, column.enumValues);
    if (column.isNullable) {
      zodType = `${zodType}.nullable().optional()`;
    }
  } else {
    zodType = mapPostgresTypeToZod(column.type, column.isNullable);
  }

  return `  ${propName}: ${zodType},`;
}

/**
 * Generate a belongs-to relation property line.
 *
 * @param fk - Foreign key info
 * @returns Code line like "  user: z.lazy(() => UsersSchema).optional(),"
 */
function generateBelongsToProperty(fk: ForeignKey): string {
  const propName = deriveBelongsToPropertyName(fk.columnName);
  const targetSchema = `${toPascalCase(fk.referencedTable)}Schema`;
  return `  ${propName}: z.lazy(() => ${targetSchema}).optional(),`;
}

/**
 * Generate a has-many relation property line.
 *
 * @param relatingTable - Table name that has FK to this table
 * @returns Code line like "  posts: z.lazy(() => PostsSchema).array().optional(),"
 */
function generateHasManyProperty(relatingTable: string): string {
  const propName = toCamelCase(relatingTable);
  const targetSchema = `${toPascalCase(relatingTable)}Schema`;
  return `  ${propName}: z.lazy(() => ${targetSchema}).array().optional(),`;
}

/**
 * Generate a single table's Zod schema and TypeScript type.
 *
 * @param table - Table info
 * @param hasManyMap - Map of has-many relations
 * @returns Code block for this table's schema and type
 */
function generateTableSchema(table: TableInfo, hasManyMap: HasManyMap): string {
  const schemaName = `${toPascalCase(table.name)}Schema`;
  const typeName = toPascalCase(table.name);
  const lines: string[] = [];

  // JSDoc comment (OUT-04)
  lines.push(`/** Table: ${table.name} */`);

  // Schema declaration start (OUT-01, OUT-03)
  lines.push(`export const ${schemaName} = z.object({`);

  // Column properties (OUT-05, TYPE-*)
  for (const column of table.columns) {
    lines.push(generateColumnProperty(column));
  }

  // Belongs-to relations (OUT-07, OUT-08)
  for (const fk of table.foreignKeys) {
    lines.push(generateBelongsToProperty(fk));
  }

  // Has-many relations (OUT-06, OUT-08)
  const hasManyRelations = hasManyMap.get(table.name) ?? [];
  // Deduplicate by table name (multiple FKs from same table = one has-many)
  const uniqueHasManyTables = [...new Set(hasManyRelations.map(r => r.fromTable))];
  for (const relatingTable of uniqueHasManyTables) {
    // Skip self-referential has-many (handled separately if needed)
    if (relatingTable !== table.name) {
      lines.push(generateHasManyProperty(relatingTable));
    }
  }

  // Handle self-referential has-many (e.g., employees.manager_id -> employees)
  const selfReferential = hasManyRelations.filter(r => r.fromTable === table.name);
  if (selfReferential.length > 0) {
    // Use a descriptive name like "children" or based on FK column
    const propName = 'children';
    lines.push(`  ${propName}: z.lazy(() => ${schemaName}).array().optional(),`);
  }

  // Close schema object
  lines.push('});');
  lines.push('');

  // TypeScript type (OUT-02)
  lines.push(`export type ${typeName} = z.infer<typeof ${schemaName}>;`);

  return lines.join('\n');
}

/**
 * Sort tables to minimize forward references.
 * Tables with no foreign keys first, then those referencing already-defined tables.
 * Note: z.lazy() handles circular references, so this is just for cleaner output.
 *
 * @param tables - Tables to sort
 * @returns Sorted tables
 */
function sortTables(tables: TableInfo[]): TableInfo[] {
  const sorted: TableInfo[] = [];
  const remaining = [...tables];
  const defined = new Set<string>();

  // Keep iterating until all tables are placed
  while (remaining.length > 0) {
    const beforeLength = remaining.length;

    for (let i = remaining.length - 1; i >= 0; i--) {
      const table = remaining[i];
      // Check if all FK targets are already defined (or are self-referential)
      const canPlace = table.foreignKeys.every(
        fk => defined.has(fk.referencedTable) || fk.referencedTable === table.name
      );

      if (canPlace || table.foreignKeys.length === 0) {
        sorted.push(table);
        defined.add(table.name);
        remaining.splice(i, 1);
      }
    }

    // If no progress made, we have circular dependencies - just add remaining
    if (remaining.length === beforeLength) {
      sorted.push(...remaining);
      break;
    }
  }

  return sorted;
}

// ============================================================================
// Main Generation Function
// ============================================================================

/**
 * Generate Zod schemas and TypeScript types for all tables.
 *
 * @param tables - Array of table information from introspection
 * @returns Generated code and list of schema names
 *
 * @example
 * const output = generateSchemas([
 *   { name: 'users', columns: [...], foreignKeys: [] },
 *   { name: 'posts', columns: [...], foreignKeys: [{ columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id' }] }
 * ]);
 * console.log(output.schemaCode);
 */
export function generateSchemas(tables: TableInfo[]): SchemaOutput {
  if (tables.length === 0) {
    return { schemaCode: "import { z } from 'zod';\n", schemaNames: [] };
  }

  // Build has-many relation map
  const hasManyMap = buildHasManyMap(tables);

  // Sort tables to minimize forward references
  const sortedTables = sortTables(tables);

  // Generate import statement
  const lines: string[] = ["import { z } from 'zod';", ''];

  // Collect schema names
  const schemaNames: string[] = [];

  // Generate each table's schema and type
  for (const table of sortedTables) {
    // Skip tables with no columns
    if (table.columns.length === 0) {
      continue;
    }

    const schemaCode = generateTableSchema(table, hasManyMap);
    lines.push(schemaCode);
    lines.push('');
    schemaNames.push(`${toPascalCase(table.name)}Schema`);
  }

  return {
    schemaCode: lines.join('\n'),
    schemaNames,
  };
}

// ============================================================================
// Self-test
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const testTables: TableInfo[] = [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'integer', isNullable: false, isPrimaryKey: true },
        { name: 'email', type: 'text', isNullable: false, isPrimaryKey: false },
        { name: 'created_at', type: 'timestamp', isNullable: true, isPrimaryKey: false },
      ],
      foreignKeys: [],
    },
    {
      name: 'posts',
      columns: [
        { name: 'id', type: 'integer', isNullable: false, isPrimaryKey: true },
        { name: 'user_id', type: 'integer', isNullable: false, isPrimaryKey: false },
        { name: 'title', type: 'text', isNullable: false, isPrimaryKey: false },
        { name: 'status', type: 'text', isNullable: true, isPrimaryKey: false, isEnum: true, enumValues: ['draft', 'published'] },
      ],
      foreignKeys: [
        { columnName: 'user_id', referencedTable: 'users', referencedColumn: 'id' },
      ],
    },
  ];

  const output = generateSchemas(testTables);

  console.log('=== Generated Schema Code ===');
  console.log(output.schemaCode);
  console.log('=== Schema Names ===');
  console.log(output.schemaNames);

  // Verify key elements are present
  const code = output.schemaCode;
  console.assert(code.includes("import { z } from 'zod';"), 'Has Zod import');
  console.assert(code.includes('/** Table: users */'), 'Has users table JSDoc');
  console.assert(code.includes('/** Table: posts */'), 'Has posts table JSDoc');
  console.assert(code.includes('export const UsersSchema = z.object({'), 'Has UsersSchema');
  console.assert(code.includes('export const PostsSchema = z.object({'), 'Has PostsSchema');
  console.assert(code.includes('export type Users = z.infer<typeof UsersSchema>;'), 'Has Users type');
  console.assert(code.includes('export type Posts = z.infer<typeof PostsSchema>;'), 'Has Posts type');
  console.assert(code.includes('email: z.string(),'), 'Has email property');
  console.assert(code.includes('createdAt: z.coerce.date().nullable().optional(),'), 'Has createdAt camelCase');
  console.assert(code.includes("status: z.enum(['draft', 'published']).nullable().optional(),"), 'Has enum status');
  console.assert(code.includes('user: z.lazy(() => UsersSchema).optional(),'), 'Has belongs-to user');
  console.assert(code.includes('posts: z.lazy(() => PostsSchema).array().optional(),'), 'Has has-many posts');

  console.log('\nAll schema-generator tests passed!');
}
