-- Note: Run supabase-fix-homeContent.sql first to create the homeContent table

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL,
  product_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create download_links table
CREATE TABLE IF NOT EXISTS download_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 2,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_download_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_id ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_download_links_token ON download_links(token);
CREATE INDEX IF NOT EXISTS idx_download_links_customer_id ON download_links(customer_id);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
CREATE POLICY "Enable read access for all users" ON customers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for service role" ON customers;
CREATE POLICY "Enable insert for service role" ON customers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for service role" ON customers;
CREATE POLICY "Enable update for service role" ON customers
  FOR UPDATE USING (true);

-- Create policies for payments
DROP POLICY IF EXISTS "Enable read access for all users" ON payments;
CREATE POLICY "Enable read access for all users" ON payments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for service role" ON payments;
CREATE POLICY "Enable insert for service role" ON payments
  FOR INSERT WITH CHECK (true);

-- Create policies for download_links
DROP POLICY IF EXISTS "Enable read access for all users" ON download_links;
CREATE POLICY "Enable read access for all users" ON download_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for service role" ON download_links;
CREATE POLICY "Enable insert for service role" ON download_links
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for service role" ON download_links;
CREATE POLICY "Enable update for service role" ON download_links
  FOR UPDATE USING (true);
