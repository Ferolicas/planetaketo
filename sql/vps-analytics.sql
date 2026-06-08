-- ============================================================
-- Planeta Keto — Analítica propia (visitas + clics a comprar)
-- Ejecutar en la base `planetaketo` del VPS. Idempotente.
-- ============================================================
-- Eventos mínimos para medir el embudo real:
--   type='pageview'        -> una carga de página pública
--   type='checkout_click'  -> clic en un botón "Comprar" (abre el modal Hotmart)
-- visitor_id = cookie anónima (pk_vid) para contar visitantes únicos.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics_events (
  id         bigserial PRIMARY KEY,
  type       text NOT NULL,
  path       text,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_type_created ON analytics_events (type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_created      ON analytics_events (created_at);
