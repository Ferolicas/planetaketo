import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const { data: existingFollow } = await supabaseAdmin
      .from('Follow')
      .select('*')
      .eq('followerId', session.user.id)
      .eq('followingId', userId)
      .single();

    if (existingFollow) {
      // Unfollow
      await supabaseAdmin
        .from('Follow')
        .delete()
        .eq('followerId', session.user.id)
        .eq('followingId', userId);
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await supabaseAdmin
        .from('Follow')
        .insert({
          followerId: session.user.id,
          followingId: userId,
        });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Failed to follow/unfollow' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'followers' or 'following'
    const userId = searchParams.get('userId') || session.user.id;

    if (type === 'followers') {
      const { data: followers, error } = await supabaseAdmin
        .from('Follow')
        .select(`
          follower:User!followerId (
            id,
            name,
            image
          )
        `)
        .eq('followingId', userId);

      if (error) throw error;
      return NextResponse.json(followers?.map(f => f.follower) || []);
    } else {
      const { data: following, error } = await supabaseAdmin
        .from('Follow')
        .select(`
          following:User!followingId (
            id,
            name,
            image
          )
        `)
        .eq('followerId', userId);

      if (error) throw error;
      return NextResponse.json(following?.map(f => f.following) || []);
    }
  } catch (error) {
    console.error('Fetch follows error:', error);
    return NextResponse.json({ error: 'Failed to fetch follows' }, { status: 500 });
  }
}
