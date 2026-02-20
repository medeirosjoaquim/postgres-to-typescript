import { PoolClient } from 'pg';
import { DatabaseSchema, TableSchema, ColumnSchema, ForeignKeySchema } from './types.js';

/**
 * Get all table names in the public schema.
 */
async function getTables(client: PoolClient): Promise<string[]> {
  const result = await client.query<{ table_name: string }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return result.rows.map(row => row.table_name);
}

/**
 * Get columns for a specific table.
 */
async function getColumns(client: PoolClient, tableName: string): Promise<Omit<ColumnSchema, 'isPrimaryKey' | 'isUnique'>[]> {
  const result = await client.query<{
    column_name: string;
    data_type: string;
    udt_name: string;
    is_nullable: string;
    column_default: string | null;
  }>(`
    SELECT
      column_name,
      data_type,
      udt_name,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);

  return result.rows.map(row => ({
    name: row.column_name,
    // Use udt_name for more specific type info (e.g., int4 vs integer, _text for text[])
    dataType: row.udt_name,
    isNullable: row.is_nullable === 'YES',
    defaultValue: row.column_default,
  }));
}

/**
 * Get unique constraints for a specific table.
 * Returns groups of column names that form unique constraints.
 */
async function getUniqueConstraints(client: PoolClient, tableName: string): Promise<string[][]> {
  const result = await client.query<{
    column_names: string[];
  }>(`
    SELECT
      array_agg(a.attname ORDER BY array_position(c.conkey, a.attnum)) as column_names
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'u'
      AND n.nspname = 'public'
      AND cl.relname = $1
    GROUP BY c.conname
  `, [tableName]);

  return result.rows.map(row => row.column_names);
}

/**
 * Get all enum types used in the database with their values.
 */
async function getEnumTypes(client: PoolClient): Promise<Map<string, string[]>> {
  const result = await client.query<{
    typname: string;
    enumlabels: string[];
  }>(`
    SELECT
      t.typname,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as enumlabels
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
  `);

  const enumMap = new Map<string, string[]>();
  for (const row of result.rows) {
    enumMap.set(row.typname, row.enumlabels);
  }
  return enumMap;
}

/**
 * Get primary key column names for a specific table.
 */
async function getPrimaryKey(client: PoolClient, tableName: string): Promise<string[]> {
  const result = await client.query<{ column_name: string }>(`
    SELECT a.attname as column_name
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'p'
      AND n.nspname = 'public'
      AND cl.relname = $1
  `, [tableName]);

  return result.rows.map(row => row.column_name);
}

/**
 * Get foreign keys for a specific table.
 * Handles: tables with no FKs, multiple FKs, self-referential FKs, composite FKs.
 */
async function getForeignKeys(client: PoolClient, tableName: string): Promise<ForeignKeySchema[]> {
  const result = await client.query<{
    constraint_name: string;
    column_names: string[];
    referenced_table: string;
    referenced_columns: string[];
  }>(`
    SELECT
      c.conname as constraint_name,
      array_agg(local_a.attname ORDER BY ord.ord) as column_names,
      ref_cl.relname as referenced_table,
      array_agg(ref_a.attname ORDER BY ord.ord) as referenced_columns
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    JOIN pg_class ref_cl ON ref_cl.oid = c.confrelid
    CROSS JOIN LATERAL unnest(c.conkey, c.confkey) WITH ORDINALITY AS ord(local_attnum, ref_attnum, ord)
    JOIN pg_attribute local_a ON local_a.attrelid = c.conrelid AND local_a.attnum = ord.local_attnum
    JOIN pg_attribute ref_a ON ref_a.attrelid = c.confrelid AND ref_a.attnum = ord.ref_attnum
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND cl.relname = $1
    GROUP BY c.conname, ref_cl.relname
  `, [tableName]);

  return result.rows.map(row => ({
    constraintName: row.constraint_name,
    columnNames: row.column_names,
    referencedTable: row.referenced_table,
    referencedColumns: row.referenced_columns,
  }));
}

/**
 * Check if a data type is a PostgreSQL enum type.
 * Returns the enum values if it is, undefined otherwise.
 */
function getEnumValuesForColumn(
  dataType: string,
  enumTypes: Map<string, string[]>
): string[] | undefined {
  // Check direct match (e.g., 'order_status' -> ['pending', 'completed'])
  return enumTypes.get(dataType);
}

/**
 * Introspect the database schema, returning tables, columns, primary keys, unique constraints, and foreign keys.
 * Also detects PostgreSQL enum types and marks columns that use them.
 */
export async function introspectDatabase(client: PoolClient): Promise<DatabaseSchema> {
  const tableNames = await getTables(client);
  
  // Get all enum types once for reference
  const enumTypes = await getEnumTypes(client);

  const tables: TableSchema[] = await Promise.all(
    tableNames.map(async (tableName) => {
      const [columnsWithoutFlags, primaryKey, uniqueConstraints, foreignKeys] = await Promise.all([
        getColumns(client, tableName),
        getPrimaryKey(client, tableName),
        getUniqueConstraints(client, tableName),
        getForeignKeys(client, tableName),
      ]);

      // Mark columns that are part of the primary key or have unique constraints
      // Also detect enum types
      const uniqueColumns = new Set(uniqueConstraints.flat());
      const columns: ColumnSchema[] = columnsWithoutFlags.map(col => {
        const enumValues = getEnumValuesForColumn(col.dataType, enumTypes);
        return {
          ...col,
          isPrimaryKey: primaryKey.includes(col.name),
          isUnique: uniqueColumns.has(col.name) || primaryKey.includes(col.name),
          isEnum: enumValues !== undefined,
          enumValues: enumValues ?? null,
        };
      });

      return {
        tableName,
        columns,
        primaryKey,
        uniqueConstraints,
        foreignKeys,
      };
    })
  );

  return { tables };
}
