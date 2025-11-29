import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth/session';
import { startOfDay, endOfDay } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already posted today
    const today = new Date();
    const { count } = await supabaseAdmin
      .from('Post')
      .select('*', { count: 'exact', head: true })
      .eq('userId', session.user.id)
      .gte('createdAt', startOfDay(today).toISOString())
      .lte('createdAt', endOfDay(today).toISOString());

    if (count && count >= 1) {
      return NextResponse.json(
        { error: 'Solo puedes publicar 1 post por día' },
        { status: 400 }
      );
    }

    const { content, image } = await request.json();

    const { data: post, error } = await supabaseAdmin
      .from('Post')
      .insert({
        userId: session.user.id,
        content,
        image,
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

    return NextResponse.json(post);
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = supabaseAdmin
      .from('Post')
      .select(`
        *,
        user:User!userId (
          id,
          name,
          image
        ),
        comments:Comment (
          *,
          user:User!userId (
            id,
            name,
            image
          )
        )
      `)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    return NextResponse.json(posts || []);
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
