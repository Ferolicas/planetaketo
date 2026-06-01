import { NextResponse } from 'next/server';

// ============================================================
// DESHABILITADO — El frontend público NO tiene registro de usuarios.
// El único login del sitio es el panel de administrador (cuenta única,
// gestionada en la tabla `admins`). El acceso de clientes vive en ketoscan.
// (Decisión 3 de la migración: features de usuario/social descartadas.)
// ============================================================
export async function POST() {
  return NextResponse.json(
    { error: 'Registro deshabilitado' },
    { status: 410 }
  );
}
