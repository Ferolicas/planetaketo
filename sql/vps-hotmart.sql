-- ============================================================
-- Planeta Keto — Migración del cobro a Hotmart
-- Ejecutar en la base `planetaketo` del VPS. Idempotente.
-- ============================================================
--
-- El cobro pasa de Stripe a Hotmart (checkout embebido + webhook).
-- La entrega del libro la seguimos haciendo NOSOTROS (Resend + magic link).
--
-- Reutilizamos las columnas existentes de `payments`:
--   stripe_payment_id  -> id externo del pago (Hotmart: transaction)  [clave de idempotencia]
--   stripe_session_id  -> referencia externa secundaria (Hotmart: id del evento)
-- Añadimos `provider` para distinguir el origen del pago.
-- ------------------------------------------------------------

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe';

-- Las filas históricas quedan como 'stripe' (default). Las nuevas de Hotmart
-- se insertan con provider='hotmart' desde finalizeSale().

CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
