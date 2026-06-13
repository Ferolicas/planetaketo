import Stripe from 'stripe';

// ============================================================
// Cliente de Stripe (server-side). Cobro para el RESTO DEL MUNDO (EUR).
// Colombia va por Mercado Pago (ver lib/payments/mercadopago.ts).
//
// Inicialización perezosa: NO construimos el cliente en import-time (Next importa
// las rutas durante el build y la clave puede no estar presente entonces). Se
// construye en la primera llamada en runtime; las rutas comprueban
// isStripeConfigured() antes. Sin apiVersion explícita: usamos la fijada por el
// SDK para evitar desajustes de tipos en cada actualización.
// ============================================================

let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
    _stripe = new Stripe(key, {
      appInfo: { name: 'Planeta Keto', url: 'https://planetaketo.es' },
    });
  }
  return _stripe;
}
