import { Pool, QueryResult, QueryResultRow } from 'pg';

// ============================================================
// Pool de conexiones PostgreSQL (singleton) — VPS
// ============================================================
// Reemplaza por completo el cliente de Supabase para acceso a datos.
// Lee DATABASE_URL (en el VPS apunta a postgresql://planetaketo@127.0.0.1:5432/planetaketo).

declare global {
  // eslint-disable-next-line no-var
  var __planetaketoPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no esta definida en el entorno');
  }

  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // SSL solo para hosts remotos (en el VPS la DB es local => sin SSL)
    ssl: !isLocal ? { rejectUnauthorized: false } : undefined,
  });

  pool.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[db] error inesperado en cliente inactivo:', err);
  });

  return pool;
}

export const pool: Pool = global.__planetaketoPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  global.__planetaketoPool = pool;
}

// Helper tipado para queries parametrizadas
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}

// Devuelve la primera fila o null
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}

// Ejecuta una funcion dentro de una transaccion con un cliente dedicado
export async function withTransaction<T>(
  fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
