import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Calculator, ChefHat, ChevronRight } from 'lucide-react';
import JsonLd from '@/components/seo/JsonLd';
import { site } from '@/lib/site';

/**
 * PÁGINA PILAR del sitio: la guía que compite por «dieta keto», «dieta
 * cetogénica» y «keto para principiantes» (las consultas informacionales que
 * hoy se lleva Diet Doctor con su guía). La landing de venta no puede
 * posicionar ahí: Google quiere una guía, no una página de producto.
 *
 * Estrategia: definición directa en el primer párrafo (cebo de fragmento
 * destacado y de respuestas de IA), estructura de guía completa, enlaces al
 * clúster del blog (31 artículos), a las recetas, a la calculadora de macros
 * del holding (olcas.app) y —solo al final del recorrido— al método de pago.
 */
export const metadata: Metadata = {
  title: 'Dieta keto: qué es, qué comer y cómo empezar',
  description:
    'La dieta keto (cetogénica) reduce los carbohidratos a 20-50 g al día para quemar grasa en cetosis. Qué comer, menú de ejemplo, errores típicos y cómo empezar hoy.',
  keywords:
    'dieta keto, dieta cetogénica, keto para principiantes, qué es la dieta keto, alimentos keto, empezar dieta keto',
  alternates: { canonical: '/dieta-keto' },
  openGraph: {
    title: 'Dieta keto: la guía completa para empezar',
    description:
      'Qué es la cetosis, qué se come (y qué no), menú de ejemplo, errores típicos y cómo empezar la dieta keto hoy mismo.',
    type: 'article',
    url: `${site.url}/dieta-keto`,
    images: [{ url: site.bookImage, width: 1200, height: 630, alt: 'Guía de la dieta keto — Planeta Keto' }],
  },
};

const faq = [
  {
    q: '¿Qué es exactamente la dieta keto?',
    a: 'Es una forma de comer muy baja en carbohidratos (normalmente 20-50 g netos al día), moderada en proteína y alta en grasas naturales. Al quedarse sin glucosa de sobra, el cuerpo pasa a quemar grasa y produce cetonas: ese estado se llama cetosis.',
  },
  {
    q: '¿Cuántos carbohidratos puedo comer al día en keto?',
    a: 'La referencia habitual para entrar y mantenerse en cetosis es no pasar de 20-30 g de carbohidratos netos al día (los totales menos la fibra). Personas muy activas pueden tolerar algo más. Lo importante es medirlo los primeros meses en vez de estimarlo a ojo.',
  },
  {
    q: '¿Cuánto peso se pierde con la dieta keto?',
    a: 'Los primeros 3-7 días es normal perder 1-3 kg, sobre todo de agua y glucógeno. A partir de ahí, una pérdida sostenible típica es de 0,5 a 1 kg por semana si mantienes un déficit calórico. Depende del punto de partida, la adherencia y el descanso.',
  },
  {
    q: '¿Qué es la gripe keto y cómo se evita?',
    a: 'Los primeros días algunos notan cansancio, dolor de cabeza o irritabilidad mientras el cuerpo se adapta. Se previene en gran parte bebiendo más agua y reponiendo electrolitos: sal, potasio y magnesio. Suele durar entre 2 y 5 días.',
  },
  {
    q: '¿Puedo hacer keto si tomo medicación o tengo una enfermedad?',
    a: 'Consúltalo antes con tu médico. En diabetes tipo 2 con medicación, hipertensión tratada, embarazo, lactancia, enfermedad renal o hepática y trastornos de la conducta alimentaria, la dieta debe supervisarla un profesional sanitario: puede requerir ajustar fármacos desde el primer día.',
  },
  {
    q: '¿Qué diferencia hay entre keto y low carb?',
    a: 'La cantidad de carbohidratos. Una dieta low carb se mueve entre 50 y 130 g al día; la keto baja de 20-50 g, suficiente para entrar en cetosis. Low carb es más flexible; keto produce cambios metabólicos más marcados y mayor control del apetito en la mayoría.',
  },
];

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Dieta keto: qué es, qué comer y cómo empezar',
  description:
    'Guía completa de la dieta cetogénica: cetosis, alimentos permitidos y prohibidos, menú de ejemplo, beneficios, efectos secundarios y cómo empezar.',
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${site.url}/dieta-keto` },
  inLanguage: site.lang,
  image: site.bookImage,
  author: { '@id': `${site.url}/#organization` },
  publisher: { '@id': `${site.url}/#organization` },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
    { '@type': 'ListItem', position: 2, name: 'Dieta keto', item: `${site.url}/dieta-keto` },
  ],
};

