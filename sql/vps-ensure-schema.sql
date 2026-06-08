-- ============================================================
-- Planeta Keto — Asegurar el esquema que usa el cobro (idempotente)
-- Ejecutar en la base `planetaketo` del VPS.
--
-- Pensado para BDs cargadas a mano que pueden divergir de lo que insertan
-- finalizeSale() (tablas customers/payments + newsletter/ketoscan_accounts) y
-- createMagicLink() (download_links). Añade SOLO lo que falte; no borra nada.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

BEGIN;

-- ---- customers ----
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS country            text;
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS updated_at         timestamptz DEFAULT now();
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS created_at         timestamptz DEFAULT now();

-- ---- payments ----
ALTER TABLE payments       ADD COLUMN IF NOT EXISTS provider           text NOT NULL DEFAULT 'stripe';
ALTER TABLE payments       ADD COLUMN IF NOT EXISTS stripe_session_id  text;
ALTER TABLE payments       ADD COLUMN IF NOT EXISTS product_name       text;
ALTER TABLE payments       ADD COLUMN IF NOT EXISTS magic_link_created boolean DEFAULT false;
ALTER TABLE payments       ADD COLUMN IF NOT EXISTS email_sent         boolean DEFAULT false;
ALTER TABLE payments       ADD COLUMN IF NOT EXISTS email_sent_at      timestamptz;
ALTER TABLE payments       ADD COLUMN IF NOT EXISTS created_at         timestamptz DEFAULT now();

-- ---- download_links ----
ALTER TABLE download_links ADD COLUMN IF NOT EXISTS file_name        text;
ALTER TABLE download_links ADD COLUMN IF NOT EXISTS download_count   integer DEFAULT 0;
ALTER TABLE download_links ADD COLUMN IF NOT EXISTS max_downloads    integer DEFAULT 2;
ALTER TABLE download_links ADD COLUMN IF NOT EXISTS expires_at       timestamptz;
ALTER TABLE download_links ADD COLUMN IF NOT EXISTS last_download_at timestamptz;
ALTER TABLE download_links ADD COLUMN IF NOT EXISTS created_at       timestamptz DEFAULT now();

-- ---- newsletter (efecto post-pago) ----
CREATE TABLE IF NOT EXISTS newsletter (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL UNIQUE,
  name         text,
  product_name text,
  created_at   timestamptz DEFAULT now()
);

-- ---- ketoscan_accounts (efecto post-pago) ----
CREATE TABLE IF NOT EXISTS ketoscan_accounts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                text UNIQUE NOT NULL,
  password_hash        text NOT NULL,
  must_change_password boolean DEFAULT true,
  theme                text DEFAULT 'light',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

COMMIT;
