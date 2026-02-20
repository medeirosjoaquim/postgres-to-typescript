/**
 * Postgres-to-Zod type mapping utilities.
 * Converts Postgres column types to Zod schema strings for code generation.
 */

/**
 * Type mapping result with metadata.
 */
export interface ZodTypeMapping {
  zodType: string;    // e.g., "z.string()", "z.number().int()"
  isArray: boolean;   // Whether this is an array type
  isNullable: boolean; // Whether this is nullable
}

/**
 * Map of Postgres types to their Zod equivalents.
 * Keys are lowercase Postgres type names, values are Zod method chains.
 */
const POSTGRES_TO_ZOD_MAP: Record<string, string> = {
  // String types
  'text': 'z.string()',
  'varchar': 'z.string()',
  'char': 'z.string()',
  'character varying': 'z.string()',
  'character': 'z.string()',
  'uuid': 'z.string()',
  'citext': 'z.string()',
  'name': 'z.string()',
  'bpchar': 'z.string()', // blank-padded char

  // Integer types
  'integer': 'z.number().int()',
  'int': 'z.number().int()',
  'int4': 'z.number().int()',
  'smallint': 'z.number().int()',
  'int2': 'z.number().int()',
  'serial': 'z.number().int()',
  'serial4': 'z.number().int()',
  'smallserial': 'z.number().int()',
  'serial2': 'z.number().int()',

  // BigInt types (JavaScript bigint)
  'bigint': 'z.bigint()',
  'int8': 'z.bigint()',
  'bigserial': 'z.bigint()',
  'serial8': 'z.bigint()',

  // Floating point types
  'real': 'z.number()',
  'float4': 'z.number()',
  'double precision': 'z.number()',
  'float8': 'z.number()',
  'numeric': 'z.number()',
  'decimal': 'z.number()',
  'money': 'z.number()',

  // Boolean type
  'boolean': 'z.boolean()',
  'bool': 'z.boolean()',

  // Date/time types
  'timestamp': 'z.coerce.date()',
  'timestamptz': 'z.coerce.date()',
  'timestamp with time zone': 'z.coerce.date()',
  'timestamp without time zone': 'z.coerce.date()',
  'date': 'z.coerce.date()',

  // Time types (stored as strings since JS has no native time-only type)
  'time': 'z.string()',
  'timetz': 'z.string()',
  'time with time zone': 'z.string()',
  'time without time zone': 'z.string()',
  'interval': 'z.string()',

  // JSON types
  'json': 'z.unknown()',
  'jsonb': 'z.unknown()',

  // Binary types
  'bytea': 'z.instanceof(Buffer)',

  // Network types
  'inet': 'z.string()',
  'cidr': 'z.string()',
  'macaddr': 'z.string()',
  'macaddr8': 'z.string()',

  // Geometric types (stored as strings)
  'point': 'z.string()',
  'line': 'z.string()',
  'lseg': 'z.string()',
  'box': 'z.string()',
  'path': 'z.string()',
  'polygon': 'z.string()',
  'circle': 'z.string()',

  // Text search types
  'tsvector': 'z.string()',
  'tsquery': 'z.string()',

  // XML
  'xml': 'z.string()',

  // OID
  'oid': 'z.number().int()',
};

/**
 * Check if a Postgres type string represents an array type.
 * Arrays are denoted with [] suffix or _array prefix in some cases.
 *
 * @param pgType - Postgres type name
 * @returns true if this is an array type
 */
function isArrayType(pgType: string): boolean {
  return pgType.endsWith('[]') || pgType.startsWith('_');
}

/**
 * Extract the base type from an array type.
 *
 * @param pgType - Postgres array type (e.g., "text[]" or "_text")
 * @returns The base element type (e.g., "text")
 */
function extractArrayBaseType(pgType: string): string {
  if (pgType.endsWith('[]')) {
    return pgType.slice(0, -2);
  }
  if (pgType.startsWith('_')) {
    return pgType.slice(1);
  }
  return pgType;
}

/**
 * Maps a Postgres column type to its Zod schema string representation.
 *
 * @param pgType - Postgres type name (e.g., "text", "integer", "text[]")
 * @param isNullable - Whether the column allows NULL values
 * @returns Zod schema string (e.g., "z.string()", "z.number().int().nullable().optional()")
 *
 * @example
 * mapPostgresTypeToZod('text', false) // 'z.string()'
 * mapPostgresTypeToZod('integer', false) // 'z.number().int()'
 * mapPostgresTypeToZod('text', true) // 'z.string().nullable().optional()'
 * mapPostgresTypeToZod('text[]', false) // 'z.array(z.string())'
 * mapPostgresTypeToZod('jsonb', false) // 'z.unknown()'
 */
