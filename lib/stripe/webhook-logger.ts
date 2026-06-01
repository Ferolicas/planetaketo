import type Stripe from 'stripe';
import { query, queryOne } from '@/lib/db';

// ============================================================
// Registro de webhooks de Stripe (tabla webhook_logs, pg).
// ============================================================

export class WebhookLogger {
  private logId: string | null = null;

  async logReceived(event: Stripe.Event): Promise<string> {
    const session = event.data.object as Stripe.Checkout.Session;

    const row = await queryOne<{ id: string }>(
      `INSERT INTO webhook_logs
         (event_id, event_type, stripe_session_id, stripe_payment_intent,
          customer_email, amount, currency, status, processing_step, raw_event)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'received', 'webhook_received', $8)
       RETURNING id`,
      [
        event.id,
        event.type,
        session.id ?? null,
        (session.payment_intent as string) ?? null,
        session.customer_email || session.customer_details?.email || null,
        session.amount_total ? session.amount_total / 100 : null,
        session.currency ?? null,
        JSON.stringify(event),
      ]
    );

    if (!row) throw new Error('No se pudo crear el webhook log');
    this.logId = row.id;
    console.log(`📝 Webhook log creado: ${this.logId} | Event: ${event.id}`);
    return row.id;
  }

  async logStep(step: string): Promise<void> {
    if (!this.logId) return;
    await query(
      `UPDATE webhook_logs SET status = 'processing', processing_step = $2 WHERE id = $1`,
      [this.logId, step]
    );
  }

  async logCompleted(paymentId?: string): Promise<void> {
    if (!this.logId) return;
    await query(
      `UPDATE webhook_logs
       SET status = 'completed', processing_step = 'completed', completed_at = now()
       WHERE id = $1`,
      [this.logId]
    );
    if (paymentId) {
      await query(`UPDATE payments SET webhook_log_id = $2 WHERE id = $1`, [
        paymentId,
        this.logId,
      ]);
    }
  }

  async logFailed(error: Error, step: string): Promise<void> {
    if (!this.logId) return;
    await query(
      `UPDATE webhook_logs
       SET status = 'failed', processing_step = $2, error_message = $3, error_stack = $4
       WHERE id = $1`,
      [this.logId, step, error.message, error.stack ?? null]
    );
  }

  async logRetry(): Promise<void> {
    if (!this.logId) return;
    await query(
      `UPDATE webhook_logs
       SET status = 'retrying',
           retry_count = COALESCE(retry_count, 0) + 1,
           last_retry_at = now()
       WHERE id = $1`,
      [this.logId]
    );
  }

  static async isEventProcessed(eventId: string): Promise<boolean> {
    const row = await queryOne<{ status: string }>(
      `SELECT status FROM webhook_logs WHERE event_id = $1`,
      [eventId]
    );
    return row?.status === 'completed';
  }

  getLogId(): string | null {
    return this.logId;
  }
}
