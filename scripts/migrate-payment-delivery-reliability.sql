BEGIN;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS delivery_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_delivery_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_error text,
  ADD COLUMN IF NOT EXISTS newsletter_synced boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ketoscan_created boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fulfillment_completed_at timestamptz;

-- Un pago solo puede tener un enlace oficial. Esto hace idempotente la creación
-- incluso cuando dos webhooks del mismo proveedor llegan al mismo tiempo.
CREATE UNIQUE INDEX IF NOT EXISTS uq_download_links_payment_id
  ON download_links (payment_id)
  WHERE payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_delivery_pending
  ON payments (last_delivery_attempt_at NULLS FIRST, created_at)
  WHERE delivery_status <> 'completed';

-- La regla comercial es dos descargas tanto para un libro como para un pack.
UPDATE download_links
SET
  download_count = COALESCE(download_count, 0),
  max_downloads = 2
WHERE download_count IS NULL OR max_downloads IS DISTINCT FROM 2;

-- Conserva correctamente el estado de las ventas históricas.
UPDATE payments p
SET
  newsletter_synced = EXISTS (
    SELECT 1
    FROM customers c
    JOIN newsletter n ON lower(n.email) = lower(c.email)
    WHERE c.id = p.customer_id
  ),
  ketoscan_created = EXISTS (
    SELECT 1
    FROM customers c
    JOIN ketoscan_accounts k ON lower(k.email) = lower(c.email)
    WHERE c.id = p.customer_id
  );

UPDATE payments
SET
  delivery_status = CASE
    WHEN COALESCE(magic_link_created, false)
      AND COALESCE(email_sent, false)
      AND newsletter_synced
      AND ketoscan_created
    THEN 'completed'
    ELSE 'pending'
  END,
  fulfillment_completed_at = CASE
    WHEN COALESCE(magic_link_created, false)
      AND COALESCE(email_sent, false)
      AND newsletter_synced
      AND ketoscan_created
    THEN COALESCE(email_sent_at, created_at)
    ELSE NULL
  END;

COMMIT;
