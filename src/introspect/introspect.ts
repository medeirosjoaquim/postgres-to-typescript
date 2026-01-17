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
async function getColumns(client: PoolClient, tableName: string): Promise<Omit<ColumnSchema, 'isPrimaryKey'>[]> {
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
 * Get primary key column names for a specific table.
 */
async function getPrimaryKey(client: PoolClient, tableName: string): Promise<string[]> {
  const result = await client.query<{ column_name: string }>(`
    SELECT a.attname as column_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'p'
      AND c.conrelid = $1::regclass
  `, [tableName]);

  return result.rows.map(row => row.column_name);
}

/**
 * Get foreign keys for a specific table.
 * Note: This will be implemented in Task 3, returning empty array for now.
 */
async function getForeignKeys(client: PoolClient, tableName: string): Promise<ForeignKeySchema[]> {
  // Placeholder - will be implemented in Task 3
  return [];
}

/**
 * Introspect the database schema, returning tables, columns, primary keys, and foreign keys.
 */
export async function introspectDatabase(client: PoolClient): Promise<DatabaseSchema> {
  const tableNames = await getTables(client);

  const tables: TableSchema[] = await Promise.all(
    tableNames.map(async (tableName) => {
      const [columnsWithoutPk, primaryKey, foreignKeys] = await Promise.all([
        getColumns(client, tableName),
        getPrimaryKey(client, tableName),
        getForeignKeys(client, tableName),
      ]);

      // Mark columns that are part of the primary key
      const columns: ColumnSchema[] = columnsWithoutPk.map(col => ({
        ...col,
        isPrimaryKey: primaryKey.includes(col.name),
      }));

      return {
        tableName,
        columns,
        primaryKey,
        foreignKeys,
      };
    })
  );

  return { tables };
}
