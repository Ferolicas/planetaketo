import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Registro de consentimiento (accountability AEPD): guarda QUÉ se decidió y
// CUÁNDO, para poder demostrarlo. NO almacena IP ni user-agent (minimización).
// El país se toma de CF-IPCountry si está disponible (sin IP).
// ============================================================

const Schema = z.object({
  consentId: z.string().uuid(),
  decision: z.enum(['accept_all', 'reject_all', 'custom']),
  analytics: z.boolean(),
  policyVersion: z.string().max(32),
});

const ok = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return ok();
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return ok();
  const c = parsed.data;

  const cc = req.headers.get('cf-ipcountry')?.toUpperCase() ?? '';
  const country = /^[A-Z]{2}$/.test(cc) && cc !== 'XX' && cc !== 'T1' ? cc : null;

  try {
    await query(
      `INSERT INTO analytics_consent (consent_id, decision, analytics, policy_version, country)
       VALUES ($1, $2, $3, $4, $5)`,
      [c.consentId, c.decision, c.analytics, c.policyVersion, country]
    );
  } catch (err) {
    console.error('[consent] insert error:', (err as Error).message);
  }

  return ok();
}
