import assert from 'node:assert/strict';
import {
  PaymentConfirmationTimeoutError,
  withPaymentConfirmationTimeout,
} from '../lib/payments/promise-timeout';

// El módulo de Mercado Pago comparte el pool de la app. Estas pruebas no abren
// conexiones, pero el constructor necesita una URL bien formada al importarlo.
process.env.DATABASE_URL ||= 'postgresql://qa:qa@127.0.0.1:5432/qa';
process.env.RESEND_API_KEY ||= 're_qa_payment_reliability';

async function main() {
  const {
    finalizeMpPayment,
    verifyMpPaymentProvenance,
    MP_INTEGRATION_ID,
  } = await import('../lib/payments/mercadopago');

  const reference = '3a9c90bf-3cd4-4e45-b9d9-58a915af4db1';
  const validPayment = {
  id: '123456789',
  status: 'approved',
  live_mode: true,
  transaction_amount: 99_600,
  currency_id: 'COP',
  external_reference: reference,
  payer: { email: 'qa@example.com' },
  metadata: {
    integration: MP_INTEGRATION_ID,
    product_slug: 'metodo-keto',
    expected_amount_cop: 99_600,
  },
  };

  assert.deepEqual(verifyMpPaymentProvenance(validPayment), {
    ok: true,
    productSlug: 'metodo-keto',
    productName: 'Método Keto 70 Días',
  });

  for (const [name, changed, expectedReason] of [
    ['integración ajena', { metadata: { ...validPayment.metadata, integration: 'otra-app' } }, 'wrong_integration'],
    ['modo de prueba', { live_mode: false }, 'not_live'],
    ['referencia inválida', { external_reference: 'manual' }, 'invalid_reference'],
    ['moneda incorrecta', { currency_id: 'USD' }, 'wrong_currency'],
    ['producto desconocido', { metadata: { ...validPayment.metadata, product_slug: 'inventado' } }, 'unknown_product'],
    ['importe manipulado', { transaction_amount: 100 }, 'amount_mismatch'],
  ] as const) {
    const result = verifyMpPaymentProvenance({ ...validPayment, ...changed });
    assert.deepEqual(result, { ok: false, reason: expectedReason }, name);
  }

  const foreignResult = await finalizeMpPayment({
    ...validPayment,
    metadata: { ...validPayment.metadata, integration: 'otra-app' },
  });
  assert.deepEqual(foreignResult, {
    status: 'skipped',
    reason: 'mp_untrusted_wrong_integration',
  });

  assert.equal(await withPaymentConfirmationTimeout(Promise.resolve('ok'), 50), 'ok');
  await assert.rejects(
    withPaymentConfirmationTimeout(new Promise<never>(() => undefined), 10),
    PaymentConfirmationTimeoutError
  );

  console.log('✅ Payment reliability: timeout y procedencia verificada');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
