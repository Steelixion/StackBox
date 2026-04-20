import { NextResponse } from 'next/server';
import { getConversationById } from '@/lib/chat-db';

/**
 * GET /api/chat/conversations/[id]
 * Returns a single conversation with its full message history.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conv = await getConversationById(id);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    return NextResponse.json({ conversation: conv });
  } catch (error) {
    console.error('[/api/chat/conversations/[id] GET]', error);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}
