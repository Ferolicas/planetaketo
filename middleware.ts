import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ════════════════════════════════════════════════════════════════════════════
// Doorway pages eliminadas (mayo 2026). Estas rutas viejas devuelven 410 Gone
// para que Google las DESINDEXE rápido y entienda que se fueron a propósito.
// NUNCA redirigir a la home: eso es soft-404 y Google lo penaliza.
//
// IMPORTANTE: `/recetas` y `/blog` ya están VIVOS (Fases 2 y 3): se sirven desde
// la app (200 si el slug existe, 404 si no). Aquí quedan solo las rutas del sitio
// viejo que NO se reutilizan.
// ════════════════════════════════════════════════════════════════════════════
const GONE_PATTERNS: RegExp[] = [
  /^\/tienda(\/|$)/,
  /^\/foro(\/|$)/,
  /^\/perfil(\/|$)/,
  /^\/register(\/|$)/,
  /^\/success(\/|$)/,
];

const GONE_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Contenido no disponible · Planeta Keto</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FAF7F0;color:#14532D;font-family:system-ui,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;text-align:center;padding:24px}.box{max-width:520px}h1{font-size:1.6rem;margin:0 0 .5rem}p{color:#3f6212;line-height:1.6;margin:0}a{display:inline-block;margin-top:1.25rem;background:#F59E0B;color:#14532D;font-weight:600;text-decoration:none;padding:.7rem 1.4rem;border-radius:9999px}</style></head><body><div class="box"><h1>Esta página ya no existe</h1><p>El contenido que buscabas se eliminó. Descubre el método keto definitivo, recetas reales y mucho más en nuestra página principal.</p><a href="/">Ir a Planeta Keto →</a></div></body></html>`;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CRITICAL: nunca tocar rutas de API. El webhook de Hotmart DEBE recibir
  // respuestas directas, no redirecciones ni 410.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Doorway pages muertas -> 410 Gone (desindexación rápida y correcta).
  if (GONE_PATTERNS.some((re) => re.test(pathname))) {
    return new NextResponse(GONE_HTML, {
      status: 410,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto estáticos:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