export function mapPostgresTypeToZod(pgType: string, isNullable: boolean): string {
  const normalizedType = pgType.toLowerCase().trim();
  const isArray = isArrayType(normalizedType);

  let baseType: string;
  if (isArray) {
    const elementType = extractArrayBaseType(normalizedType);
    // Unknown array element types (likely custom enums) treated as strings
    const zodElementType = POSTGRES_TO_ZOD_MAP[elementType] ?? 'z.string()';
    baseType = `z.array(${zodElementType})`;
  } else {
    // Unknown types (likely custom enums) treated as strings for compatibility
    baseType = POSTGRES_TO_ZOD_MAP[normalizedType] ?? 'z.string()';
  }

  if (isNullable) {
    return `${baseType}.nullable().optional()`;
  }

  return baseType;
}

/**
 * Maps a Postgres enum type to a Zod enum schema string.
 *
 * @param enumName - Name of the Postgres enum type (for documentation)
 * @param values - Array of enum values
 * @returns Zod enum schema string
 *
 * @example
 * mapEnumToZod('status', ['active', 'pending', 'inactive'])
 * // "z.enum(['active', 'pending', 'inactive'])"
 */
export function mapEnumToZod(enumName: string, values: string[]): string {
  const quotedValues = values.map(v => `'${v}'`).join(', ');
  return `z.enum([${quotedValues}])`;
}

/**
 * Get detailed mapping information for a Postgres type.
 *
 * @param pgType - Postgres type name
 * @param isNullable - Whether the column allows NULL values
 * @returns Detailed mapping information
 */
export function getZodTypeMapping(pgType: string, isNullable: boolean): ZodTypeMapping {
  return {
    zodType: mapPostgresTypeToZod(pgType, isNullable),
    isArray: isArrayType(pgType.toLowerCase().trim()),
    isNullable,
  };
}

// Self-test when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Basic type mapping
  console.assert(mapPostgresTypeToZod('text', false) === 'z.string()', 'text -> z.string()');
  console.assert(mapPostgresTypeToZod('integer', false) === 'z.number().int()', 'integer -> z.number().int()');
  console.assert(mapPostgresTypeToZod('int4', false) === 'z.number().int()', 'int4 -> z.number().int()');
  console.assert(mapPostgresTypeToZod('bigint', false) === 'z.bigint()', 'bigint -> z.bigint()');
  console.assert(mapPostgresTypeToZod('boolean', false) === 'z.boolean()', 'boolean -> z.boolean()');
  console.assert(mapPostgresTypeToZod('timestamp', false) === 'z.coerce.date()', 'timestamp -> z.coerce.date()');
  console.assert(mapPostgresTypeToZod('timestamptz', false) === 'z.coerce.date()', 'timestamptz -> z.coerce.date()');
  console.assert(mapPostgresTypeToZod('date', false) === 'z.coerce.date()', 'date -> z.coerce.date()');
  console.assert(mapPostgresTypeToZod('jsonb', false) === 'z.unknown()', 'jsonb -> z.unknown()');
  console.assert(mapPostgresTypeToZod('json', false) === 'z.unknown()', 'json -> z.unknown()');
  console.assert(mapPostgresTypeToZod('uuid', false) === 'z.string()', 'uuid -> z.string()');

  // Nullable types
  console.assert(
    mapPostgresTypeToZod('text', true) === 'z.string().nullable().optional()',
    'text nullable -> z.string().nullable().optional()'
  );
  console.assert(
    mapPostgresTypeToZod('integer', true) === 'z.number().int().nullable().optional()',
    'integer nullable -> z.number().int().nullable().optional()'
  );

  // Array types
  console.assert(
    mapPostgresTypeToZod('text[]', false) === 'z.array(z.string())',
    'text[] -> z.array(z.string())'
  );
  console.assert(
    mapPostgresTypeToZod('integer[]', false) === 'z.array(z.number().int())',
    'integer[] -> z.array(z.number().int())'
  );
  console.assert(
    mapPostgresTypeToZod('_text', false) === 'z.array(z.string())',
    '_text -> z.array(z.string())'
  );
  console.assert(
    mapPostgresTypeToZod('text[]', true) === 'z.array(z.string()).nullable().optional()',
    'text[] nullable -> z.array(z.string()).nullable().optional()'
  );

  // Unknown types fallback (custom enums treated as strings)
  console.assert(
    mapPostgresTypeToZod('some_custom_type', false) === 'z.string()',
    'unknown type -> z.string()'
  );

  // Enum mapping
  console.assert(
    mapEnumToZod('status', ['active', 'pending']) === "z.enum(['active', 'pending'])",
    "enum -> z.enum(['active', 'pending'])"
  );
  console.assert(
    mapEnumToZod('role', ['admin', 'user', 'guest']) === "z.enum(['admin', 'user', 'guest'])",
    "enum with 3 values"
  );

  // ZodTypeMapping function
  const mapping = getZodTypeMapping('text[]', true);
  console.assert(mapping.isArray === true, 'text[] isArray');
  console.assert(mapping.isNullable === true, 'text[] nullable isNullable');
  console.assert(mapping.zodType === 'z.array(z.string()).nullable().optional()', 'text[] nullable zodType');

  console.log('All type-mapper tests passed!');
}
