# TODO - pg-to-ts Missing Features & Improvements

## Critical Issues

- [ ] COMPOSITE_KEYS - Add full support for composite primary and foreign keys (currently only uses first column)
- [ ] ENUM_DETECTION - Implement PostgreSQL enum type introspection (currently marked as TODO in code, enums treated as strings)
- [ ] UNIQUE_CONSTRAINTS - Detect and represent unique constraints in generated types

## Schema Introspection Enhancements

- [ ] MULTI_SCHEMA - Support introspection of schemas beyond 'public' (add --schema CLI option)
- [ ] VIEWS - Add support for database views
- [ ] MATERIALIZED_VIEWS - Add support for materialized views
- [ ] CHECK_CONSTRAINTS - Detect CHECK constraints and add to JSDoc comments
- [ ] INDEXES - Detect indexes and mark them in generated types
- [ ] DEFAULT_VALUES - Include column default values in generated comments
- [ ] COMMENTS - Extract PostgreSQL column/table comments into JSDoc

## Code Generation Improvements

- [ ] INSERT_TYPES - Generate separate types for insert operations (omitting auto-generated columns)
- [ ] UPDATE_TYPES - Generate partial types for update operations
- [ ] SELECT_TYPES - Generate lightweight types without relation fields for simple queries
- [ ] STRICT_NULLABILITY - Option to use .nullable() without .optional() for stricter null handling
- [ ] READONLY_FIELDS - Mark primary key and computed columns as readonly in interfaces
- [ ] COERCE_DATES_OPTION - Make date coercion optional (some users prefer string dates)

## CLI & Configuration

- [ ] CONFIG_FILE - Add support for .pg-to-ts.json configuration file
- [ ] WATCH_MODE - Implement --watch flag for auto-regeneration on schema changes
- [ ] TABLE_FILTER - Add --include and --exclude patterns for table filtering
- [ ] TYPE_OVERRIDES - Allow custom type mapping overrides via config
- [ ] VERBOSE_FLAG - Add --verbose for detailed logging during introspection
- [ ] SILENT_FLAG - Add --silent to suppress all non-error output
- [ ] DRY_RUN_FLAG - Add --dry-run to preview output without writing file

## Relationship Handling

- [ ] JUNCTION_TABLES - Auto-detect many-to-many junction tables and generate explicit m:n relations
- [ ] RELATION_OPTIONS - Add configuration for relation depth limit to avoid circular issues
- [ ] SKIP_RELATIONS - Option to skip generating relation fields entirely
- [ ] CUSTOM_RELATION_NAMES - Allow mapping table names to custom relation property names
- [ ] ON_DELETE_ON_UPDATE - Include referential actions (CASCADE, SET NULL, etc.) in comments

## Output Formatting

- [ ] ESLINT_DISABLE - Add option to include eslint-disable comment for generated files
- [ ] PRETTIER_INTEGRATION - Run generated code through Prettier if available
- [ ] SORT_ORDER - Configurable table/column sort order (alphabetical vs database order)
- [ ] BANNER_COMMENT - Add custom header comment to generated files
- [ ] SINGLE_TABLE_MODE - Option to generate one file per table

## Advanced Features

- [ ] DIFF_MODE - Compare existing output with database and show changes without overwriting
- [ ] MIGRATION_HELPER - Generate TypeScript stubs for common migration patterns
- [ ] SEED_TYPES - Generate types for database seed data
- [ ] VALIDATION_MESSAGES - Add custom error messages to Zod schemas via .describe()
- [ ] BRANDED_TYPES - Option to use branded types for type-safe IDs (e.g., UserId vs OrderId)
- [ ] NAMESPACE_MODE - Wrap all types in a namespace to avoid global pollution

## Testing & Quality

- [ ] UNIT_TESTS - Add comprehensive unit tests for all modules
- [ ] INTEGRATION_TESTS - Add tests against real PostgreSQL databases
- [ ] TYPE_CHECK_TESTS - Verify generated types compile correctly
- [ ] SNAPSHOT_TESTS - Add snapshot testing for output stability
- [ ] ERROR_HANDLING - Improve error messages with context and suggestions
- [ ] RETRY_LOGIC - Add retry with backoff for database connection failures

## Documentation

- [ ] API_DOCS - Document programmatic API for using as a library
- [ ] RECIPES - Add common usage patterns and examples
- [ ] TROUBLESHOOTING - Add troubleshooting guide for common issues
- [ ] CHANGELOG - Maintain a proper CHANGELOG.md

## Performance

- [ ] CONNECTION_POOLING - Optimize connection usage for large databases
- [ ] PARALLEL_INTROSPECTION - Parallelize table introspection queries
- [ ] INCREMENTAL_MODE - Cache schema and only re-introspect changed tables
