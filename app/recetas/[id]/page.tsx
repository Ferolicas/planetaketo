import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Clock, TrendingUp } from 'lucide-react';
import CommentSection from '@/components/recipe/CommentSection';

async function getRecipe(slug: string) {
  try {
    const { data: recipe, error } = await supabaseAdmin
      .from('Recipe')
      .select(`
        *,
        comments:Comment (
          *,
          user:User!userId (
            id,
            name,
            image
          )
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return recipe;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return null;
  }
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    notFound();
  }

  const ingredients = recipe.ingredients as any[] || [];
  const instructions = recipe.instructions as any[] || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <article className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {recipe.image && (
            <div className="relative h-96 w-full">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {recipe.title}
            </h1>

            <div className="flex items-center gap-6 text-gray-600 mb-6">
              {recipe.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{recipe.duration}</span>
                </div>
              )}
              {recipe.difficulty && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Dificultad: {recipe.difficulty}</span>
                </div>
              )}
            </div>

            {recipe.description && (
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                {recipe.description}
              </p>
            )}

            {recipe.videoUrl && (
              <div className="mb-8">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={recipe.videoUrl}
                    title={recipe.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {ingredients.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Ingredientes
                </h2>
                <ul className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span className="text-gray-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {instructions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Instrucciones
                </h2>
                <ol className="space-y-4">
                  {instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 pt-1">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <CommentSection recipeId={recipe.id} comments={recipe.comments} />
        </div>
      </article>
    </div>
  );
}
