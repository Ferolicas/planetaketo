-- ============================================================
-- Recetas publicadas (Fase 2) — BD planetaketo.
-- Se rellena con el script scripts/recipes/extract.ts, que estructura
-- (con OpenAI) el contenido REAL de cada vídeo de YouTube de Planeta Keto
-- (descripción + transcripción) en youtube_analytics.
-- La web (/recetas, /recetas/[slug]) y el sitemap leen SOLO de esta tabla.
-- ============================================================
CREATE TABLE IF NOT EXISTS published_recipes (
  video_id            text PRIMARY KEY,                 -- ID de YouTube
  slug                text UNIQUE NOT NULL,             -- URL SEO: /recetas/<slug>
  title               text NOT NULL,                    -- nombre limpio del plato
  summary             text,                             -- 1-2 frases
  category            text,                             -- desayuno, almuerzo, cena, postre, pan, salsa, snack, bebida, guarnicion, ensalada
  ingredients         jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{quantity, item}]
  steps               jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [texto]
  tips                text,
  prep_minutes        integer,
  cook_minutes        integer,
  total_minutes       integer,
  servings            integer,
  nutrition           jsonb,                            -- {calories, protein, fat, netCarbs} por ración (estimado)
  keywords            text[],
  image_url           text,                             -- miniatura maxres de YouTube (>=1200px)
  youtube_url         text,
  video_published_at  timestamptz,
  duration_seconds    integer,
  is_published        boolean NOT NULL DEFAULT true,    -- toggle ocultar/mostrar (panel admin)
  edited              boolean NOT NULL DEFAULT false,   -- TRUE si se editó a mano -> el cron NO lo sobreescribe
  model               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pubrecipes_listing  ON published_recipes (is_published, video_published_at DESC);
CREATE INDEX IF NOT EXISTS idx_pubrecipes_category ON published_recipes (category);
