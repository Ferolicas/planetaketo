-- Create webhook_logs table for comprehensive tracking
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  customer_email TEXT,
  amount DECIMAL(10, 2),
  currency TEXT,
  status TEXT NOT NULL CHECK (status IN ('received', 'processing', 'completed', 'failed', 'retrying')),
  processing_step TEXT,
  error_message TEXT,
  error_stack TEXT,
  raw_event JSONB NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_event_id ON webhook_logs(event_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_stripe_session_id ON webhook_logs(stripe_session_id);
CREATE INDEX idx_webhook_logs_customer_email ON webhook_logs(customer_email);

-- Add metadata to payments table for tracking
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS webhook_log_id UUID REFERENCES webhook_logs(id),
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS magic_link_created BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE webhook_logs IS 'Comprehensive logging of all Stripe webhook events for debugging and recovery';
COMMENT ON COLUMN webhook_logs.event_id IS 'Stripe event ID for idempotency';
COMMENT ON COLUMN webhook_logs.processing_step IS 'Last step completed before failure (customer_created, payment_created, email_sent, etc.)';
COMMENT ON COLUMN webhook_logs.retry_count IS 'Number of times this webhook has been retried';
