# Flujo n8n — Blog diario keto desde PubMed (Fase 3)

Objetivo: **1 borrador de blog al día**, basado en un **estudio real de PubMed**, redactado por Groq y depositado como **borrador** en planetaketo. Ferney lo revisa, edita y publica desde `/admin` (nada sale sin su aprobación).

```
Schedule (diario) → Elegir tema → PubMed esearch → PubMed efetch (abstract)
   → Groq (redacta artículo + cita) → HTTP POST /api/blog/ingest  → borrador en /admin
```

## Nodos n8n

### 1. Schedule Trigger
- Cron: `0 7 * * *` (a las 7:00, después del cron de recetas de las 6:30).

### 2. Code — elegir tema del día (rotación)
Lista de temas keto; se elige uno por día (rota, no repite seguido):
```js
const temas = [
  "ketogenic diet weight loss", "ketogenic diet type 2 diabetes",
  "ketogenic diet cholesterol", "low carbohydrate diet appetite",
  "ketosis insulin resistance", "ketogenic diet metabolic syndrome",
  "low carb diet blood pressure", "ketogenic diet inflammation",
  "intermittent fasting ketosis", "ketogenic diet liver fat"
];
const i = Math.floor(Date.now() / 86400000) % temas.length;
return [{ json: { tema: temas[i] } }];
```

### 3. HTTP Request — PubMed esearch (buscar estudio reciente)
- GET `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi`
- Query: `db=pubmed`, `term={{$json.tema}}`, `retmax=1`, `sort=date`, `retmode=json`
- De la respuesta: `esearchresult.idlist[0]` = **PMID**.

### 4. HTTP Request — PubMed efetch (abstract + metadatos)
- GET `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi`
- Query: `db=pubmed`, `id={{PMID}}`, `rettype=abstract`, `retmode=text`
- Devuelve título, autores, revista, año y abstract en texto. (Guarda también la URL: `https://pubmed.ncbi.nlm.nih.gov/{{PMID}}/`.)

### 5. HTTP Request — Groq (redactar el artículo)
- POST `https://api.groq.com/openai/v1/chat/completions`
- Header: `Authorization: Bearer <GROQ_API_KEY>`
- Body (JSON):
```json
{
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.4,
  "response_format": { "type": "json_object" },
  "messages": [
    { "role": "system", "content": "Eres divulgador de salud de 'Planeta Keto'. A partir de un estudio de PubMed (título, autores, revista, año, abstract), escribe un artículo de blog DIVULGATIVO en español de España, claro, honesto y útil para alguien que hace dieta keto. Devuelve EXCLUSIVAMENTE JSON: {\"title\": \"titular atractivo y honesto, sin clickbait\", \"summary\": \"1-2 frases (meta description)\", \"content\": \"artículo en Markdown: 500-800 palabras, con subtítulos (##), que explique qué investigó el estudio, qué encontró y qué implica de forma práctica para keto; termina con un apartado de contexto y precaución\", \"category\": \"una de: ciencia, nutricion, salud, perdida-de-peso, mitos, principiantes\", \"keywords\": [\"4-7 términos\"], \"sourceName\": \"Apellido et al., Revista (Año)\", \"sourceUrl\": \"la URL de PubMed\"}. REGLAS: básate SOLO en el estudio aportado; no inventes datos ni cifras; no des consejos médicos definitivos (usa 'según este estudio…', 'podría…'); recomienda consultar a un profesional ante dudas de salud." },
    { "role": "user", "content": "ESTUDIO (PubMed):\n{{ texto del efetch }}\n\nURL: https://pubmed.ncbi.nlm.nih.gov/{{PMID}}/" }
  ]
}
```
- La respuesta de Groq (`choices[0].message.content`) ya es el JSON del artículo.

### 6. HTTP Request — POST a planetaketo (borrador)
- POST `https://planetaketo.es/api/blog/ingest`
- Headers: `Content-Type: application/json`, `x-ingest-secret: <BLOG_INGEST_SECRET>`
- Body: el JSON que devolvió Groq (title, summary, content, category, keywords, sourceName, sourceUrl) + opcional `"model": "llama-3.3-70b-versatile"`.
- Respuesta `{ ok: true, id, slug, status: "draft" }` → ya está en `/admin` como **borrador**.

## Revisión (Ferney)
1. `/admin` → sección **Blog** → los borradores salen arriba (etiqueta ámbar).
2. **Revisar** → leer, corregir, ajustar la fuente si hace falta.
3. **Publicar** → aparece en `/blog` y entra al sitemap solo.

## Notas
- **Fuente siempre real** (PubMed) + **revisión humana** + **1/día** = no es "scaled content abuse".
- Groq gratis aguanta de sobra (1 artículo/día).
- Si un día no hay estudio nuevo del tema, n8n puede saltar o reintentar con otro tema de la lista.
- El secreto `x-ingest-secret` protege el endpoint: sin él, 401.
