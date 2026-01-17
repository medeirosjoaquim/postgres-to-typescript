import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export interface WriteOptions {
  overwrite?: boolean;  // Default true
}

/**
 * Write generated schema code to a file.
 * Creates parent directories if they don't exist.
 *
 * @param outputPath - Path to write the file
 * @param content - Generated schema content
 * @param options - Write options (overwrite control)
 */
export function writeSchemaFile(
  outputPath: string,
  content: string,
  options: WriteOptions = {}
): void {
  const { overwrite = true } = options;

  // Ensure directory exists
  const dir = dirname(outputPath);
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Check for existing file if not overwriting
  if (!overwrite && existsSync(outputPath)) {
    throw new Error(`File already exists: ${outputPath}`);
  }

  // Write the file
  writeFileSync(outputPath, content, 'utf-8');
}
