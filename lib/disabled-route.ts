import { NextResponse } from 'next/server';

// Stub para rutas de la generación vieja (CMS/social/chat antiguo) retiradas
// en la migración a VPS (decisión 3). No tocan datos; devuelven 410 Gone.
export function disabledRoute() {
  return NextResponse.json(
    { error: 'Esta función fue retirada en la migración a VPS.' },
    { status: 410 }
  );
}
