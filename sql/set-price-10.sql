-- ============================================================
-- Planeta Keto — Precio del libro de PAGO a 10 € (FASE 2)
-- Fuente de verdad del precio = Postgres ("homeContent".discount_price).
-- Sanity NO se usa para el precio (solo para servir el PDF).
-- Ejecutar en la base `planetaketo` del VPS.
-- ============================================================

UPDATE "homeContent"
SET discount_price = 10
WHERE id = 'default';

-- Verificación:
SELECT id, regular_price, discount_price, discount_percentage
FROM "homeContent"
WHERE id = 'default';
