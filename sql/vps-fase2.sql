-- ============================================================
-- Planeta Keto — Migración a VPS · FASE 2 (cobro + entrega)
-- Ejecutar en la base `planetaketo` del VPS. Idempotente.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- ------------------------------------------------------------
-- Newsletter: se alimenta en cada compra confirmada (TASK 3a).
-- (El envío de campañas lo gestiona el usuario aparte.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS newsletter (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email        text NOT NULL,
  name         text,
  product_name text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (email)
);

-- ------------------------------------------------------------
-- Cuentas de ketoscan: alta automática al confirmarse el pago (TASK 3c).
-- Contraseña inicial genérica (bcrypt) + must_change_password.
-- La app ketoscan usa esta tabla para login multiusuario.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ketoscan_accounts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                text UNIQUE NOT NULL,
  password_hash        text NOT NULL,
  must_change_password boolean DEFAULT true,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- ------------------------------------------------------------
-- Expiración para los enlaces del libro de PAGO (download_links).
-- Nullable: los enlaces antiguos (sin valor) NO expiran; los nuevos
-- se crean con 30 días. El límite de 2 descargas se mantiene.
-- ------------------------------------------------------------
ALTER TABLE download_links ADD COLUMN IF NOT EXISTS expires_at timestamptz;
