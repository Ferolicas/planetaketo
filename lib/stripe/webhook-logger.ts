import { supabaseAdmin } from '@/lib/supabase';
import type Stripe from 'stripe';

interface WebhookLogData {
  eventId: string;
  eventType: string;
  stripeSessionId?: string;
  stripePaymentIntent?: string;
  customerEmail?: string;
  amount?: number;
  currency?: string;
  status: 'received' | 'processing' | 'completed' | 'failed' | 'retrying';
  processingStep?: string;
  errorMessage?: string;
  errorStack?: string;
  rawEvent: Stripe.Event;
  retryCount?: number;
}

export class WebhookLogger {
  private logId: string | null = null;

  /**
   * Create initial webhook log entry
   */
  async logReceived(event: Stripe.Event): Promise<string> {
    const session = event.data.object as Stripe.Checkout.Session;

    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .insert({
        event_id: event.id,
        event_type: event.type,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        customer_email: session.customer_email || session.customer_details?.email,
        amount: session.amount_total ? session.amount_total / 100 : null,
        currency: session.currency,
        status: 'received',
        processing_step: 'webhook_received',
        raw_event: event as any,
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Failed to create webhook log:', error);
      throw error;
    }

    this.logId = data.id;
    console.log(`📝 Webhook log created: ${this.logId} | Event: ${event.id}`);
    return data.id;
  }

  /**
   * Update webhook log with processing step
   */
  async logStep(step: string, additionalData?: Record<string, any>): Promise<void> {
    if (!this.logId) {
      console.error('❌ Cannot log step: No log ID set');
      return;
    }

    const { error } = await supabaseAdmin
      .from('webhook_logs')
      .update({
        status: 'processing',
        processing_step: step,
        ...additionalData,
      })
      .eq('id', this.logId);

    if (error) {
      console.error(`❌ Failed to log step "${step}":`, error);
    } else {
      console.log(`✓ Step completed: ${step}`);
    }
  }

  /**
   * Mark webhook as completed
   */
  async logCompleted(paymentId?: string): Promise<void> {
    if (!this.logId) {
      console.error('❌ Cannot log completion: No log ID set');
      return;
    }

    const { error } = await supabaseAdmin
      .from('webhook_logs')
      .update({
        status: 'completed',
        processing_step: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', this.logId);

    if (error) {
      console.error('❌ Failed to log completion:', error);
    } else {
      console.log(`✅ Webhook completed: ${this.logId}`);
    }

    // Update payment record if provided
    if (paymentId) {
      await supabaseAdmin
        .from('payments')
        .update({ webhook_log_id: this.logId })
        .eq('id', paymentId);
    }
  }

  /**
   * Mark webhook as failed with error details
   */
  async logFailed(error: Error, step: string): Promise<void> {
    if (!this.logId) {
      console.error('❌ Cannot log failure: No log ID set');
      return;
    }

    const errorData = {
      status: 'failed' as const,
      processing_step: step,
      error_message: error.message,
      error_stack: error.stack,
    };

    const { error: updateError } = await supabaseAdmin
      .from('webhook_logs')
      .update(errorData)
      .eq('id', this.logId);

    if (updateError) {
      console.error('❌ Failed to log error:', updateError);
    } else {
      console.error(`❌ Webhook failed at step "${step}":`, error.message);
    }
  }

  /**
   * Increment retry count
   */
  async logRetry(): Promise<void> {
    if (!this.logId) return;

    const { data: log } = await supabaseAdmin
      .from('webhook_logs')
      .select('retry_count')
      .eq('id', this.logId)
      .single();

    const newRetryCount = (log?.retry_count || 0) + 1;

    await supabaseAdmin
      .from('webhook_logs')
      .update({
        status: 'retrying',
        retry_count: newRetryCount,
        last_retry_at: new Date().toISOString(),
      })
      .eq('id', this.logId);

    console.log(`🔄 Retry attempt #${newRetryCount}`);
  }

  /**
   * Check if event has already been processed (idempotency)
   */
  static async isEventProcessed(eventId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .select('id, status')
      .eq('event_id', eventId)
      .single();

    if (error || !data) return false;

    return data.status === 'completed';
  }

  /**
   * Get webhook log ID
   */
  getLogId(): string | null {
    return this.logId;
  }
}
