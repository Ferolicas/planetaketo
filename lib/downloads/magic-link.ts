import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';

// ============================================================
// Enlaces mágicos de descarga del libro de PAGO (tabla download_links, pg).
// Límite de 2 descargas + expiración (30 días). El archivo se sirve por
// proxy desde Sanity en /api/download/[token] (no exponemos la URL de Sanity).
// ============================================================

const MAX_DOWNLOADS = 2;

export interface DownloadLinkRow {
  id: string;
  file_name: string | null;
  download_count: number;
  max_downloads: number;
  expires_at: string | null;
}

export async function createMagicLink(
  customerId: string,
  paymentId: string,
  fileName: string
): Promise<{ token: string; downloadUrl: string }> {
  const token = crypto.randomBytes(32).toString('hex');

  const row = await queryOne<{ token: string }>(
    `INSERT INTO download_links
        (customer_id, payment_id, token, file_name, download_count, max_downloads, expires_at)
     VALUES ($1, $2, $3, $4, 0, $5, now() + interval '30 days')
     RETURNING token`,
    [customerId, paymentId, token, fileName, MAX_DOWNLOADS]
  );

  if (!row) throw new Error('No se pudo crear el enlace de descarga');

  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/download/${row.token}`;
  return { token: row.token, downloadUrl };
}

// Lee el enlace SIN incrementar (validación de solo lectura).
export async function getDownloadLink(
  token: string
): Promise<DownloadLinkRow | null> {
  return queryOne<DownloadLinkRow>(
    `SELECT id, file_name, download_count, max_downloads, expires_at
     FROM download_links WHERE token = $1`,
    [token]
  );
}

// Incrementa el contador tras una descarga exitosa.
export async function incrementDownload(id: string): Promise<void> {
  await query(
    `UPDATE download_links
     SET download_count = download_count + 1, last_download_at = now()
     WHERE id = $1`,
    [id]
  );
}

export function isDownloadUsable(link: DownloadLinkRow): {
  ok: boolean;
  reason?: 'limit' | 'expired';
} {
  if (link.download_count >= link.max_downloads) return { ok: false, reason: 'limit' };
  if (link.expires_at && new Date() > new Date(link.expires_at)) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true };
}
