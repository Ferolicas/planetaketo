import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { Recipe } from '@/lib/recipes';
import { categoryLabel, humanDuration } from '@/lib/recipes';

/** Tarjeta de receta para los grids del hub y de relacionadas. Mobile-first. */
export default function RecipeCard({ recipe, priority = false }: { recipe: Recipe; priority?: boolean }) {
  const time = humanDuration(recipe.totalMinutes);
  return (
    <Link
      href={`/recetas/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-forest/5 transition-shadow hover:shadow-card"
    >
      <div className="relative aspect-video overflow-hidden bg-mint-pale/40">
        {recipe.imageUrl && (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-xs font-semibold text-forest-dark backdrop-blur">
          {categoryLabel(recipe.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg font-bold leading-snug text-forest-dark line-clamp-2 group-hover:text-forest">
          {recipe.title}
        </h3>
        {recipe.summary && <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{recipe.summary}</p>}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          {time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-forest" /> {time}
            </span>
          )}
          {recipe.nutrition?.calories ? <span>{recipe.nutrition.calories} kcal</span> : null}
        </div>
      </div>
    </Link>
  );
}
