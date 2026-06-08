/**
 * Test de la lógica pura del webhook de Hotmart (sin DB ni red).
 * Ejecutar: npx tsx scripts/test-hotmart-webhook.ts
 */
import assert from 'node:assert';
import { parseHotmartSale, pickHottok, verifyHottok } from '@/lib/payments/hotmart';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

// Payload realista de PURCHASE_APPROVED (Webhook 2.0)
const approved = {
  id: 'evt-123',
  event: 'PURCHASE_APPROVED',
  version: '2.0.0',
  data: {
    product: { id: 101576748, name: 'El Método Keto Definitivo' },
    buyer: { name: 'María García', email: 'maria@example.com', address: { country: 'ES' } },
    purchase: {
      transaction: 'HP17283746',
      status: 'APPROVED',
      price: { value: 10, currency_value: 'EUR' },
    },
  },
};

console.log('Hotmart webhook — lógica pura');

test('verifyHottok acepta el token correcto', () => {
  assert.strictEqual(verifyHottok('secreto-abc', 'secreto-abc'), true);
});

test('verifyHottok rechaza token incorrecto o vacío', () => {
  assert.strictEqual(verifyHottok('malo', 'secreto-abc'), false);
  assert.strictEqual(verifyHottok('', 'secreto-abc'), false);
  assert.strictEqual(verifyHottok('x', ''), false);
});

test('pickHottok prioriza la cabecera y cae al body', () => {
  assert.strictEqual(pickHottok('from-header', { hottok: 'from-body' }), 'from-header');
  assert.strictEqual(pickHottok(null, { hottok: 'from-body' }), 'from-body');
  assert.strictEqual(pickHottok(undefined, {}), '');
});

test('parseHotmartSale extrae la venta de un PURCHASE_APPROVED', () => {
  const r = parseHotmartSale(approved);
  assert.ok(r.ok, 'debería ser ok');
  if (!r.ok) return;
  assert.strictEqual(r.sale.email, 'maria@example.com');
  assert.strictEqual(r.sale.name, 'María García');
  assert.strictEqual(r.sale.transaction, 'HP17283746');
  assert.strictEqual(r.sale.amount, 10);
  assert.strictEqual(r.sale.currency, 'eur');
  assert.strictEqual(r.sale.country, 'ES');
  assert.strictEqual(r.sale.eventId, 'evt-123');
});

test('parseHotmartSale ignora eventos que no son de aprobación', () => {
  const r = parseHotmartSale({ ...approved, event: 'PURCHASE_REFUNDED' });
  assert.ok(!r.ok && r.reason === 'ignored_event');
});

test('parseHotmartSale ignora otro producto cuando se filtra por id', () => {
  const r = parseHotmartSale(approved, { expectedProductId: '999999' });
  assert.ok(!r.ok && r.reason === 'other_product');
  // y lo acepta cuando coincide
  const ok = parseHotmartSale(approved, { expectedProductId: '101576748' });
  assert.ok(ok.ok);
});

test('parseHotmartSale rechaza payload sin email/transaction', () => {
  const bad = { event: 'PURCHASE_APPROVED', data: { buyer: {}, purchase: {} } };
  const r = parseHotmartSale(bad);
  assert.ok(!r.ok && r.reason === 'missing_fields');
});

test('parseHotmartSale usa transaction como id y nombre por defecto "Cliente"', () => {
  const r = parseHotmartSale({
    event: 'PURCHASE_COMPLETE',
    data: {
      buyer: { email: 'sin-nombre@example.com' },
      purchase: { transaction: 'HP999', price: { value: 10, currency_value: 'EUR' } },
    },
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.strictEqual(r.sale.name, 'Cliente');
  assert.strictEqual(r.sale.country, null);
});

console.log(`\n✅ ${passed} pruebas OK`);
