-- Add tracking fields to payments table for email and magic link status
-- These fields are used by the complete-purchase API to track delivery status

-- Add magic_link_created field
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS magic_link_created BOOLEAN DEFAULT FALSE;

-- Add email tracking fields
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Add index for finding payments that need email retry
CREATE INDEX IF NOT EXISTS idx_payments_email_not_sent
ON payments(email_sent)
WHERE email_sent = FALSE;

-- Add UPDATE policy for payments table (required for tracking updates)
DROP POLICY IF EXISTS "Enable update for service role" ON payments;
CREATE POLICY "Enable update for service role" ON payments
  FOR UPDATE USING (true);

-- Add comments for documentation
COMMENT ON COLUMN payments.magic_link_created IS 'Whether a magic download link has been created for this payment';
COMMENT ON COLUMN payments.email_sent IS 'Whether the purchase confirmation email was sent successfully';
COMMENT ON COLUMN payments.email_sent_at IS 'Timestamp when the confirmation email was sent';
