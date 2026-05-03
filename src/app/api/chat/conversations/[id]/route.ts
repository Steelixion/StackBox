import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Error:", error.message);
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
    }

    // 2. Send the real data back to page.tsx
    return NextResponse.json({ conversations: data || [] });
    
  } catch (error) {
    console.error('[/api/chat/conversations GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}