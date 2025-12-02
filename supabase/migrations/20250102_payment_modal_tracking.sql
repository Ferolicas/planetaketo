-- Create table for tracking payment modal interactions
CREATE TABLE IF NOT EXISTS payment_modal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('modal_opened', 'payment_started', 'payment_completed', 'payment_failed', 'modal_closed')),
  customer_email TEXT,
  customer_name TEXT,
  amount DECIMAL(10, 2),
  currency TEXT,
  payment_intent_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_modal_events_email ON payment_modal_events(customer_email);
CREATE INDEX idx_payment_modal_events_type ON payment_modal_events(event_type);
CREATE INDEX idx_payment_modal_events_created_at ON payment_modal_events(created_at DESC);
CREATE INDEX idx_payment_modal_events_payment_intent ON payment_modal_events(payment_intent_id);

COMMENT ON TABLE payment_modal_events IS 'Tracking de interacciones con el modal de pago para analytics y conversión';
COMMENT ON COLUMN payment_modal_events.event_type IS 'Tipo de evento: modal_opened, payment_started, payment_completed, payment_failed, modal_closed';
