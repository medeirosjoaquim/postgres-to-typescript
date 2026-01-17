import { Command } from 'commander';

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

export async function run(options: CliOptions): Promise<void> {
  console.log(`Connecting to database: ${options.db}...`);
  // Database connection will be implemented in Plan 02
}
