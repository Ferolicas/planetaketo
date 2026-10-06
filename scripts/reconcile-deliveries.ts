/**
 * Repara entregas postpago incompletas. Producción lo ejecuta por cron: primero
 * descubre pagos MP aprobados que perdieron su webhook y después reintenta los
 * efectos de entrega de todas las pasarelas.
 */
import { pool } from '../lib/db';
import { reconcilePendingDeliveries } from '../lib/payments/process-sale';
import { reconcileApprovedMpPayments } from '../lib/payments/mercadopago';

async function main() {
  let mp = { inspected: 0, eligible: 0, recovered: 0, failed: 0 };
  let mpSearchFailed = false;
  try {
    mp = await reconcileApprovedMpPayments();
  } catch (error) {
    mpSearchFailed = true;
    console.error(
      '[mp-reconcile] búsqueda falló; continúan los reintentos de entrega:',
      error instanceof Error ? error.message : error
    );
  }

  const result = await reconcilePendingDeliveries(100);
  if (mp.eligible > 0 || mp.failed > 0) {
    console.log(
      `[mp-reconcile] inspected=${mp.inspected} eligible=${mp.eligible} recovered=${mp.recovered} failed=${mp.failed}`
    );
  }
  if (result.inspected > 0 || result.failed > 0) {
    console.log(
      `[delivery-reconcile] inspected=${result.inspected} completed=${result.completed} failed=${result.failed}`
    );
  }
  if (mpSearchFailed || mp.failed > 0 || result.failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('[delivery-reconcile] fatal:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
