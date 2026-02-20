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
 * Supports composite foreign keys (multiple columns).
 */
export interface ForeignKey {
  columnNames: string[];       // Local columns (e.g., ["user_id"] or ["order_id", "product_id"])
  referencedTable: string;     // Referenced table (e.g., "users")
  referencedColumns: string[]; // Referenced columns (e.g., ["id"] or ["id", "sku"])
}

/**
 * Table information with columns and foreign keys.
 */
export interface TableInfo {
  name: string;           // Original table name (snake_case)
  columns: ColumnInfo[];
  primaryKey: string[];   // All primary key columns (supports composite PKs)
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
 * Now tracks multiple columns for composite FK support.
 */
type HasManyMap = Map<string, Array<{ fromTable: string; fromColumns: string[] }>>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build a map of has-many relations.
 * For each foreign key A -> B, B has-many A.
 * Supports composite foreign keys.
 *
 * @param tables - All tables with their foreign keys
 * @returns Map of table name -> tables that reference it
 */
function buildHasManyMap(tables: TableInfo[]): HasManyMap {
  const hasManyMap: HasManyMap = new Map();

  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      const existing = hasManyMap.get(fk.referencedTable) ?? [];
      existing.push({ fromTable: table.name, fromColumns: fk.columnNames });
      hasManyMap.set(fk.referencedTable, existing);
    }
  }

  return hasManyMap;
}

/**
 * Derive belongs-to property name from foreign key columns.
 * e.g., "user_id" -> "user", "author_id" -> "author", "userid" -> "userRel"
 * For composite keys, uses the referenced table name.
 *
 * @param columnNames - FK column names (e.g., ["user_id"] or ["order_id", "product_id"])
 * @param referencedTable - Referenced table name for fallback naming
 * @returns Property name in camelCase
 */
function deriveBelongsToPropertyName(columnNames: string[], referencedTable: string): string {
  // For composite keys, use the referenced table name directly
  if (columnNames.length > 1) {
    return toCamelCase(referencedTable);
  }

  const columnName = columnNames[0];
  
  // Handle snake_case FK columns: "user_id" -> "user"
  if (columnName.endsWith('_id')) {
    return toCamelCase(columnName.slice(0, -3));
  }

  // Handle camelCase/lowercase FK columns: "userid" -> would conflict with column
  // Use the referenced table name with "Rel" suffix to avoid conflict
  // e.g., "userid" referencing "User" table -> "userRel"
  return toCamelCase(referencedTable) + 'Rel';
}

/**
 * Generate a column property line for the Zod schema.
 *
 * @param column - Column info
 * @param usedNames - Set of already used property names (for duplicate detection)
 * @returns Code line like "  email: z.string(),"
 */
