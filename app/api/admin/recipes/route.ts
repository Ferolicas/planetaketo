import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth/session';
import { generateSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, image, videoUrl, duration, difficulty, ingredients, instructions } =
      await request.json();

    const slug = generateSlug(title);

    const { data: recipe, error } = await supabaseAdmin
      .from('recipe')
      .insert({
        title,
        slug,
        description,
        image,
        videoUrl,
        duration,
        difficulty,
        ingredients,
        instructions,
        isPublished: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Create recipe error:', error);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: recipes, error } = await supabaseAdmin
      .from('recipe')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
