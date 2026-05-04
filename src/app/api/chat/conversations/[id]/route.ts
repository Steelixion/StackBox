import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Fetch conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('id', id)
      .single();

    if (convError || !conversation) {
      console.error("Supabase Error (Conversation):", convError?.message);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Fetch messages linked to this conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error("Supabase Error (Messages):", msgError.message);
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
    }

    // Format messages for the UI
    const formattedMessages = messages?.map(m => ({
        id: m.id,
        role: m.role,
        text: m.content,
        timestamp: m.created_at
    })) || [];

    return NextResponse.json({ 
        conversation: {
            ...conversation,
            messages: formattedMessages
        } 
    });
    
  } catch (error) {
    console.error('[/api/chat/conversations/[id] GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}