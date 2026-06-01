-- ============================================================
-- Planeta Keto — Migración a VPS: tablas nuevas (snake_case)
-- Ejecutar en la base `planetaketo` del VPS.
-- Idempotente: se puede correr varias veces sin romper nada.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- ------------------------------------------------------------
-- FASE 1 — Auth de administrador (decisión 4)
-- Reemplaza el login que antes iba contra la tabla muerta "User".
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name          text,
  role          text DEFAULT 'admin',
  image         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Migrar la fila admin de la tabla muerta "User" (conserva el mismo id
-- para no invalidar la cookie de sesión existente). Solo si "User" existe.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'User'
  ) THEN
    INSERT INTO admins (id, email, password_hash, name, role, image)
    SELECT id, lower(email), password, name,
           COALESCE(NULLIF(role, ''), 'admin'), image
    FROM "User"
    WHERE email IS NOT NULL AND password IS NOT NULL
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;

-- ------------------------------------------------------------
-- FASE 1 — Subidas de imágenes del admin (reemplazo de Supabase Storage)
-- Los archivos viven en disco del VPS; aquí solo el registro.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uploads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url        text NOT NULL,
  name       text,
  size       integer,
  mime_type  text,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------------------------------------
-- Nota: las tablas VIVAS ya migradas (no se tocan aquí):
--   payments, customers, leads, download_tokens, download_links,
--   home_settings, "homeContent"
-- Las tablas PascalCase muertas se ignoran (no borrar todavía).
-- ============================================================
