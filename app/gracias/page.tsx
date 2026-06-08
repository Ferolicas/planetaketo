import type { Metadata } from 'next';
import GraciasClient from './GraciasClient';

export const metadata: Metadata = {
  title: 'Gracias por tu compra | Planeta Keto',
  robots: { index: false, follow: false },
};

// Página de "obrigado"/agradecimiento configurada como thank-you page del
// producto en Hotmart. Tras la aprobación, el checkout (dentro de nuestro
// iframe, en nuestro dominio) navega aquí; avisamos al modal padre por
// postMessage. Si Hotmart navega a nivel superior, se ve como página normal.
export default function GraciasPage() {
  return <GraciasClient />;
}
