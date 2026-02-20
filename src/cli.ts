import { Command } from 'commander';
import { connectToDatabase, disconnectFromDatabase } from './db.js';
import { introspectDatabase } from './introspect/index.js';
import { generateSchemas, writeSchemaFile, type TableInfo } from './generator/index.js';
import type { TableSchema } from './introspect/types.js';

export interface CliOptions {
  connectionString: string;
  db: string;
  output: string;
}

export function parseArgs(args: string[]): CliOptions {
  const program = new Command();

  program
    .name('pg-to-ts')
    .description('Generate Zod schemas and TypeScript types from PostgreSQL database')
    .version('1.0.0')
    .requiredOption('-c, --connection-string <url>', 'PostgreSQL connection URL')
    .requiredOption('-d, --db <name>', 'Database name')
    .requiredOption('-o, --output <path>', 'Output file path for generated types');

  program.parse(args);

  const opts = program.opts();
  return {
    connectionString: opts.connectionString,
    db: opts.db,
    output: opts.output,
  };
}

/**
 * Adapt introspection output to generator input format.
 * Converts TableSchema[] (from introspect) to TableInfo[] (for generator).
 * Now supports composite primary keys, composite foreign keys, and PostgreSQL enums.
 */
function adaptToGeneratorInput(tables: TableSchema[]): TableInfo[] {
  return tables.map(table => ({
    name: table.tableName,
    columns: table.columns.map(col => ({
      name: col.name,
      type: col.dataType,
      isNullable: col.isNullable,
      isPrimaryKey: col.isPrimaryKey,
      isEnum: col.isEnum,
      enumValues: col.enumValues ?? undefined,
    })),
    primaryKey: table.primaryKey, // Full composite PK support
    foreignKeys: table.foreignKeys.map(fk => ({
      columnNames: fk.columnNames,
      referencedTable: fk.referencedTable,
      referencedColumns: fk.referencedColumns,
    })),
  }));
}

export async function run(options: CliOptions): Promise<void> {
  console.log(`Connecting to ${options.db}...`);

  const connection = await connectToDatabase(options.connectionString, options.db);

  try {
    // Introspect database schema
    console.log('Introspecting database schema...');
    const schema = await introspectDatabase(connection.client);
    console.log(`Found ${schema.tables.length} tables`);

    // Adapt and generate schemas
    console.log('Generating Zod schemas...');
    const tables = adaptToGeneratorInput(schema.tables);
    const { schemaCode, schemaNames } = generateSchemas(tables);

    // Write to output file
    writeSchemaFile(options.output, schemaCode);

    // Success message
    console.log(`Success! Generated ${schemaNames.length} schemas to ${options.output}`);
    if (schemaNames.length > 0) {
      console.log('Schemas:', schemaNames.join(', '));
    }
  } finally {
    await disconnectFromDatabase(connection);
  }
}
