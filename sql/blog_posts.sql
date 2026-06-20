-- ============================================================
-- Blogs informativos (Fase 3) — BD planetaketo.
-- n8n genera 1 borrador/día (estructurado por Groq desde una fuente médica REAL
-- de PubMed) vía POST /api/blog/ingest -> status='draft'. Ferney revisa/edita y
-- publica desde /admin (status='published'). La web /blog lee solo los publicados.
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id           bigserial PRIMARY KEY,
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  summary      text,                          -- meta description / extracto
  content      text NOT NULL,                 -- cuerpo en Markdown
  category     text,                          -- ciencia, nutricion, salud, perdida-de-peso, mitos, principiantes
  keywords     text[],
  source_name  text,                          -- p.ej. "Smith et al., Am J Clin Nutr (2024)"
  source_url   text,                          -- enlace a PubMed / estudio
  hero_image   text,
  status       text NOT NULL DEFAULT 'draft', -- draft | published
  author       text NOT NULL DEFAULT 'Planeta Keto',
  model        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_category  ON blog_posts (category);
