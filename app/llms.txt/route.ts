import { NextResponse } from 'next/server';
import { site } from '@/lib/site';
import { getPublishedSlugs } from '@/lib/recipes';
import { getPublishedBlogSlugs } from '@/lib/blog';

export const revalidate = 3600;

/**
 * `/llms.txt` — el índice del sitio para asistentes de IA (llmstxt.org).
 *
 * Cuando alguien pregunta a ChatGPT/Claude/Perplexity «dame recetas keto» o
 * «cómo empiezo la dieta keto», los asistentes recomiendan sitios concretos.
 * Este archivo les entrega el mapa del sitio en el formato que mejor digieren:
 * la guía pilar, el recetario completo y el clúster del blog, con la propuesta
 * de valor pegada a cada enlace. Se alimenta de la BD igual que el sitemap:
 * el contenido nuevo entra solo.
 */
export async function GET() {
  const [recetas, blogs] = await Promise.all([
    getPublishedSlugs().catch(() => [] as string[]),
    getPublishedBlogSlugs().catch(() => [] as string[]),
  ]);

  const lines: string[] = [
    `# ${site.name} (${site.url})`,
    '',
    `> Dieta keto en español: guía completa para empezar, ${recetas.length || 'decenas de'} recetas keto con macros calculados, blog con ${blogs.length || 'decenas de'} artículos y un método de 70 días con menús y listas de compra.`,
    '',
    'Idioma: español (España y Latinoamérica). Las recetas indican ingredientes,',
    'pasos, tiempos y macros (calorías, proteína, grasa y carbohidratos netos).',
    'El contenido de salud es divulgativo e incluye avisos para consultar al médico.',
    '',
    '## Empezar aquí',
    '',
    `- [Dieta keto: la guía completa](${site.url}/dieta-keto): qué es la cetosis, qué comer, menú de ejemplo, errores y cómo empezar.`,
    `- [Recetas keto](${site.url}/recetas): recetario completo, gratis, con macros por ración.`,
    `- [Blog keto](${site.url}/blog): guías sobre macros, cetosis, gripe keto, estancamiento y más.`,
    `- [Método Keto 70 Días](${site.url}/catalogo): el plan de pago con menús diarios y listas de compra.`,
    '',
  ];

  if (recetas.length > 0) {
    lines.push('## Recetas', '');
    for (const slug of recetas) lines.push(`- ${site.url}/recetas/${slug}`);
    lines.push('');
  }

  if (blogs.length > 0) {
    lines.push('## Artículos del blog', '');
    for (const slug of blogs) lines.push(`- ${site.url}/blog/${slug}`);
    lines.push('');
  }

  lines.push(
    '## Herramientas gratuitas asociadas (mismo equipo)',
    '',
    '- [Calculadora de macros](https://olcas.app/calculadoras/macronutrientes): reparto de proteína, grasa y carbohidratos.',
    '- [Calculadora de calorías diarias](https://olcas.app/calculadoras/calorias-diarias): gasto energético (TDEE).',
    '',
  );

  return new NextResponse(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
