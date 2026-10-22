import type { Metadata } from 'next';
import GraciasClient from './GraciasClient';

export const metadata: Metadata = {
  title: 'Gracias por tu compra | Planeta Keto',
  robots: { index: false, follow: false },
};

// Página de agradecimiento: Stripe y Mercado Pago (PSE/Efecty) redirigen aquí
// tras el pago. Si se abre dentro del modal, avisamos al padre por postMessage;
// si no, se ve como página normal.
export default function GraciasPage() {
  return <GraciasClient />;
}
