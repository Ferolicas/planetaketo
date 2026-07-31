/**
 * Repara entregas postpago incompletas. Producción lo ejecuta por cron; no
 * consulta ni altera estados de cobro, solo pagos que un webhook ya confirmó.
 */
import { pool } from '../lib/db';
import { reconcilePendingDeliveries } from '../lib/payments/process-sale';

async function main() {
  const result = await reconcilePendingDeliveries(100);
  if (result.inspected > 0 || result.failed > 0) {
    console.log(
      `[delivery-reconcile] inspected=${result.inspected} completed=${result.completed} failed=${result.failed}`
    );
  }
  if (result.failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('[delivery-reconcile] fatal:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
