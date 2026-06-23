import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { blogSlugify } from '@/lib/blog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Endpoint del blog diario: lo dispara n8n 1/día (Schedule -> HTTP POST aquí).
// Hace PubMed (estudio real) -> Groq (redacta) -> inserta BORRADOR. Revisión humana
// en /admin antes de publicar. Protegido por el mismo secreto del ingest.
// SOLO estilo de vida/comida/prevención (sin enfermedades).

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

const SYSTEM =
  `Eres divulgador de salud de 'Planeta Keto'. A partir de un estudio de PubMed (título, autores, revista, año, abstract), escribe un artículo de blog DIVULGATIVO en español de España, claro, honesto y útil para alguien que hace dieta keto. SOLO estilo de vida, comida y prevención; NO trates enfermedades (diabetes, hipertensión, hígado, tiroides, colesterol). Devuelve EXCLUSIVAMENTE JSON con esta forma: {"title":"titular atractivo y honesto, sin clickbait","summary":"1-2 frases (meta description, 150-160 caracteres)","content":"artículo en Markdown de 1200-1800 palabras, con subtítulos (## y ###), que explique qué investigó el estudio, qué encontró y tips accionables; termina con un apartado de contexto y precaución","category":"una de: ciencia, nutricion, salud, perdida-de-peso, mitos, principiantes","keywords":["4-7 términos"],"sourceName":"Apellido et al., Revista (Año)","sourceUrl":"la URL de PubMed"}. REGLAS: básate SOLO en el estudio aportado; no inventes datos ni cifras; usa "según este estudio…", "podría…"; recomienda consultar a un profesional ante dudas de salud.`;

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

export async function POST(req: NextRequest) {
  const secret = process.env.BLOG_INGEST_SECRET;
  if (!secret || req.headers.get('x-ingest-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 500 });

  // 1. Tema del día (rotación, solo estilo de vida)
  const tema = TEMAS[Math.floor(Date.now() / 86400000) % TEMAS.length];

  // 2. PubMed esearch -> PMID
  const esUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(tema)}&retmax=1&sort=date&retmode=json`;
  const es = await fetch(esUrl).then((r) => r.json()).catch(() => null);
  const pmid: string | undefined = es?.esearchresult?.idlist?.[0];
  if (!pmid) return NextResponse.json({ ok: false, skipped: 'sin PMID', tema });

  // 3. PubMed efetch -> abstract
  const efUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text`;
  const abstract = await fetch(efUrl).then((r) => r.text()).catch(() => '');
  const sourceUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  if (!abstract || abstract.length < 80) return NextResponse.json({ ok: false, skipped: 'sin abstract', pmid });

  // 4. Groq redacta el artículo
  const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
  if (!gRes.ok) {
    return NextResponse.json({ error: 'groq ' + gRes.status, detail: (await gRes.text()).slice(0, 200) }, { status: 502 });
  }
  const gJson = await gRes.json();
  const raw: string = gJson?.choices?.[0]?.message?.content ?? '';
  let art: {
    title?: string; summary?: string; content?: string; category?: string;
    keywords?: string[]; sourceName?: string; sourceUrl?: string;
  };
  try { art = JSON.parse(raw); } catch { return NextResponse.json({ error: 'groq json invalido' }, { status: 502 }); }
  if (!art.title || !art.content || art.content.length < 200) {
    return NextResponse.json({ error: 'articulo incompleto' }, { status: 502 });
  }

  // Guardarraíl duro: SOLO estilo de vida. Si el estudio derivó a enfermedad, no se
  // inserta (aunque el prompt lo pida, Groq puede seguir la fuente). Cero temas YMYL.
  const blob = `${art.title} ${art.content}`.toLowerCase();
  if (/diabet|hipertensi|presi[oó]n arterial|h[ií]gado|hep[aá]tic|tiroid|colesterol|c[aá]ncer|enfermedad renal|ri[ñn][oó]n|epileps|alzh|card[ií]ac/.test(blob)) {
    return NextResponse.json({ ok: false, skipped: 'tema de salud delicada (filtrado)', tema, pmid });
  }

  // 5. Insertar como BORRADOR
  const slug = await uniqueSlug(blogSlugify(art.title));
  const { rows } = await query<{ id: number }>(
    `INSERT INTO blog_posts
       (slug, title, summary, content, category, keywords, source_name, source_url, status, model, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6::text[],$7,$8,'draft','groq-daily', now())
     RETURNING id`,
    [
      slug,
      art.title,
      art.summary ?? null,
      art.content,
      art.category ?? null,
      Array.isArray(art.keywords) ? art.keywords : [],
      art.sourceName ?? null,
      art.sourceUrl ?? sourceUrl,
    ]
  );

  return NextResponse.json({ ok: true, id: rows[0]?.id, slug, status: 'draft', tema, pmid });
}
