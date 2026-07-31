BEGIN;

DROP INDEX IF EXISTS idx_payments_delivery_pending;
DROP INDEX IF EXISTS uq_download_links_payment_id;

ALTER TABLE payments
  DROP COLUMN IF EXISTS fulfillment_completed_at,
  DROP COLUMN IF EXISTS ketoscan_created,
  DROP COLUMN IF EXISTS newsletter_synced,
  DROP COLUMN IF EXISTS delivery_error,
  DROP COLUMN IF EXISTS last_delivery_attempt_at,
  DROP COLUMN IF EXISTS delivery_attempts,
  DROP COLUMN IF EXISTS delivery_status;

COMMIT;
