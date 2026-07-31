import crypto from 'crypto';
import { queryOne } from '@/lib/db';

// ============================================================
// Enlaces mágicos de descarga del libro de PAGO (tabla download_links, pg).
// Límite de 2 descargas + expiración (30 días). El archivo se sirve por
// proxy desde Sanity en /api/download/[token] (no exponemos la URL de Sanity).
// ============================================================

const MAX_DOWNLOADS = 2;

export interface DownloadLinkRow {
  id: string;
  file_name: string | null;
  product_slug: string | null;
  download_count: number;
  max_downloads: number;
  expires_at: string | null;
}

export async function createMagicLink(
  customerId: string,
  paymentId: string,
  fileName: string,
  productSlug: string | null = null,
  maxDownloads: number = MAX_DOWNLOADS
): Promise<{ token: string; downloadUrl: string }> {
  const token = crypto.randomBytes(32).toString('hex');

  const row = await queryOne<{ token: string }>(
    `INSERT INTO download_links
        (customer_id, payment_id, token, file_name, product_slug, download_count, max_downloads, expires_at)
     VALUES ($1, $2, $3, $4, $5, 0, $6, now() + interval '30 days')
     ON CONFLICT (payment_id) WHERE payment_id IS NOT NULL DO UPDATE SET
       file_name = EXCLUDED.file_name,
       product_slug = COALESCE(download_links.product_slug, EXCLUDED.product_slug),
       max_downloads = 2
     RETURNING token`,
    [customerId, paymentId, token, fileName, productSlug, maxDownloads]
  );

  if (!row) throw new Error('No se pudo crear el enlace de descarga');

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://planetaketo.es').replace(/\/$/, '');
  const downloadUrl = `${siteUrl}/download/${row.token}`;
  return { token: row.token, downloadUrl };
}

// Lee el enlace SIN incrementar (validación de solo lectura).
export async function getDownloadLink(
  token: string
): Promise<DownloadLinkRow | null> {
  return queryOne<DownloadLinkRow>(
    `SELECT id, file_name, product_slug, download_count, max_downloads, expires_at
     FROM download_links WHERE token = $1`,
    [token]
  );
}

// Reserva una descarga de forma ATÓMICA. Dos peticiones paralelas nunca pueden
// rebasar el máximo; se llama después de haber obtenido el archivo y justo antes
// de responderlo al cliente.
export async function claimDownload(id: string): Promise<boolean> {
  const claimed = await queryOne<{ id: string }>(
    `UPDATE download_links
     SET download_count = download_count + 1, last_download_at = now()
     WHERE id = $1
       AND download_count < max_downloads
       AND (expires_at IS NULL OR expires_at > now())
     RETURNING id`,
    [id]
  );
  return Boolean(claimed);
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
