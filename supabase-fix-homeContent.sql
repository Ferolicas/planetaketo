-- Create homeContent table if it doesn't exist
CREATE TABLE IF NOT EXISTS "homeContent" (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image TEXT,
  product_id TEXT,
  regular_price DECIMAL(10, 2) DEFAULT 39.75,
  discount_price DECIMAL(10, 2) DEFAULT 19.75,
  discount_percentage INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values if table is empty
INSERT INTO "homeContent" (id, regular_price, discount_price, discount_percentage)
VALUES ('default', 39.75, 19.75, 50)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE "homeContent" ENABLE ROW LEVEL SECURITY;

-- Create policy for homeContent (public read access)
DROP POLICY IF EXISTS "Enable read access for all users" ON "homeContent";
CREATE POLICY "Enable read access for all users" ON "homeContent"
  FOR SELECT USING (true);

-- Create policy for updates (service role only)
DROP POLICY IF EXISTS "Enable update for service role" ON "homeContent";
CREATE POLICY "Enable update for service role" ON "homeContent"
  FOR UPDATE USING (true);

-- Create policy for inserts (service role only)
DROP POLICY IF EXISTS "Enable insert for service role" ON "homeContent";
CREATE POLICY "Enable insert for service role" ON "homeContent"
  FOR INSERT WITH CHECK (true);
