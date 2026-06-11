import { Pool, QueryResult, QueryResultRow } from "pg";

// ============================================================
// Pool de conexiones PostgreSQL (singleton)
// ============================================================
// Reutilizamos el pool entre invocaciones para no agotar conexiones.
// En desarrollo, Next.js recarga modulos: guardamos el pool en globalThis.

declare global {
  // eslint-disable-next-line no-var
  var __ketoscanPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no esta definida en el entorno");
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // SSL en produccion si la URL no apunta a localhost
    ssl:
      process.env.NODE_ENV === "production" &&
      !connectionString.includes("localhost") &&
      !connectionString.includes("127.0.0.1")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  pool.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[db] error inesperado en cliente inactivo:", err);
  });

  return pool;
}

export const pool: Pool = global.__ketoscanPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__ketoscanPool = pool;
}

// Helper tipado para queries
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
