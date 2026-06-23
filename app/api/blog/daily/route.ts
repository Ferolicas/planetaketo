import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { blogSlugify } from '@/lib/blog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Blog diario 100% automático: lo dispara n8n 1/día. Recorre temas (relativos a los
// libros), busca un estudio REAL en PubMed, lo redacta con Groq y lo PUBLICA. Reintenta
// con varios temas/estudios hasta encontrar uno apto, para que SIEMPRE salga 1 blog/día.
// SOLO estilo de vida (guardarraíl anti-enfermedades, pre y post). Nada inventado: el
// artículo se basa en el abstract real del estudio. Evita duplicar estudios ya usados.

const TEMAS = [
  'ketogenic diet weight loss',
  'ketogenic diet appetite satiety',
  'low carbohydrate diet weight loss',
  'ketogenic diet exercise performance',
  'ketogenic diet body composition',
  'ketogenic diet adherence',
  'intermittent fasting weight loss',
  'ketogenic diet protein muscle',
  'low carbohydrate diet satiety',
  'ketogenic diet meal planning',
];

// Temas de salud delicada que NO se tocan (orden de Ferney). Se filtra abstract y artículo.
const DISEASE_RE =
  /diabet|hipertensi|presi[oó]n arterial|blood pressure|h[ií]gado|hep[aá]tic|liver|tiroid|thyroid|colesterol|cholesterol|c[aá]ncer|cancer|tumor|enfermedad renal|kidney|ri[ñn][oó]n|renal|epileps|alzh|card[ií]ac|cardiovascular|covid|infecci|infection|depres|seizure/i;

const SYSTEM =
  `Eres divulgador de salud de 'Planeta Keto'. A partir de un estudio de PubMed (título, autores, revista, año, abstract), escribe un artículo de blog DIVULGATIVO en español de España, claro, honesto y útil para alguien que hace dieta keto, low carb o quiere perder peso o ganar músculo. SOLO estilo de vida, comida, ejercicio y prevención; NO trates enfermedades. Devuelve EXCLUSIVAMENTE JSON con esta forma: {"title":"titular atractivo y honesto, sin clickbait, 50-60 caracteres","summary":"1-2 frases (meta description, 150-160 caracteres)","content":"artículo en Markdown de 1200-1800 palabras, con subtítulos (## y ###), que explique qué investigó el estudio, qué encontró y tips accionables; incluye un apartado de preguntas frecuentes y termina con contexto y precaución","category":"una de: ciencia, nutricion, salud, perdida-de-peso, mitos, principiantes","keywords":["4-7 términos"],"sourceName":"Apellido et al., Revista (Año)","sourceUrl":"la URL de PubMed"}. REGLAS: básate SOLO en el estudio aportado; no inventes datos ni cifras; usa "según este estudio…", "podría…"; recomienda consultar a un profesional ante dudas de salud.`;

async function uniqueSlug(base: string): Promise<string> {
  const root = base || `post-${Date.now()}`;
  let slug = root;
  for (let n = 2; n < 60; n++) {
    const r = await query<{ id: number }>('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
    if (r.rowCount === 0) return slug;
    slug = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

async function pubmedSearch(tema: string): Promise<string[]> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(tema)}&retmax=4&sort=date&retmode=json`;
  const r = await fetch(url).then((x) => x.json()).catch(() => null);
  return r?.esearchresult?.idlist ?? [];
}

async function pubmedFetch(pmid: string): Promise<string> {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text`;
  return await fetch(url).then((x) => x.text()).catch(() => '');
}

type Article = {
  title?: string; summary?: string; content?: string; category?: string;
  keywords?: string[]; sourceName?: string; sourceUrl?: string;
};

async function groqWrite(groqKey: string, abstract: string, sourceUrl: string): Promise<Article | null> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `ESTUDIO (PubMed):\n${abstract.slice(0, 6000)}\n\nURL: ${sourceUrl}` },
      ],
    }),
  });
  if (!res.ok) return null;
  const j = await res.json().catch(() => null);
  try { return JSON.parse(j?.choices?.[0]?.message?.content ?? ''); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const secret = process.env.BLOG_INGEST_SECRET;
  if (!secret || req.headers.get('x-ingest-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 500 });

  const startIdx = Math.floor(Date.now() / 86400000) % TEMAS.length;
  const tried: { pmid: string; skip: string }[] = [];
  let groqCalls = 0;

  for (let k = 0; k < TEMAS.length && groqCalls < 3; k++) {
    const tema = TEMAS[(startIdx + k) % TEMAS.length];
    const pmids = await pubmedSearch(tema);
    for (const pmid of pmids) {
      if (groqCalls >= 3) break;
      const sourceUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
      // Sin duplicados: si ya hay un post con este estudio, lo salta.
      const dup = await query('SELECT 1 FROM blog_posts WHERE source_url = $1 LIMIT 1', [sourceUrl]);
      if (dup.rowCount) { tried.push({ pmid, skip: 'duplicado' }); continue; }
      const abstract = await pubmedFetch(pmid);
      if (!abstract || abstract.length < 120) { tried.push({ pmid, skip: 'sin abstract' }); continue; }
      // Pre-filtro: si el estudio es de una enfermedad, ni llamamos a Groq.
      if (DISEASE_RE.test(abstract.toLowerCase())) { tried.push({ pmid, skip: 'abstract enfermedad' }); continue; }

      groqCalls++;
      const art = await groqWrite(groqKey, abstract, sourceUrl);
      if (!art?.title || !art?.content || art.content.length < 200) { tried.push({ pmid, skip: 'groq incompleto' }); continue; }
      // Guardarraíl post: si el artículo derivó a enfermedad, se descarta.
      if (DISEASE_RE.test(`${art.title} ${art.content}`.toLowerCase())) { tried.push({ pmid, skip: 'articulo enfermedad' }); continue; }

      // PUBLICAR (auto, sin revisión)
      const slug = await uniqueSlug(blogSlugify(art.title));
      const { rows } = await query<{ id: number }>(
        `INSERT INTO blog_posts
           (slug, title, summary, content, category, keywords, source_name, source_url, status, model, published_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6::text[],$7,$8,'published','groq-daily', now(), now())
         RETURNING id`,
        [
          slug, art.title, art.summary ?? null, art.content, art.category ?? null,
          Array.isArray(art.keywords) ? art.keywords : [], art.sourceName ?? null, art.sourceUrl ?? sourceUrl,
        ]
      );
      return NextResponse.json({ ok: true, published: true, id: rows[0]?.id, slug, tema, pmid });
    }
  }

  return NextResponse.json({ ok: false, skipped: 'sin estudio apto hoy', tried });
}
