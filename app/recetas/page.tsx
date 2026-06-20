import type { Metadata } from 'next';
import { getAllRecipes, CATEGORIES, type Recipe } from '@/lib/recipes';
import { site } from '@/lib/site';
import RecipeCard from '@/components/recipes/RecipeCard';
import BookBanner from '@/components/recipes/BookBanner';
import ChannelBanner from '@/components/recipes/ChannelBanner';
import JsonLd from '@/components/seo/JsonLd';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Recetas Keto fáciles, sin azúcar ni harinas',
  description:
    'Todas las recetas keto de Planeta Keto: desayunos, cenas, postres, panes y salsas. Paso a paso, con ingredientes que encuentras en cualquier supermercado.',
  alternates: { canonical: '/recetas' },
};

async function safeRecipes(): Promise<Recipe[]> {
  try {
    return await getAllRecipes();
  } catch {
    return [];
  }
}

export default async function RecetasHub() {
  const recipes = await safeRecipes();

  const byCat = new Map<string, Recipe[]>();
  for (const r of recipes) {
    const c = r.category ?? 'otros';
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c)!.push(r);
  }
  const orderedCats = CATEGORIES.filter((c) => byCat.has(c.slug));

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: recipes.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${site.url}/recetas/${r.slug}`,
      name: r.title,
    })),
  };

  return (
    <div className="bg-cream">
      {recipes.length > 0 && <JsonLd data={itemList} />}
      <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-3xl font-bold text-forest-dark sm:text-4xl lg:text-5xl">
            Recetas Keto fáciles
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Sin azúcar ni harinas, paso a paso{recipes.length > 0 ? ` · ${recipes.length} recetas` : ''}. Con
            ingredientes de supermercado para que comas rico sin salirte de cetosis.
          </p>
        </header>

        {orderedCats.length > 0 && (
          <nav className="mt-8 flex flex-wrap justify-center gap-2">
            {orderedCats.map((c) => (
              <a
                key={c.slug}
                href={`#${c.slug}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-forest-dark shadow-soft ring-1 ring-forest/5 transition-colors hover:bg-mint-pale"
              >
                {c.emoji} {c.label}
              </a>
            ))}
          </nav>
        )}

        {recipes.length === 0 ? (
          <p className="mt-16 text-center text-gray-500">
            Estamos preparando nuestras recetas. ¡Vuelve muy pronto!
          </p>
        ) : (
          <>
            <BookBanner />
            {orderedCats.map((c, idx) => (
              <section key={c.slug} id={c.slug} className="mt-12 scroll-mt-24">
                <h2 className="mb-5 font-serif text-2xl font-bold text-forest-dark">
                  {c.emoji} {c.label}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {byCat.get(c.slug)!.map((r, i) => (
                    <RecipeCard key={r.slug} recipe={r} priority={idx === 0 && i < 3} />
                  ))}
                </div>
              </section>
            ))}
            <ChannelBanner />
          </>
        )}
      </div>
    </div>
  );
}
