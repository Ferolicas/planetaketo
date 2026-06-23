// Ingesta de los blogs escritos a mano en content/blog/*.md como BORRADORES.
// Uso:  BLOG_INGEST_SECRET=xxx node scripts/blog/ingest-drafts.mjs [baseUrl]
//   baseUrl por defecto: https://planetaketo.es  (puede ser http://localhost:3011)
// Cada .md lleva frontmatter (--- ... ---) + cuerpo Markdown. Requiere que el endpoint
// /api/blog/ingest acepte `slug` (ya soportado). Los posts entran como status='draft'.
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SECRET = process.env.BLOG_INGEST_SECRET;
if (!SECRET) { console.error('Falta BLOG_INGEST_SECRET'); process.exit(1); }
const BASE = (process.argv[2] || 'https://planetaketo.es').replace(/\/$/, '');
const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../content/blog');

function parse(md) {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) throw new Error('sin frontmatter');
  const fm = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    fm[k] = v;
  }
  return { fm, content: m[2].trim() };
}

const files = (await readdir(DIR)).filter((f) => f.endsWith('.md')).sort();
let ok = 0, fail = 0;
for (const f of files) {
  try {
    const { fm, content } = parse(await readFile(join(DIR, f), 'utf8'));
    const body = {
      title: fm.title,
      slug: fm.slug || undefined,
      summary: fm.summary || undefined,
      category: fm.category || undefined,
      keywords: fm.keywords ? fm.keywords.split(',').map((s) => s.trim()).filter(Boolean) : [],
      sourceName: fm.sourceName || undefined,
      sourceUrl: fm.sourceUrl || undefined,
      heroImage: fm.heroImage || undefined,
      model: 'hand-written',
      content,
    };
    const res = await fetch(`${BASE}/api/blog/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ingest-secret': SECRET },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) { ok++; console.log(`OK   ${f} -> /blog/${j.slug} (${j.status})`); }
    else { fail++; console.log(`FALLO ${f} -> ${res.status} ${JSON.stringify(j).slice(0, 160)}`); }
  } catch (e) { fail++; console.log(`FALLO ${f} -> ${e.message}`); }
  await new Promise((z) => setTimeout(z, 400));
}
console.log(`\n${ok} borradores ingestados, ${fail} fallos, de ${files.length} archivos.`);
