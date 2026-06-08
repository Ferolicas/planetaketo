// ============================================================
// Configuración del producto (neutral respecto a la pasarela de pago).
// Antes vivía en lib/stripe/config.ts; se separó al migrar el cobro a Hotmart.
// ============================================================

export const PRODUCT_CONFIG = {
  name: 'Método Keto 70 Días - Planeta Keto',
  description:
    'Acceso completo al método keto definitivo con recetas, calculadoras y listas de compras',
  currency: 'eur',
  pdfFileName: 'El Metodo keto Definitivo - Planeta Keto.pdf',
  bucketName: 'producto',
};
