import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Recolector de violaciones de CSP (modo Report-Only). El navegador hace POST
// aquí cuando algo incumpliría la política; lo registramos (pm2 logs) para poder
// AJUSTAR la CSP antes de activarla en enforce. No expone nada ni rompe nada.
// ============================================================

export async function POST(req: NextRequest) {
  // Evita que un atacante inunde los logs con reportes falsos.
  const limited = enforceRateLimit(req, 'csp-report', 60, 60_000);
  if (limited) return new NextResponse(null, { status: 204 });

  try {
    const body = (await req.json()) as {
      'csp-report'?: Record<string, unknown>;
      // Reporting API moderna envía un array bajo otra forma; toleramos ambas.
      [k: string]: unknown;
    };
    const r = (body['csp-report'] ?? body) as Record<string, unknown>;
    const directive = r['violated-directive'] ?? r['effectiveDirective'] ?? '?';
    const blocked = r['blocked-uri'] ?? r['blockedURL'] ?? '?';
    const doc = r['document-uri'] ?? r['documentURL'] ?? '?';
    console.warn(`[csp] violación: ${directive} | blocked=${blocked} | doc=${doc}`);
  } catch {
    /* reporte ilegible: lo ignoramos */
  }
  return new NextResponse(null, { status: 204 });
}
