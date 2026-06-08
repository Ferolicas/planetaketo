-- ============================================================
-- Planeta Keto — Extras del panel admin (idempotente)
--   1) Asegura homeContent (precios admin <-> landing realmente conectados)
--   2) leads.country para mostrar la bandera en la lista de descargas gratis
-- Ejecutar en la base `planetaketo` del VPS.
-- ============================================================

-- 1) homeContent: tabla + columnas + fila 'default' (no pisa datos existentes)
CREATE TABLE IF NOT EXISTS "homeContent" (
  id                  text PRIMARY KEY DEFAULT 'default',
  logo                text,
  hero_title          text,
  hero_subtitle       text,
  hero_image          text,
  product_id          text,
  regular_price       numeric(10,2) DEFAULT 39.75,
  discount_price      numeric(10,2) DEFAULT 19.75,
  discount_percentage integer       DEFAULT 50,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE "homeContent" ADD COLUMN IF NOT EXISTS regular_price       numeric(10,2) DEFAULT 39.75;
ALTER TABLE "homeContent" ADD COLUMN IF NOT EXISTS discount_price      numeric(10,2) DEFAULT 19.75;
ALTER TABLE "homeContent" ADD COLUMN IF NOT EXISTS discount_percentage integer       DEFAULT 50;

INSERT INTO "homeContent" (id, regular_price, discount_price, discount_percentage)
VALUES ('default', 39.75, 19.75, 50)
ON CONFLICT (id) DO NOTHING;

-- 2) País del lead (bandera en la lista de descargas gratis)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country text;
