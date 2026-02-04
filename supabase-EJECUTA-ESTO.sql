-- PASO 1: Borrar todo lo anterior
DROP TABLE IF EXISTS download_links CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS "homeContent" CASCADE;

-- PASO 2: Crear tabla homeContent con snake_case
CREATE TABLE "homeContent" (
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

-- Insertar valores por defecto
INSERT INTO "homeContent" (id, regular_price, discount_price, discount_percentage)
VALUES ('default', 39.75, 19.75, 50);

-- PASO 3: Crear tablas de clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 4: Crear tabla de pagos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL,
  product_name TEXT,
  magic_link_created BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 5: Crear tabla de enlaces de descarga
CREATE TABLE download_links (
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

-- PASO 6: Crear índices
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_stripe_payment_id ON payments(stripe_payment_id);
CREATE INDEX idx_download_links_token ON download_links(token);
CREATE INDEX idx_download_links_customer_id ON download_links(customer_id);

-- PASO 7: Habilitar Row Level Security
ALTER TABLE "homeContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;

-- PASO 8: Crear políticas de seguridad para homeContent
CREATE POLICY "Enable read access for all users" ON "homeContent"
  FOR SELECT USING (true);

CREATE POLICY "Enable update for service role" ON "homeContent"
  FOR UPDATE USING (true);

CREATE POLICY "Enable insert for service role" ON "homeContent"
  FOR INSERT WITH CHECK (true);

-- PASO 9: Crear políticas para customers
CREATE POLICY "Enable read access for all users" ON customers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON customers
  FOR UPDATE USING (true);

-- PASO 10: Crear políticas para payments
CREATE POLICY "Enable read access for all users" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON payments
  FOR UPDATE USING (true);

-- PASO 11: Crear políticas para download_links
CREATE POLICY "Enable read access for all users" ON download_links
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON download_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role" ON download_links
  FOR UPDATE USING (true);
