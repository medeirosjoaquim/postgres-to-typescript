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
