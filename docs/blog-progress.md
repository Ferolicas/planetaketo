# Estado de los 30 blogs SEO — LISTOS para revisar y pushear

> **✅ LOS 30 BLOGS ESTÁN ESCRITOS Y COMMITEADOS** (sin push). Cada uno hecho a mano, único, 1.500+ palabras, con **fuente real verificada** (Harvard Nutrition Source, Mayo Clinic, CDC, PMC — cero citas inventadas), CTA al libro relevante, FAQ y anti-canibalización.
> **Regla aplicada:** solo estilo de vida/comida/prevención. NADA de enfermedades (diabetes, hipertensión, hígado, tiroides, colesterol).

## Infraestructura (commits locales)
- `app/api/blog/ingest/route.ts` → acepta `slug` propio (SEO) además del derivado del título.
- `scripts/blog/ingest-drafts.mjs` → ingesta los `.md` de `content/blog/` como **borradores** (status=draft).
- `docs/seo-keyword-research.md` → investigación + análisis competencia + mapa de 30 keywords.

## Los 30 blogs (en `content/blog/`)
| Slug | Keyword | Libro | Fuente |
|---|---|---|---|
| `que-es-dieta-keto` | qué es la dieta keto | Método Keto | Harvard |
| `keto-para-principiantes` | keto para principiantes | Método Keto | Harvard |
| `que-es-la-cetosis` | qué es la cetosis | Método Keto | Harvard |
| `gripe-keto` | gripe keto | Método Keto | Harvard |
| `alimentos-keto-permitidos` | alimentos keto permitidos | Recetario Keto | Harvard |
| `errores-dieta-keto` | errores en keto | Método Keto | Harvard |
| `calorias-en-keto` | calorías en keto | Método Keto | Mayo + CDC |
| `calcular-macros-keto` | calcular macros keto | Método Keto | Harvard |
| `deficit-calorico-que-es` | déficit calórico | Método Bajo en Cal | Mayo + CDC |
| `contar-calorias-keto` | contar calorías en keto | Método Bajo en Cal | Mayo |
| `cuanto-peso-pierde-keto` | cuánto peso se pierde en keto | Método Keto | CDC |
| `estancamiento-keto` | estancamiento en keto | Método Keto | CDC |
| `ayuno-intermitente-keto` | ayuno intermitente y keto | Método Keto | Harvard |
| `low-carb-vs-keto` | low carb vs keto | Método Low Carb | Harvard |
| `dieta-baja-carbohidratos` | dieta baja en carbohidratos | Método Low Carb | Harvard |
| `carbohidratos-al-dia-adelgazar` | carbohidratos al día para adelgazar | Método Low Carb | Harvard |
| `keto-ganar-musculo` | keto ganar músculo | Método Gym Keto | PMC |
| `proteina-en-keto` | proteína en keto | Método Gym Keto | PMC + Harvard |
| `keto-rendimiento-deportivo` | keto y rendimiento deportivo | Método Deportistas Keto | Harvard |
| `recomposicion-corporal` | recomposición corporal | Método Gym | PMC |
| `keto-y-alcohol` | keto y alcohol | Bebidas y Postres Keto | Harvard |
| `keto-fuera-de-casa` | comer keto fuera de casa | Método Keto | Harvard |
| `meal-prep-keto` | meal prep keto | Comidas Rápidas Keto | Harvard |
| `edulcorantes-keto` | edulcorantes keto | Bebidas y Postres Keto | Harvard |
| `pan-keto-sin-harina` | pan keto sin harina | Recetario Keto | Harvard |
| `postres-keto-sin-azucar` | postres keto sin azúcar | Bebidas y Postres Keto | Harvard |
| `desayunos-keto` | qué desayunar en keto | Recetario Keto | Harvard |
| `snacks-keto` | snacks keto | Comidas Rápidas Keto | Harvard |
| `electrolitos-keto` | electrolitos en keto | Guía Suplementos | Harvard |
| `suplementos-keto` | suplementos keto | Guía Suplementos | Harvard |

## Cómo publicarlos (cuando despiertes)
1. Revisa los `.md` en `content/blog/` (y el mapa en `seo-keyword-research.md`).
2. **Push** de los commits del blog (van del `3fb40cc` en adelante; `git log --oneline origin/main..HEAD`).
3. En tu equipo o el VPS, con el endpoint ya desplegado:
   ```
   BLOG_INGEST_SECRET=<tu secreto> node scripts/blog/ingest-drafts.mjs https://planetaketo.es
   ```
   → entran como **borradores** en `/admin`. Revisas y publicas los que quieras.

## Code TODO opcional (mejoras de render SEO — aún NO hechas, no bloquean publicar)
- Schema `BreadcrumbList` + `FAQPage` en `app/blog/[slug]/page.tsx`.
- AdSense **in-content distribuido** (hoy 2 bloques fijos → tras intro + cada 4-5 párrafos + final, ≤30%).
- Banner del libro relevante por post (el CTA al libro ya va dentro del texto de cada blog).
- Autor **Ferney (Person) + bio** en el schema (E-E-A-T).
- Imágenes hero on-domain (webp, nombre con keyword) — los `.md` van sin `heroImage`.

## Importante
- **Nada se pusheó ni se publicó.** Todo en commits locales para tu revisión.
- Tu **n8n y AdSense intactos**. El `/root/.n8n` que toqué por error quedó limpio; producción en `/opt/n8n/data`+postgres, sana.
