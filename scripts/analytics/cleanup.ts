/**
 * Borrado automático de analítica (minimización de datos — RGPD).
 *
 * Conservación:
 *   - analytics_sessions : 14 meses (máximo recomendado por la AEPD para analítica).
 *   - analytics_consent  : 24 meses (prueba de accountability del consentimiento,
 *                          algo más que la ventana de datos para poder demostrarlo).
 *   - analytics_events   : 14 meses (tabla legada del sistema anterior).
 *
 * Uso (en el VPS, cwd /apps/planetaketo):
 *   pnpm exec tsx scripts/analytics/cleanup.ts
 *
 * Env (.env.local de planetaketo):
 *   DATABASE_URL -> BD planetaketo
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SESSIONS_MONTHS = 14;
const CONSENT_MONTHS = 24;
const EVENTS_MONTHS = 14;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Falta DATABASE_URL en el entorno (.env.local)');

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: !isLocal ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const sessions = await pool.query(
      `DELETE FROM analytics_sessions WHERE entered_at < now() - INTERVAL '${SESSIONS_MONTHS} months'`
    );
    const consent = await pool.query(
      `DELETE FROM analytics_consent WHERE created_at < now() - INTERVAL '${CONSENT_MONTHS} months'`
    );

    // La tabla legada puede no existir; no es un error.
    let eventsCount = 0;
    try {
      const events = await pool.query(
        `DELETE FROM analytics_events WHERE created_at < now() - INTERVAL '${EVENTS_MONTHS} months'`
      );
      eventsCount = events.rowCount ?? 0;
    } catch (e) {
      console.warn('[cleanup] analytics_events no disponible:', (e as Error).message);
    }

    console.log(
      `[cleanup] ${new Date().toISOString()} | sesiones=${sessions.rowCount ?? 0} ` +
        `consent=${consent.rowCount ?? 0} events=${eventsCount}`
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[cleanup] error:', err);
  process.exit(1);
});