function generateColumnProperty(column: ColumnInfo, usedNames: Set<string>): string {
  const basePropName = toCamelCase(column.name);
  const propName = getUniquePropertyName(basePropName, usedNames);
  usedNames.add(propName);

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
  const propName = deriveBelongsToPropertyName(fk.columnNames, fk.referencedTable);
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
 * Get the TypeScript type string for a Postgres type.
 */
function getTypeScriptType(pgType: string, isNullable: boolean): string {
  const baseType = (() => {
    switch (pgType) {
      case 'int2':
      case 'int4':
      case 'smallint':
      case 'integer':
      case 'float4':
      case 'float8':
      case 'real':
      case 'double precision':
      case 'numeric':
      case 'decimal':
      case 'money':
        return 'number';
      // BigInt types - must match z.bigint()
      case 'int8':
      case 'bigint':
      case 'bigserial':
      case 'serial8':
        return 'bigint';
      case 'bool':
      case 'boolean':
        return 'boolean';
      case 'timestamp':
      case 'timestamptz':
      case 'date':
        return 'Date';
      case 'time':
      case 'timetz':
        return 'string';
      case 'json':
      case 'jsonb':
        return 'unknown';
      case 'bytea':
        return 'Buffer';
      case 'uuid':
      case 'text':
      case 'varchar':
      case 'char':
      case 'bpchar':
      case 'citext':
      default:
        // Handle array types (e.g., _text, _int4)
        if (pgType.startsWith('_')) {
          const innerType = pgType.slice(1);
          return `${getTypeScriptType(innerType, false)}[]`;
        }
        return 'string';
    }
  })();

  return isNullable ? `${baseType} | null` : baseType;
}

/**
 * Generate a unique property name, appending a number if needed.
 */
function getUniquePropertyName(baseName: string, usedNames: Set<string>): string {
  if (!usedNames.has(baseName)) {
    return baseName;
  }
  let counter = 2;
  while (usedNames.has(`${baseName}${counter}`)) {
    counter++;
  }
  return `${baseName}${counter}`;
}

/**
 * Generate a TypeScript interface property line.
 */
function generateInterfaceProperty(column: ColumnInfo, usedNames: Set<string>): string {
  const basePropName = toCamelCase(column.name);
  const propName = getUniquePropertyName(basePropName, usedNames);
  usedNames.add(propName);
  const tsType = getTypeScriptType(column.type, false);
  const optional = column.isNullable ? '?' : '';
  const nullSuffix = column.isNullable ? ' | null' : '';
  return `  ${propName}${optional}: ${tsType}${nullSuffix};`;
}

/**
 * Generate unique belongs-to property names for a table's FKs.
 * Handles multiple FKs to the same table by appending the FK column name.
 * Supports composite foreign keys.
 */
function generateBelongsToPropertyNames(foreignKeys: ForeignKey[]): Map<ForeignKey, string> {
  const result = new Map<ForeignKey, string>();
  const targetTableCounts = new Map<string, number>();

  // Count how many FKs reference each table
  for (const fk of foreignKeys) {
    const count = targetTableCounts.get(fk.referencedTable) ?? 0;
    targetTableCounts.set(fk.referencedTable, count + 1);
  }

  // Generate property names
  for (const fk of foreignKeys) {
    const count = targetTableCounts.get(fk.referencedTable)!;
    
    // For composite keys, always use the table name
    if (fk.columnNames.length > 1) {
      result.set(fk, toCamelCase(fk.referencedTable));
      continue;
    }
    
    const columnName = fk.columnNames[0];
    
    if (count === 1) {
      // Only one FK to this table, use standard naming
      result.set(fk, deriveBelongsToPropertyName(fk.columnNames, fk.referencedTable));
    } else {
      // Multiple FKs to same table, include column name to differentiate
      // e.g., createdbyid -> createdByUser, updatedbyid -> updatedByUser
      const baseName = columnName.endsWith('_id')
        ? columnName.slice(0, -3)
        : columnName.endsWith('id')
          ? columnName.slice(0, -2)
          : columnName;
      result.set(fk, toCamelCase(baseName) + toPascalCase(fk.referencedTable));
    }
  }

  return result;
}

/**
 * Generate a TypeScript interface for a table (before schemas, to enable type annotations).
 */
function generateInterface(table: TableInfo, hasManyMap: HasManyMap): string {
  const typeName = toPascalCase(table.name);
  const lines: string[] = [];
  const usedPropertyNames = new Set<string>();

  lines.push(`export interface ${typeName} {`);

  // Column properties (with duplicate detection)
  for (const column of table.columns) {
    lines.push(generateInterfaceProperty(column, usedPropertyNames));
  }

  // Belongs-to relations (with unique naming)
  const fkPropNames = generateBelongsToPropertyNames(table.foreignKeys);
  for (const fk of table.foreignKeys) {
    let propName = fkPropNames.get(fk)!;
    // Ensure no collision with column names
    if (usedPropertyNames.has(propName)) {
      propName = propName + 'Rel';
    }
    const targetType = toPascalCase(fk.referencedTable);
    lines.push(`  ${propName}?: ${targetType};`);
    usedPropertyNames.add(propName);
  }

  // Has-many relations
  const hasManyRelations = hasManyMap.get(table.name) ?? [];
  const uniqueHasManyTables = [...new Set(hasManyRelations.map(r => r.fromTable))];
  for (const relatingTable of uniqueHasManyTables) {
    if (relatingTable !== table.name) {
      let propName = toCamelCase(relatingTable);
      // Ensure no collision with existing properties
      if (usedPropertyNames.has(propName)) {
        propName = propName + 'List';
      }
      const targetType = toPascalCase(relatingTable);
      lines.push(`  ${propName}?: ${targetType}[];`);
      usedPropertyNames.add(propName);
    }
  }

  // Self-referential has-many
  const selfReferential = hasManyRelations.filter(r => r.fromTable === table.name);
  if (selfReferential.length > 0) {
    lines.push(`  children?: ${typeName}[];`);
  }

  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate a single table's Zod schema (with explicit type annotation for proper inference).
 *
 * @param table - Table info
 * @param hasManyMap - Map of has-many relations
 * @returns Code block for this table's schema
 */
function generateTableSchema(table: TableInfo, hasManyMap: HasManyMap): string {
  const schemaName = `${toPascalCase(table.name)}Schema`;
  const typeName = toPascalCase(table.name);
  const lines: string[] = [];
  const usedPropertyNames = new Set<string>();

  // JSDoc comment (OUT-04)
  lines.push(`/** Table: ${table.name} */`);

  // Schema declaration with explicit type annotation for proper inference with z.lazy()
  lines.push(`export const ${schemaName}: z.ZodType<${typeName}> = z.object({`);

  // Column properties (OUT-05, TYPE-*) - with duplicate detection
  for (const column of table.columns) {
    lines.push(generateColumnProperty(column, usedPropertyNames));
  }

  // Belongs-to relations (OUT-07, OUT-08) - use same naming as interface
  const fkPropNames = generateBelongsToPropertyNames(table.foreignKeys);
  for (const fk of table.foreignKeys) {
    let propName = fkPropNames.get(fk)!;
    if (usedPropertyNames.has(propName)) {
      propName = propName + 'Rel';
    }
    const targetSchema = `${toPascalCase(fk.referencedTable)}Schema`;
    lines.push(`  ${propName}: z.lazy(() => ${targetSchema}).optional(),`);
    usedPropertyNames.add(propName);
  }

  // Has-many relations (OUT-06, OUT-08)
  const hasManyRelations = hasManyMap.get(table.name) ?? [];
  // Deduplicate by table name (multiple FKs from same table = one has-many)
  const uniqueHasManyTables = [...new Set(hasManyRelations.map(r => r.fromTable))];
  for (const relatingTable of uniqueHasManyTables) {
    // Skip self-referential has-many (handled separately if needed)
    if (relatingTable !== table.name) {
      let propName = toCamelCase(relatingTable);
      if (usedPropertyNames.has(propName)) {
        propName = propName + 'List';
      }
      const targetSchema = `${toPascalCase(relatingTable)}Schema`;
      lines.push(`  ${propName}: z.lazy(() => ${targetSchema}).array().optional(),`);
      usedPropertyNames.add(propName);
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

  // PHASE 1: Generate all TypeScript interfaces first
  // This allows schemas to reference types before they're defined (TypeScript hoisting)
  lines.push('// ============================================================================');
  lines.push('// TypeScript Interfaces (for proper type inference with z.lazy)');
  lines.push('// ============================================================================');
  lines.push('');

  for (const table of sortedTables) {
    if (table.columns.length === 0) continue;
    lines.push(generateInterface(table, hasManyMap));
    lines.push('');
  }

  // PHASE 2: Generate all Zod schemas with explicit type annotations
  lines.push('// ============================================================================');
  lines.push('// Zod Schemas');
  lines.push('// ============================================================================');
  lines.push('');

  for (const table of sortedTables) {
    if (table.columns.length === 0) continue;
    lines.push(generateTableSchema(table, hasManyMap));
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
      primaryKey: ['id'],
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
      primaryKey: ['id'],
      foreignKeys: [
        { columnNames: ['user_id'], referencedTable: 'users', referencedColumns: ['id'] },
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
  // Now uses explicit type annotations instead of z.infer
  console.assert(code.includes('export const UsersSchema: z.ZodType<Users> = z.object({'), 'Has UsersSchema with type annotation');
  console.assert(code.includes('export const PostsSchema: z.ZodType<Posts> = z.object({'), 'Has PostsSchema with type annotation');
  // Now generates interfaces before schemas
  console.assert(code.includes('export interface Users {'), 'Has Users interface');
  console.assert(code.includes('export interface Posts {'), 'Has Posts interface');
  console.assert(code.includes('email: z.string(),'), 'Has email property');
  console.assert(code.includes('createdAt: z.coerce.date().nullable().optional(),'), 'Has createdAt camelCase');
  console.assert(code.includes("status: z.enum(['draft', 'published']).nullable().optional(),"), 'Has enum status');
  console.assert(code.includes('user: z.lazy(() => UsersSchema).optional(),'), 'Has belongs-to user');
  console.assert(code.includes('posts: z.lazy(() => PostsSchema).array().optional(),'), 'Has has-many posts');

  console.log('\nAll schema-generator tests passed!');
}
