import { query } from '@/lib/db';

// ============================================================
// Enlace sesión ↔ transacción (server-side). Marca el estado de la visita en
// analytics_sessions a partir del UUID de sesión que viaja como metadata por
// cada pasarela. Best-effort: nunca lanza (no puede tumbar un pago).
// ============================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const valid = (sid?: string | null): sid is string => !!sid && UUID_RE.test(sid);

/** Al crear el checkout: sin_checkout → checkout_iniciado_no_completado. */
export async function markCheckoutStarted(sessionId?: string | null): Promise<void> {
  if (!valid(sessionId)) return;
  try {
    await query(
      `UPDATE analytics_sessions
         SET transaction_state = 'checkout_iniciado_no_completado', updated_at = now()
       WHERE id = $1 AND transaction_state = 'sin_checkout'`,
      [sessionId]
    );
  } catch (e) {
    console.error('[session-link] checkout_started:', (e as Error).message);
  }
}

/** Al confirmarse la venta (webhook): cualquier estado → venta_completada. */
export async function markSaleCompleted(sessionId?: string | null): Promise<void> {
  if (!valid(sessionId)) return;
  try {
    await query(
      `UPDATE analytics_sessions
         SET transaction_state = 'venta_completada', updated_at = now()
       WHERE id = $1`,
      [sessionId]
    );
  } catch (e) {
    console.error('[session-link] sale_completed:', (e as Error).message);
  }
}
