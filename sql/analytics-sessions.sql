-- ============================================================
-- Planeta Keto — Analítica web nativa RGPD (sesiones + consentimiento)
-- Ejecutar en la base `planetaketo` del VPS. Idempotente.
-- ============================================================
-- Sistema 100% propio: ningún dato sale a terceros. NO se almacena la IP.
-- El país se obtiene del header CF-IPCountry (o geo por IP en memoria, que se
-- descarta tras deducir el país). El identificador de sesión es un UUID aleatorio
-- de cookie de 1ª parte (pk_sid), jamás derivado de la IP.
--
-- Cumple: RGPD, LSSI-CE art. 22.2 y Guía de Cookies AEPD (mayo 2024).
-- Retención: 14 meses (borrado automático vía scripts/analytics/cleanup.ts).
-- ------------------------------------------------------------

-- ----- Una fila por VISITA -----------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id                uuid PRIMARY KEY,                 -- UUID de cookie pk_sid (no derivado de IP)
  country           text,                             -- ISO-2 (CO, ES, MX...). NUNCA la IP.
  traffic_source    text,                             -- tiktok|youtube|instagram|google|referral|direct
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  referrer_host     text,                             -- solo el host del referrer (sin querystring)
  entered_at        timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz NOT NULL DEFAULT now(),
  duration_seconds  integer NOT NULL DEFAULT 0,       -- tiempo ACTIVO acumulado (pausa al perder foco)
  sections_viewed   text[]  NOT NULL DEFAULT '{}',    -- hero, antes_despues, por_que, testimonios, precio, cta_final
  buttons_clicked   text[]  NOT NULL DEFAULT '{}',    -- comprar_ahora, quiero_mi_metodo, empezar_ahora, ...
  pages_viewed      integer NOT NULL DEFAULT 1,
  transaction_state text NOT NULL DEFAULT 'sin_checkout', -- sin_checkout|checkout_iniciado_no_completado|venta_completada
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_entered   ON analytics_sessions (entered_at);
CREATE INDEX IF NOT EXISTS idx_sessions_country   ON analytics_sessions (country);
CREATE INDEX IF NOT EXISTS idx_sessions_txstate   ON analytics_sessions (transaction_state);
CREATE INDEX IF NOT EXISTS idx_sessions_source    ON analytics_sessions (traffic_source);

-- ----- Registro de consentimiento (accountability AEPD) ------------------
-- Demuestra QUÉ se consintió y CUÁNDO. Sin IP ni user-agent (minimización).
CREATE TABLE IF NOT EXISTS analytics_consent (
  id             bigserial PRIMARY KEY,
  consent_id     uuid,                                -- valor de la cookie pk_consent
  decision       text NOT NULL,                       -- accept_all | reject_all | custom
  analytics      boolean NOT NULL DEFAULT false,      -- ¿aceptó la analítica de comportamiento?
  policy_version text,                                -- versión del texto del CMP aceptado
  country        text,                                -- ISO-2 (sin IP)
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_created ON analytics_consent (created_at);
CREATE INDEX IF NOT EXISTS idx_consent_cid     ON analytics_consent (consent_id);
