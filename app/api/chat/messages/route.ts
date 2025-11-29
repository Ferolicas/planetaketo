import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, content } = await request.json();

    const { data: message, error } = await supabaseAdmin
      .from('Message')
      .insert({
        senderId: session.user.id,
        receiverId,
        content,
      })
      .select(`
        *,
        sender:User!senderId (
          id,
          name,
          image
        ),
        receiver:User!receiverId (
          id,
          name,
          image
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('Message')
      .select(`
        *,
        sender:User!senderId (
          id,
          name,
          image
        ),
        receiver:User!receiverId (
          id,
          name,
          image
        )
      `)
      .or(`and(senderId.eq.${session.user.id},receiverId.eq.${otherUserId}),and(senderId.eq.${otherUserId},receiverId.eq.${session.user.id})`)
      .order('createdAt', { ascending: true });

    if (error) throw error;

    // Mark messages as read
    await supabaseAdmin
      .from('Message')
      .update({ read: true })
      .eq('senderId', otherUserId)
      .eq('receiverId', session.user.id)
      .eq('read', false);

    return NextResponse.json(messages || []);
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
