export interface ColumnSchema {
  name: string;           // Column name (snake_case from DB)
  dataType: string;       // Postgres type (text, integer, timestamp, etc.)
  isNullable: boolean;    // Whether column allows NULL
  isPrimaryKey: boolean;  // Whether column is part of primary key
  defaultValue: string | null; // Default value if any
}

export interface ForeignKeySchema {
  constraintName: string;   // FK constraint name
  columnName: string;       // Local column name
  referencedTable: string;  // Referenced table name
  referencedColumn: string; // Referenced column name
}

export interface TableSchema {
  tableName: string;           // Table name (snake_case from DB)
  columns: ColumnSchema[];     // All columns
  primaryKey: string[];        // Column names that form PK
  foreignKeys: ForeignKeySchema[]; // Foreign key relationships
}

export interface DatabaseSchema {
  tables: TableSchema[];
}
