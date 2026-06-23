# Estado de los 30 blogs SEO — para revisar y pushear

> Sesión nocturna. **Regla aplicada:** solo estilo de vida/comida/prevención. NADA de enfermedades (diabetes, hipertensión, hígado, tiroides, colesterol). Cada blog hecho a mano, único, con **fuente real verificada** (cero citas inventadas), CTA al libro relevante, FAQ y anti-canibalización.

## Qué hay hecho (commiteado, sin push)

**Infraestructura**
- `app/api/blog/ingest/route.ts` → ahora acepta `slug` propio (SEO) además del derivado del título.
- `scripts/blog/ingest-drafts.mjs` → ingesta los `.md` de `content/blog/` como **borradores**.
- `docs/seo-keyword-research.md` → investigación + análisis competencia + **mapa de 30 keywords** (actualizado: temas de enfermedad reemplazados por estilo de vida).

**8 blogs escritos (de 30)** — en `content/blog/`, 1.500+ palabras cada uno:
| # | Slug | Fuente verificada | Libro |
|---|---|---|---|
| 1 | `calorias-en-keto` | Mayo Clinic + CDC | Método Keto |
| 2 | `que-es-dieta-keto` | Harvard Nutrition Source | Método Keto |
| 3 | `que-es-la-cetosis` | Harvard Nutrition Source | Método Keto |
| 4 | `deficit-calorico-que-es` | Mayo Clinic + CDC | Método Bajo en Calorías |
| 5 | `keto-ganar-musculo` | PMC (músculo/proteína) | Método Gym Keto |
| 6 | `keto-para-principiantes` | Harvard Nutrition Source | Método Keto |
| 7 | `low-carb-vs-keto` | Harvard Nutrition Source | Método Low Carb |
| 8 | `proteina-en-keto` | PMC + Harvard | Método Gym Keto |

## Por qué 8 y no 30 (honestidad)
Cada blog se redacta a mano con su fuente verificada por WebFetch, como pediste ("calidad por encima de velocidad, sin moldes"). Eso, hecho bien, **no entra en una sola sesión** (límite de contexto). Quedan **22 por escribir**, todos ya planificados (keyword + slug + título + libro) en `seo-keyword-research.md`. Se continúan en la siguiente sesión con el mismo patrón, o tu n8n los va sumando 1/día.

## Los 22 que faltan (del mapa, ya planificados)
`alimentos-keto-permitidos`, `errores-dieta-keto`, `gripe-keto`, `calcular-macros-keto`, `contar-calorias-keto`, `cuanto-peso-pierde-keto`, `estancamiento-keto`, `ayuno-intermitente-keto`, `dieta-baja-carbohidratos`, `carbohidratos-al-dia-adelgazar`, `keto-rendimiento-deportivo`, `recomposicion-corporal`, `keto-y-alcohol`, `keto-fuera-de-casa`, `meal-prep-keto`, `edulcorantes-keto`, `pan-keto-sin-harina`, `postres-keto-sin-azucar`, `desayunos-keto`, `snacks-keto`, `electrolitos-keto`, `suplementos-keto`.

## Code TODO (mejoras SEO del render — commits locales, aún no hechas)
Para que los blogs rendericen "SEO perfecto" al publicarse, falta (no bloquea publicar):
- Schema `BreadcrumbList` + `FAQPage` en `app/blog/[slug]/page.tsx`.
- AdSense **in-content distribuido** (hoy 2 bloques fijos; objetivo: tras intro + cada 4-5 párrafos + final, ≤30%).
- Banner del **libro relevante por post** (hoy `BookBanner` es genérico; el CTA al libro ya va dentro del texto de cada blog).
- Autor **Ferney (Person) + bio** en el schema y la cabecera (E-E-A-T).
- Imágenes hero on-domain (webp, nombre con keyword) — los `.md` van sin `heroImage` por ahora.

## Cómo publicarlos (cuando despiertes)
1. Revisa los 8 `.md` en `content/blog/` (y el mapa en `seo-keyword-research.md`).
2. Si te cuadra: **push** de los commits del blog (`6db21a1`, el de +2, `docs(seo)`, el de slug).
3. En tu equipo o el VPS:
   ```
   BLOG_INGEST_SECRET=<tu secreto> node scripts/blog/ingest-drafts.mjs https://planetaketo.es
   ```
   → entran como **borradores** en `/admin`. Revisas y publicas los que quieras.

## Importante
- **Nada se pusheó ni se publicó.** Todo en commits locales para tu revisión.
- Tu **n8n y AdSense intactos**. El `/root/.n8n` que toqué por error quedó limpio; producción en `/opt/n8n/data`+postgres, sana.
