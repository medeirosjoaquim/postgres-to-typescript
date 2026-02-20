export interface ColumnSchema {
  name: string;              // Column name (snake_case from DB)
  dataType: string;          // Postgres type (text, integer, timestamp, etc.)
  isNullable: boolean;       // Whether column allows NULL
  isPrimaryKey: boolean;     // Whether column is part of primary key
  isUnique: boolean;         // Whether column has a unique constraint
  isEnum: boolean;           // Whether column uses a PostgreSQL enum type
  enumValues: string[] | null; // Enum values if isEnum is true
  defaultValue: string | null; // Default value if any
}

export interface ForeignKeySchema {
  constraintName: string;      // FK constraint name
  columnNames: string[];       // Local column names (composite FK support)
  referencedTable: string;     // Referenced table name
  referencedColumns: string[]; // Referenced column names (composite FK support)
}

export interface TableSchema {
  tableName: string;           // Table name (snake_case from DB)
  columns: ColumnSchema[];     // All columns
  primaryKey: string[];        // Column names that form PK
  uniqueConstraints: string[][]; // Groups of column names with unique constraints
  foreignKeys: ForeignKeySchema[]; // Foreign key relationships
}

export interface DatabaseSchema {
  tables: TableSchema[];
}
