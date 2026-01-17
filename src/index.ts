#!/usr/bin/env node

import { parseArgs, run } from './cli.js';

async function main(): Promise<void> {
  try {
    const options = parseArgs(process.argv);
    await run(options);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}

main();
