# Sistema de diseño — Planeta Keto · "Fresh Wellness"

ADN visual de la marca. Evolución natural-premium de la identidad verde.

## Paleta (tokens en `tailwind.config.ts`)
| Token | Hex | Uso |
|---|---|---|
| `cream` | `#FAF7F0` | Fondo base de la web |
| `forest` / `forest-dark` / `forest-deep` | `#166534` / `#14532D` / `#052e16` | Marca, títulos, iconos, secciones oscuras |
| `mint` / `mint-soft` / `mint-pale` | `#34D399` / `#6EE7B7` / `#D1FAE5` | Acento fresco, badges, elemento firma |
| `cta` / `cta-dark` / `cta-soft` | `#F59E0B` / `#D97706` / `#FCD34D` | **Color de ACCIÓN** (todos los CTA) |
| `primary-*` | escala verde | Compat. heredada |

**Regla de oro:** los botones de compra van en **ámbar (`cta`)**, nunca en verde — así destacan sobre el verde de marca.

## Tipografía (`next/font`)
- **Títulos:** Lora (serif) → `font-serif` / `--font-lora`. Pesos 400-700.
- **Cuerpo:** Raleway (sans) → por defecto / `--font-raleway`. Pesos 300-700.

## Elemento firma
`.trazo-menta` (en `globals.css`): subrayado tipo brocha en menta bajo la palabra clave de un título. Ej.: `<span className="trazo-menta">rico</span>`. Úsalo UNA vez por título.

## Motion (regla crítica de render)
- El contenido es **visible por defecto**. Nunca se oculta con JS antes de hidratar.
- `components/Reveal.tsx` + clases `.reveal`/`html.js .reveal`: el script de `layout.tsx` añade `html.js` antes del primer pintado, así el reveal solo actúa con JS; sin JS / SEO / hidratación lenta → contenido visible.
- El **hero/above-the-fold NO usa `.reveal`** (siempre visible). Solo secciones below-fold.
- Respeta `prefers-reduced-motion` (desactiva transforms y animaciones).
- Duraciones 150-300ms (micro), transform/opacity (no width/height).

## Componentes / reglas
- **Iconos:** Lucide (SVG). PROHIBIDO emojis como iconos.
- **Radios:** `rounded-2xl`/`rounded-3xl`/`rounded-4xl` (orgánico, con aire).
- **Sombras:** `shadow-soft`, `shadow-card`, `shadow-cta` (suaves, verdes/ámbar).
- **CTA:** `rounded-full bg-cta text-forest-dark hover:bg-cta-dark hover:text-white cursor-pointer`.
- **Foco:** outline ámbar visible (a11y) definido en `globals.css`.
- **Idioma:** todo en español.

## Estructura landing (home)
Hero → (Reveal) Por qué funciona → (Reveal) Prueba social/testimonios → (Reveal) CTA final. Social proof antes del CTA final.

## Inventario
- `app/layout.tsx` (fuentes, metadata/OG, favicon `app/icon.png`, script JS-mode).
- `components/{Header,Footer,Reveal}.tsx`.
- `components/home/{HeroSales,WhyChooseUs,SocialProof,FinalCTA}.tsx`.
- `app/page.tsx`, `app/r/page.tsx`.
- `components/payment/*` (modal coherente con la paleta; embeds de Stripe/MP/Hotmart conservan su UI).
