import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

// Las imágenes del admin se guardan en disco del VPS (servidas por Caddy),
// ya NO en Supabase Storage. Configurable por entorno.
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
const PUBLIC_BASE = process.env.UPLOAD_PUBLIC_BASE || '/uploads';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const fileName = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, fileName), buffer);

    const url = `${PUBLIC_BASE.replace(/\/$/, '')}/${fileName}`;

    // Registro opcional (no falla la subida si la tabla aún no existe)
    let id: string | null = null;
    try {
      const row = await query<{ id: string }>(
        `INSERT INTO uploads (url, name, size, mime_type)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [url, file.name, file.size, file.type]
      );
      id = row.rows[0]?.id ?? null;
    } catch (dbErr) {
      console.warn('uploads insert skipped:', (dbErr as Error).message);
    }

    return NextResponse.json({ url, id, name: file.name });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
