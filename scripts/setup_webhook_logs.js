import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupWebhookLogs() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create webhook_logs table
    await client.query(`
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
    `);
    console.log('✅ Created webhook_logs table');

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_webhook_logs_stripe_session_id ON webhook_logs(stripe_session_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_webhook_logs_customer_email ON webhook_logs(customer_email);');
    console.log('✅ Created indexes');

    // Alter payments table
    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS webhook_log_id UUID REFERENCES webhook_logs(id),
      ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS magic_link_created BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Updated payments table');

    console.log('\n🎉 Webhook logs system ready!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

setupWebhookLogs();
