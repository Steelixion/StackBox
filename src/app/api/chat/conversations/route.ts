import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/actions/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profile = await getUserProfile();

    if (!profile) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });


    if (error) {
      console.error("Supabase Error:", error.message);
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
    }

    const summaries = data?.map(({ id, title, created_at }) => ({ 
        id, 
        title, 
        createdAt: created_at 
    })) || [];

    return NextResponse.json({ conversations: summaries });
    
  } catch (error) {
    console.error('[/api/chat/conversations GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}