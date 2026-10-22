import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import JsonLd from '@/components/seo/JsonLd';
import LeadCTA from '@/components/lead/LeadCTA';
import { getRecipeBySlug, type Recipe } from '@/lib/recipes';
import { site } from '@/lib/site';

/**
 * Menú keto de 7 días gratuito. Ataca la intención «dieta keto gratis»,
 * «dieta keto menú» y «menú keto semanal» con una página útil por sí misma:
 * cada comida enlaza a su receta real, y el planificador en PDF capta el correo.
 * Los macros salen de la ficha de cada receta (valores aproximados por ración).
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Dieta keto gratis: menú de 7 días',
  description:
    'Menú keto gratis para 7 días con desayuno, almuerzo y cena, cada comida con su receta, y una lista de compras base. Descarga también el planificador en PDF.',
  alternates: { canonical: '/dieta-keto-gratis' },
  openGraph: {
    title: 'Dieta keto gratis: menú de 7 días con recetas',
    description: 'Un menú keto de ejemplo para una semana, con recetas fáciles y lista de compras. Gratis.',
    type: 'article',
    url: `${site.url}/dieta-keto-gratis`,
    images: [{ url: site.bookImage, width: 1200, height: 630, alt: 'Menú keto gratis de 7 días: Planeta Keto' }],
  },
};

// Cada slug es una receta publicada del sitio. Se eligen para que el día sume pocos carbohidratos netos.
const MENU: { day: string; b: string; l: string; d: string }[] = [
  { day: 'Día 1', b: 'tortillas-de-aguacate-con-atun', l: 'arroz-con-pollo-de-coliflor', d: 'hamburguesa-sin-pan' },
  { day: 'Día 2', b: 'muffin-de-huevo-y-chorizo', l: 'berenjena-rellena', d: 'brocoli-gratinado-con-pollo' },
  { day: 'Día 3', b: 'arepas-de-queso-keto', l: 'milanesa-con-chicharron-y-parmesano', d: 'calzone-de-pollo-sin-harina' },
  { day: 'Día 4', b: 'desayuno-keto-facil-sin-harinas', l: 'pollo-gratinado-con-bacon', d: 'rollos-de-carne-en-bacon' },
  { day: 'Día 5', b: 'tortas-de-pollo-y-huevo-keto', l: 'rollo-de-pollo-y-bacon', d: 'nuggets-crujientes-sin-carbohidratos' },
  { day: 'Día 6', b: 'tortas-de-aguacate', l: 'pechuga-rellena', d: 'pizza-sin-harina' },
  { day: 'Día 7', b: 'pan-facil-sin-harina', l: 'arroz-de-coliflor-tres-delicias-keto', d: 'quesadillas-de-carne' },
];

const faq = [
  {
    q: '¿El menú keto de 7 días es de verdad gratis?',
    a: 'Sí. Puedes ver todo el menú y todas las recetas sin pagar ni registrarte. Si además quieres el planificador en PDF para imprimir o llevar en el móvil, lo descargas gratis dejando tu correo.',
  },
  {
    q: '¿Cuántos carbohidratos tiene este menú keto?',
    a: 'Cada receta indica sus carbohidratos netos por ración, y el menú está elegido para que cada día sume pocos (la referencia habitual en keto es 20-50 g netos al día). Son valores aproximados: varían con las marcas y las cantidades que uses.',
  },
  {
    q: '¿Puedo repetir comidas o cambiar los días?',
    a: 'Sí. Es un menú de ejemplo. Puedes repetir tus recetas favoritas, intercambiar días entre sí o duplicar raciones para cocinar una vez y comer dos.',
  },
  {
    q: '¿Esto es un plan médico o una dieta para adelgazar?',
    a: 'No. Es un menú de ejemplo de comida baja en carbohidratos, no un tratamiento. Si tienes una enfermedad, tomas medicación, estás embarazada o en lactancia, consúltalo antes con tu médico o dietista.',
  },
  {
    q: '¿Qué hago después de los 7 días?',
    a: 'Si te ha gustado la forma de comer, puedes seguir repitiendo el menú y probando recetas nuevas. Para un plan cerrado de 70 días con menús, listas de compra y macros, está el Método Keto.',
  },
];

const shopping: { group: string; items: string }[] = [
  { group: 'Proteínas', items: 'pechuga de pollo, carne molida, bacon, chorizo, atún en lata, huevos' },
  { group: 'Verduras', items: 'coliflor, brócoli, berenjena, calabacín, espinacas, pimientos, tomate' },
  { group: 'Lácteos y quesos', items: 'queso mozzarella, queso parmesano, queso crema, mantequilla' },
  { group: 'Grasas', items: 'aguacate, aceite de oliva, chicharrón' },
  { group: 'Despensa', items: 'harina de almendra, especias (orégano, pimentón, ajo en polvo), sal' },
];

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Dieta keto gratis: menú de 7 días',
  description: 'Menú keto de ejemplo para una semana, con recetas y lista de compras base.',
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${site.url}/dieta-keto-gratis` },
  inLanguage: site.lang,
  image: site.bookImage,
  author: { '@id': `${site.url}/#organization` },
  publisher: { '@id': `${site.url}/#organization` },
};
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
};
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
    { '@type': 'ListItem', position: 2, name: 'Dieta keto', item: `${site.url}/dieta-keto` },
    { '@type': 'ListItem', position: 3, name: 'Dieta keto gratis', item: `${site.url}/dieta-keto-gratis` },
  ],
};

type Meal = { slug: string; label: string; r: Recipe | null };

function macros(r: Recipe | null): string | null {
  const n = r?.nutrition;
  if (!n || n.calories == null || n.netCarbs == null) return null;
  return `≈ ${Math.round(n.calories)} kcal · ${Math.round(n.netCarbs)} g carbohidratos netos`;
}

export default async function DietaKetoGratisPage() {
  const slugs = MENU.flatMap((m) => [m.b, m.l, m.d]);
  const found = await Promise.all(slugs.map((s) => getRecipeBySlug(s).catch(() => null)));
  const bySlug = new Map(slugs.map((s, i) => [s, found[i]]));
  const days = MENU.map((m) => {
    const meals: Meal[] = [
      { slug: m.b, label: 'Desayuno', r: bySlug.get(m.b) ?? null },
      { slug: m.l, label: 'Almuerzo', r: bySlug.get(m.l) ?? null },
      { slug: m.d, label: 'Cena', r: bySlug.get(m.d) ?? null },
    ].filter((x) => x.r) as Meal[];
    const kcal = meals.reduce((a, x) => a + (x.r?.nutrition?.calories ?? 0), 0);
    const carbs = meals.reduce((a, x) => a + (x.r?.nutrition?.netCarbs ?? 0), 0);
    return { day: m.day, meals, kcal: Math.round(kcal), carbs: Math.round(carbs) };
  }).filter((d) => d.meals.length > 0);

  return (
    <div className="bg-cream">
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <article className="container mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
          <Link href="/" className="hover:text-forest">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dieta-keto" className="hover:text-forest">Dieta keto</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-forest-dark">Dieta keto gratis</span>
        </nav>

        <header className="mt-4">
          <h1 className="font-serif text-3xl font-bold leading-tight text-forest-dark sm:text-5xl">
            Dieta keto gratis: menú de 7 días
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray-700">
            Este es un <strong>menú keto gratis para una semana</strong>: desayuno, almuerzo y cena de cada día, con
            recetas fáciles y pocos carbohidratos. No necesitas registrarte para verlo. Cada comida enlaza a su receta
            con ingredientes, pasos y macros, y al final tienes una lista de compras base.
          </p>
          <div className="mt-6">
            <LeadCTA label="Descargar el planificador en PDF (gratis)" />
          </div>
        </header>

        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Tu menú keto semanal, día por día</h2>
          <p className="mt-3 text-gray-700">
            Los valores de cada receta son aproximados por ración. Ajusta el tamaño de las porciones a tu apetito.
          </p>
          <div className="mt-6 space-y-5">
            {days.map((d) => (
              <div key={d.day} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-forest/5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-xl font-bold text-forest-dark">{d.day}</h3>
                  {d.carbs > 0 && (
                    <p className="text-sm text-gray-500">
                      Total aprox.: {d.kcal} kcal · {d.carbs} g carbohidratos netos
                    </p>
                  )}
                </div>
                <ul className="mt-3 divide-y divide-forest/10">
                  {d.meals.map((m) => (
                    <li key={m.slug} className="py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-forest">{m.label}</p>
                      <Link href={`/recetas/${m.slug}`} className="font-semibold text-forest-dark underline-offset-2 hover:underline">
                        {m.r?.title}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-gray-500">
                        {macros(m.r) && <span>{macros(m.r)}</span>}
                        {m.r?.totalMinutes ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {m.r.totalMinutes} min
                          </span>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Lista de compras base</h2>
          <p className="mt-3 text-gray-700">
            Con esto cubres la mayor parte del menú. Revisa la ficha de cada receta para las cantidades exactas.
          </p>
          <dl className="mt-5 space-y-3 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-forest/5">
            {shopping.map((s) => (
              <div key={s.group}>
                <dt className="font-semibold text-forest-dark">{s.group}</dt>
                <dd className="text-gray-700">{s.items}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 rounded-3xl bg-forest-dark p-6 text-center text-white sm:p-8">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">Llévate el planificador en PDF</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            El Planificador de 7 días para imprimir o ver en el móvil. Es gratis: déjanos tu correo y te lo enviamos.
          </p>
          <div className="mt-5">
            <LeadCTA label="Quiero el planificador gratis" />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Preguntas frecuentes</h2>
          <div className="mt-5 space-y-4">
            {faq.map((i) => (
              <details key={i.q} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-forest/5">
                <summary className="cursor-pointer font-semibold text-forest-dark">{i.q}</summary>
                <p className="mt-3 text-gray-700">{i.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-10 text-sm text-gray-500">
          ¿Quieres entender antes cómo funciona? Lee la <Link href="/dieta-keto" className="underline">guía completa de la dieta keto</Link>{' '}
          o mira <Link href="/blog/que-es-dieta-keto" className="underline">qué es la dieta keto y en qué consiste</Link>. Este contenido es
          informativo y no sustituye el consejo de un profesional de la salud.
        </p>
      </article>
    </div>
  );
}
