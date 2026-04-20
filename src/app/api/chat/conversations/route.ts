import { NextResponse } from 'next/server';
import { getConversations } from '@/lib/chat-db';

/**
 * GET /api/chat/conversations
 * Returns the list of all conversations (newest first), without messages.
 */
export async function GET() {
  try {
    const convos = await getConversations();
    // Strip messages for the sidebar list to keep response small
    const summaries = convos.map(({ id, title, createdAt }) => ({ id, title, createdAt }));
    return NextResponse.json({ conversations: summaries });
  } catch (error) {
    console.error('[/api/chat/conversations GET]', error);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}
