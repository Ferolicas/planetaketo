import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Users, Flame, ChevronRight } from 'lucide-react';
import {
  getRecipeBySlug,
  getRelatedRecipes,
  recipeJsonLd,
  categoryLabel,
  humanDuration,
} from '@/lib/recipes';
import JsonLd from '@/components/seo/JsonLd';
import LiteYouTube from '@/components/recipes/LiteYouTube';
import BookBanner from '@/components/recipes/BookBanner';
import ChannelBanner from '@/components/recipes/ChannelBanner';
import YouTubeGallery from '@/components/recipes/YouTubeGallery';
import RecipeCard from '@/components/recipes/RecipeCard';
import AdSlot from '@/components/ads/AdSlot';

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try {
    return await getRecipeBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const r = await load(slug);
  if (!r) return { title: 'Receta no encontrada' };
  return {
    title: r.title,
    description: r.summary ?? `Receta keto: ${r.title}. Paso a paso, sin azúcar ni harinas.`,
    alternates: { canonical: `/recetas/${r.slug}` },
    openGraph: {
      title: r.title,
      description: r.summary ?? '',
      type: 'article',
      images: r.imageUrl ? [{ url: r.imageUrl }] : undefined,
    },
  };
}

export default async function RecipePage({ params }: Params) {
  const { slug } = await params;
  const r = await load(slug);
  if (!r) notFound();

  const related = await getRelatedRecipes(r.category, r.slug, 3).catch(() => []);
  const total = humanDuration(r.totalMinutes);

  return (
    <div className="bg-cream">
      <JsonLd data={recipeJsonLd(r)} />
      <article className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
          <Link href="/" className="hover:text-forest">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/recetas" className="hover:text-forest">Recetas</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-forest-dark">{categoryLabel(r.category)}</span>
        </nav>

        <header className="mt-4">
          <span className="inline-flex rounded-full bg-mint-pale px-3 py-1 text-xs font-semibold text-forest-dark">
            {categoryLabel(r.category)}
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-forest-dark sm:text-4xl">
            {r.title}
          </h1>
          {r.summary && <p className="mt-3 text-lg text-gray-600">{r.summary}</p>}
        </header>

        <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-forest/5">
          <Meta icon={<Clock className="h-5 w-5" />} label="Tiempo" value={total ?? '—'} />
          <Meta icon={<Users className="h-5 w-5" />} label="Raciones" value={r.servings ? String(r.servings) : '—'} />
          <Meta icon={<Flame className="h-5 w-5" />} label="Calorías" value={r.nutrition?.calories ? String(r.nutrition.calories) : '—'} />
        </div>

        {r.imageUrl && (
          <div className="relative mt-6 aspect-video overflow-hidden rounded-3xl shadow-card">
            <Image src={r.imageUrl} alt={r.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
          </div>
        )}

        <section className="mt-6">
          <LiteYouTube id={r.videoId} title={r.title} />
          <p className="mt-2 text-center text-sm text-gray-500">Mira la receta completa en vídeo</p>
        </section>

        <AdSlot />

        {r.ingredients.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-2xl font-bold text-forest-dark">Ingredientes</h2>
            <ul className="mt-4 space-y-2.5">
              {r.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-soft ring-1 ring-forest/5">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cta" />
                  <span className="text-gray-700">
                    {ing.quantity && <strong className="font-semibold text-forest-dark">{ing.quantity}</strong>} {ing.item}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {r.steps.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-2xl font-bold text-forest-dark">Preparación</h2>
            <ol className="mt-4 space-y-4">
              {r.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-gray-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <AdSlot />

        {r.nutrition && r.nutrition.calories ? (
          <section className="mt-8">
            <h2 className="font-serif text-2xl font-bold text-forest-dark">Información nutricional</h2>
            <p className="mt-1 text-sm text-gray-400">Estimación por ración</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Nutri label="Calorías" value={String(r.nutrition.calories)} unit="kcal" />
              <Nutri label="Proteína" value={r.nutrition.protein != null ? String(r.nutrition.protein) : '—'} unit="g" />
              <Nutri label="Grasa" value={r.nutrition.fat != null ? String(r.nutrition.fat) : '—'} unit="g" />
              <Nutri label="Carbs netos" value={r.nutrition.netCarbs != null ? String(r.nutrition.netCarbs) : '—'} unit="g" />
            </div>
          </section>
        ) : null}

        {r.tips && (
          <section className="mt-8 rounded-2xl bg-mint-pale/40 p-5">
            <h2 className="font-serif text-xl font-bold text-forest-dark">Consejos</h2>
            <p className="mt-2 whitespace-pre-line text-gray-700">{r.tips}</p>
          </section>
        )}

        <BookBanner />
        <ChannelBanner />
        <YouTubeGallery />

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-5 font-serif text-2xl font-bold text-forest-dark">Más recetas que te gustarán</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rec) => (
                <RecipeCard key={rec.slug} recipe={rec} />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-forest">{icon}</span>
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-bold text-forest-dark">{value}</span>
    </div>
  );
}

function Nutri({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-soft ring-1 ring-forest/5">
      <p className="font-serif text-2xl font-bold text-forest">{value}</p>
      <p className="text-xs text-gray-400">{unit}</p>
      <p className="mt-1 text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}
