# QA de pagos — 2026-10-07

Alcance: Stripe (Europa), Mercado Pago (Colombia), Hotmart (resto), webhooks,
postventa y reconciliación. Entorno: producción `https://planetaketo.es`, sin
cargos reales y sin modificar datos de clientes.

## Veredicto

Los dos fallos críticos encontrados quedaron **corregidos y validados en el
código**, sin cargos reales:

1. Stripe ya no puede quedar en `Procesando…` indefinidamente. Valida primero el
   Payment Element, muestra aviso a los 15 s y, si la confirmación supera 90 s,
   pasa a “Pago en proceso” sin habilitar un segundo cobro ciego. La regresión
   E2E retuvo `POST /payment_intents/.../confirm`, adelantó el reloj y comprobó
   aviso, estado pendiente y ausencia del botón bloqueado.
2. Mercado Pago diferencia Webhook firmado de IPN. En ambos casos consulta el
   pago por API y solo entrega si la cuenta devuelve marca de Planeta Keto,
   referencia UUID, producto conocido, modo LIVE, COP e importe exacto. El cron
   busca además pagos aprobados recientes y rescata cualquiera que haya perdido
   todos sus callbacks.

No existe evidencia de un pago aprobado de Planeta Keto perdido en la base de
datos, pero tampoco existe una prueba aprobada completa reciente de Stripe o
Mercado Pago. Las credenciales instaladas son LIVE y no hay credenciales sandbox,
por lo que no se hizo ningún cargo para fabricar esa evidencia.

Estado al cerrar este informe: corrección publicada en `main` mediante
`4452f3c`; producción conserva el comportamiento anterior hasta ejecutar el
deploy manual.

## Hallazgos

| Nº | Severidad | Flujo | Evidencia | Resultado |
|---|---|---|---|---|
| 1 | CRÍTICO | Stripe: pulsar Pagar con red/pasarela que no responde | Repro original confirmado. Tras corregir, la misma confirmación retenida muestra aviso y termina en estado pendiente; nunca habilita un segundo cobro. | PASS local / deploy pendiente |
| 2 | CRÍTICO | Mercado Pago: confirmación asíncrona | Ya no devuelve 401 por una IPN: consulta el pago a MP y exige procedencia/importe server-side. El cron añade recuperación independiente del callback. | PASS local / deploy pendiente |
| 3 | ALTO | Aprobación E2E Stripe | API Stripe, snapshot inicial 90 días: 20 intents, 0 `succeeded`; 19 `requires_payment_method`, 1 cancelado, 2 con rechazo de tarjeta. Los dos registros Stripe de la BD no existen en el Stripe LIVE actual y uno está marcado como prueba. | NOT_RUN / sin evidencia real |
| 4 | ALTO | Aprobación E2E Mercado Pago | En 180 días aparecen 3 intentos identificados como Planeta Keto: los tres PSE fueron rechazados con `bank_error` en junio. No hay pago Planeta aprobado ni registro MP en la BD para verificar el ciclo completo. | NOT_RUN / sin evidencia real |
| 5 | MEDIO | Observabilidad del embudo | En 90 días hay 19 sesiones `checkout_iniciado_no_completado` y 0 `venta_completada`, aunque la BD contiene ventas históricas. No permite distinguir abandono comercial de fallo técnico por proveedor. | FAIL |
| 6 | BAJO | Consola de páginas públicas | Cada ficha pública solicita `/api/auth/me` por el `AuthProvider` global y recibe 401; no bloquea el pago, pero añade ruido y una petición innecesaria. | FAIL no bloqueante |

## Cobertura que sí pasó

- Home HTTPS 200; `www` redirige 301 al canónico; PM2 online y sin reinicios.
- Región/precio: Stripe ES 24,90 EUR, Mercado Pago CO 91.500 COP y Hotmart PE
  104 PEN respondieron correctamente para `metodo-keto`.
- Stripe: Payment Element LIVE visible en móvil y escritorio; importe correcto;
  email y métodos presentes. Al pulsar Pagar con tarjeta incompleta muestra la
  validación y vuelve a habilitar el botón. Con la confirmación retenida, el
  aviso y el cambio a pendiente pasaron la regresión E2E.
- Mercado Pago: Payment Brick visible con crédito, débito, PSE y Efecty.
- Hotmart: checkout embebido visible para producto individual y mega pack; los
  31 enlaces del catálogo respondieron correctamente y son únicos.
- Entradas inválidas: checkout y webhooks devuelven 4xx/204 controlados, nunca
  500.
- Sondas firmadas y sin efecto económico: Stripe 200 en evento ignorado,
  Hotmart 200 en evento no aprobatorio y Mercado Pago 200 consultando un pago ya
  rechazado (`skipped`).
- Hotmart: 9/9 pruebas puras del webhook; catálogo 25 productos + 6 packs.
- Regresiones permanentes: timeout Stripe y seis rechazos de procedencia MP
  (otra integración, sandbox, referencia, moneda, producto e importe).
- Postventa: 3 pagos Hotmart y 2 registros Stripe históricos tienen enlace,
  correo, newsletter, Ketoscan y `delivery_status=completed`; 0 pendientes.
- Reconciliador instalado cada 5 minutos.
- `git diff --check`, `pnpm exec tsc --noEmit` y `pnpm build`: PASS.

## Límite de la prueba

No se confirmó una transacción aprobada porque producción solo tiene
credenciales LIVE. Una prueba completa segura requiere credenciales sandbox de
Stripe y Mercado Pago, y compra de prueba de productor en Hotmart. Hasta entonces,
Stripe y Mercado Pago quedan `NOT_RUN` desde autorización hasta webhook y entrega;
presentarlos como E2E aprobados sería incorrecto.

## Seguimiento pendiente

1. Desplegar el commit y repetir smoke tests, PM2 y callbacks en producción.
2. Montar sandbox y automatizar tarjeta aprobada/rechazada/3DS, PSE pendiente→
   aprobado y Hotmart aprobado→entrega para los 31 productos. Es la única forma
   de cubrir autorización real sin arriesgar dinero LIVE.
3. Corregir la analítica del embudo y eliminar la consulta pública innecesaria a
   `/api/auth/me`; son hallazgos no bloqueantes y no causan pérdida del cobro.
