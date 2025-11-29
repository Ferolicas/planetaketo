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

    const { title, content, author } = await request.json();
    const slug = generateSlug(title);

    const { data: thread, error } = await supabaseAdmin
      .from('forumThread')
      .insert({
        title,
        slug,
        content,
        author,
        isPublished: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Create forum thread error:', error);
    return NextResponse.json({ error: 'Failed to create forum thread' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: threads, error } = await supabaseAdmin
      .from('forumThread')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json(threads);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch forum threads' }, { status: 500 });
  }
}
