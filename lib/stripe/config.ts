import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const PRODUCT_CONFIG = {
  name: 'Método Keto 70 Días - Planeta Keto',
  description: 'Acceso completo al método keto definitivo con recetas, calculadoras y listas de compras',
  currency: 'eur',
  pdfFileName: 'El Metodo keto Definitivo - Planeta Keto.pdf',
  bucketName: 'producto',
};