function Si({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 text-forest">✓</span>
      <span>{children}</span>
    </li>
  );
}

function No({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 text-red-500">✗</span>
      <span>{children}</span>
    </li>
  );
}

export default function DietaKetoPage() {
  return (
    <div className="bg-cream">
      <JsonLd data={articleSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <article className="container mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav className="flex items-center gap-1 text-sm text-gray-500">
          <Link href="/" className="hover:text-forest">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-forest-dark">Dieta keto</span>
        </nav>

        <header className="mt-4">
          <h1 className="font-serif text-3xl font-bold leading-tight text-forest-dark sm:text-5xl">
            Dieta keto (cetogénica): la guía completa para empezar
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray-700">
            La <strong>dieta keto o cetogénica</strong> es una forma de comer muy baja en
            carbohidratos —normalmente entre 20 y 50 g al día—, moderada en proteína y alta
            en grasas naturales. Con tan pocos carbohidratos, el cuerpo agota su glucosa y
            pasa a quemar grasa como combustible, produciendo <strong>cetonas</strong>: un
            estado metabólico llamado <strong>cetosis</strong>. El resultado práctico para
            la mayoría: menos hambre entre horas y una pérdida de peso constante sin contar
            cada bocado.
          </p>
        </header>

        {/* Accesos rápidos del clúster */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link href="/recetas" className="group rounded-2xl bg-white p-4 shadow-soft ring-1 ring-forest/5 transition hover:ring-forest/20">
            <ChefHat className="h-6 w-6 text-forest" />
            <p className="mt-2 font-semibold text-forest-dark">Recetas keto</p>
            <p className="text-sm text-gray-500">Desayunos, comidas, postres y panes.</p>
          </Link>
          <a
            href="https://olcas.app/calculadoras/macronutrientes"
            className="group rounded-2xl bg-white p-4 shadow-soft ring-1 ring-forest/5 transition hover:ring-forest/20"
          >
            <Calculator className="h-6 w-6 text-forest" />
            <p className="mt-2 font-semibold text-forest-dark">Calculadora de macros</p>
            <p className="text-sm text-gray-500">Tus gramos de grasa, proteína y carbos.</p>
          </a>
          <Link href="/catalogo" className="group rounded-2xl bg-white p-4 shadow-soft ring-1 ring-forest/5 transition hover:ring-forest/20">
            <BookOpen className="h-6 w-6 text-forest" />
            <p className="mt-2 font-semibold text-forest-dark">Método 70 días</p>
            <p className="text-sm text-gray-500">El plan completo, paso a paso.</p>
          </Link>
        </div>

        <section className="prose-pk mt-10 space-y-5 text-gray-700">
          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Cómo funciona: la cetosis en 60 segundos</h2>
          <p>
            Tu cuerpo tiene dos depósitos de energía: la glucosa (limitada, se agota en uno
            o dos días) y la grasa (casi ilimitada). Mientras comas carbohidratos
            abundantes, la glucosa manda y la grasa apenas se toca. Al reducirlos por
            debajo de ~50 g diarios, el hígado empieza a convertir grasa en{' '}
            <strong>cuerpos cetónicos</strong>, que alimentan el cerebro y los músculos.
            Entrar en cetosis suele tardar de 2 a 4 días; la adaptación completa, unas
            semanas. Lo explicamos con detalle en{' '}
            <Link href="/blog/que-es-la-cetosis">qué es la cetosis</Link> y en{' '}
            <Link href="/blog/que-es-dieta-keto">qué es la dieta keto</Link>.
          </p>

          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Qué comer y qué evitar</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-forest/5">
              <p className="font-semibold text-forest-dark">Sí, libremente</p>
              <ul className="mt-3 space-y-2 text-sm">
                <Si>Carnes, pescados y mariscos</Si>
                <Si>Huevos</Si>
                <Si>Verduras que crecen sobre la tierra (brócoli, espinaca, calabacín…)</Si>
                <Si>Aguacate, aceite de oliva, mantequilla</Si>
                <Si>Quesos curados y yogur griego natural</Si>
                <Si>Frutos secos con moderación (nueces, almendras)</Si>
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-forest/5">
              <p className="font-semibold text-forest-dark">No (rompen la cetosis)</p>
              <ul className="mt-3 space-y-2 text-sm">
                <No>Azúcar, refrescos, zumos y bollería</No>
                <No>Pan, pasta, arroz y cereales</No>
                <No>Patata, boniato y legumbres en cantidad</No>
                <No>La mayoría de frutas (salvo frutos rojos, con medida)</No>
                <No>Cerveza y cócteles dulces</No>
                <No>Productos «light» llenos de almidón o azúcares ocultos</No>
              </ul>
            </div>
          </div>
          <p>
            La lista completa con cantidades está en{' '}
            <Link href="/blog/alimentos-keto-permitidos">alimentos keto permitidos</Link>; para
            endulzar sin azúcar, mira{' '}
            <Link href="/blog/edulcorantes-keto">qué edulcorantes sirven en keto</Link>.
          </p>

          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Un día keto de ejemplo</h2>
          <ul className="space-y-2">
            <li><strong>Desayuno:</strong> huevos revueltos con aguacate y café con nata (o ayuno, si no tienes hambre).</li>
            <li><strong>Comida:</strong> salmón al horno con brócoli salteado en mantequilla.</li>
            <li><strong>Snack (opcional):</strong> un puñado de nueces o queso curado.</li>
            <li><strong>Cena:</strong> revuelto de pollo con espinacas, o una «pizza» keto con base de queso.</li>
          </ul>
          <p>
            Tienes cientos de ideas en nuestras <Link href="/recetas">recetas keto</Link>{' '}
            —incluidos <Link href="/blog/desayunos-keto">desayunos</Link>,{' '}
            <Link href="/blog/postres-keto-sin-azucar">postres sin azúcar</Link>,{' '}
            <Link href="/blog/pan-keto-sin-harina">pan sin harina</Link> y{' '}
            <Link href="/blog/snacks-keto">snacks</Link>— todas con sus macros calculados.
          </p>

          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Tus macros: cuánta grasa, proteína y carbohidratos</h2>
          <p>
            El reparto típico keto es <strong>70-75 % de las calorías en grasa, 20-25 % en
            proteína y 5-10 % en carbohidratos</strong>. En gramos depende de tu cuerpo y tu
            actividad: calcúlalo en un minuto con la{' '}
            <a href="https://olcas.app/calculadoras/macronutrientes">calculadora de macros</a>{' '}
            y tu gasto diario con la{' '}
            <a href="https://olcas.app/calculadoras/calorias-diarias">calculadora de calorías (TDEE)</a>,
            ambas gratuitas y de nuestro propio equipo. La teoría completa está en{' '}
            <Link href="/blog/calcular-macros-keto">cómo calcular tus macros keto</Link> y{' '}
            <Link href="/blog/proteina-en-keto">cuánta proteína comer en keto</Link>.
          </p>

          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Qué dice la evidencia (sin humo)</h2>
          <p>
            Los ensayos clínicos muestran que keto produce <strong>mayor pérdida de peso a
            corto y medio plazo</strong> que las dietas bajas en grasa, con mejor control del
            apetito, y mejoras en triglicéridos, HDL y glucemia en muchas personas. A largo
            plazo (más de un año), la diferencia con otras dietas bien llevadas se reduce:
            gana la que puedas mantener. Keto destaca precisamente ahí para quienes les
            funciona: comer saciante hace más fácil sostener el déficit. Más contexto en{' '}
            <Link href="/blog/cuanto-peso-pierde-keto">cuánto peso se pierde con keto</Link> y{' '}
            <Link href="/blog/low-carb-vs-keto">low carb vs. keto</Link>.
          </p>

          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Efectos secundarios y precauciones</h2>
          <p>
            Los primeros días puede aparecer la <Link href="/blog/gripe-keto">gripe keto</Link>{' '}
            (cansancio, dolor de cabeza): se previene con agua y{' '}
            <Link href="/blog/electrolitos-keto">electrolitos</Link> — sal, potasio y
            magnesio. El estreñimiento inicial se corrige con verdura y fibra.
          </p>
          <p className="rounded-2xl bg-mint-pale/60 p-4 text-sm leading-relaxed">
            <strong>Importante:</strong> esta guía es divulgativa y no sustituye el consejo
            médico. Si tomas medicación (especialmente para diabetes o hipertensión), estás
            embarazada o en lactancia, o tienes una enfermedad renal, hepática o un
            historial de trastornos alimentarios, habla con tu médico antes de empezar:
            algunos tratamientos deben ajustarse desde el primer día.
          </p>

          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Los 5 errores que arruinan la dieta keto</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Contar los carbohidratos «a ojo» en salsas, embutidos y productos light.</li>
            <li>Comer poca sal y pocos electrolitos (de ahí viene casi toda la «gripe keto»).</li>
            <li>Miedo a la grasa: sin grasa suficiente pasarás hambre y lo dejarás.</li>
            <li>Ignorar las calorías por completo: la cetosis ayuda, pero no anula un exceso crónico — más en <Link href="/blog/calorias-en-keto">calorías en keto</Link>.</li>
            <li>Rendirse en el <Link href="/blog/estancamiento-keto">estancamiento</Link>, que es normal y tiene solución.</li>
          </ol>
          <p>
            El repaso completo, con soluciones, está en{' '}
            <Link href="/blog/errores-dieta-keto">errores típicos de la dieta keto</Link>.
          </p>

          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Cómo empezar hoy (3 pasos)</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>Vacía y llena la despensa</strong> con la lista de{' '}
              <Link href="/blog/alimentos-keto-permitidos">alimentos permitidos</Link>.
            </li>
            <li>
              <strong>Calcula tus macros</strong> con la{' '}
              <a href="https://olcas.app/calculadoras/macronutrientes">calculadora gratuita</a>{' '}
              y elige 5-6 <Link href="/recetas">recetas</Link> para la primera semana.
            </li>
            <li>
              <strong>Sigue un plan cerrado</strong> los primeros 70 días: menús, listas de
              compra y recetas ya decididos. Es exactamente lo que resuelve nuestro{' '}
              <Link href="/catalogo">Método Keto 70 Días</Link>, para no tener que improvisar
              ninguna comida mientras creas el hábito.
            </li>
          </ol>
        </section>

        {/* CTA producto — al final del recorrido informativo */}
        <div className="mt-12 rounded-3xl bg-forest-dark p-7 text-center shadow-card sm:p-10">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            ¿Prefieres el camino ya trazado?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-mint-pale/85">
            El <strong>Método Keto 70 Días</strong> convierte esta guía en un plan diario:
            menús completos, listas de compra semanales y todas las recetas con sus macros.
            Sin decidir nada, solo seguirlo.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-cta px-7 py-3.5 font-semibold text-forest-dark transition hover:brightness-95"
          >
            Ver el método <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* FAQ visible (el schema FAQPage va arriba) */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-bold text-forest-dark sm:text-3xl">Preguntas frecuentes</h2>
          <div className="mt-5 space-y-3">
            {faq.map((item) => (
              <details key={item.q} className="group rounded-2xl bg-white p-5 shadow-soft ring-1 ring-forest/5">
                <summary className="cursor-pointer list-none font-semibold text-forest-dark [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
