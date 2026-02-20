import { Pool, PoolClient } from 'pg';

export interface DatabaseConnection {
  pool: Pool;
  client: PoolClient;
}

export async function connectToDatabase(
  connectionString: string,
  database: string
): Promise<DatabaseConnection> {
  // Parse connection string and ensure database is set
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  const finalConnectionString = url.toString();

  const pool = new Pool({
    connectionString: finalConnectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Verify connection works
    await client.query('SELECT current_database()');
    console.log(`Connected to database: ${database}`);

    return { pool, client };
  } catch (error) {
    await pool.end();

    if (error instanceof Error) {
      // Handle specific error codes
      const pgError = error as Error & { code?: string };

      if (pgError.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to PostgreSQL server. Is it running?');
      }

      if (pgError.code === 'ENOTFOUND') {
        throw new Error('Database host not found. Check your connection string.');
      }

      if (pgError.message.includes('password authentication failed') ||
          pgError.message.includes('authentication failed')) {
        throw new Error('Authentication failed. Check your credentials.');
      }

      throw new Error(`Database connection failed: ${error.message}`);
    }

    throw error;
  }
}

export async function disconnectFromDatabase(
  connection: DatabaseConnection
): Promise<void> {
  connection.client.release();
  await connection.pool.end();
  console.log('Disconnected from database');
}
