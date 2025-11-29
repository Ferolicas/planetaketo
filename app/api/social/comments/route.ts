import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, recipeId, content } = await request.json();

    const { data: comment, error } = await supabaseAdmin
      .from('Comment')
      .insert({
        userId: session.user.id,
        postId,
        recipeId,
        content,
      })
      .select(`
        *,
        user:User!userId (
          id,
          name,
          image
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
