import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase
    .from('system_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map database fields to the "NotificationItem" format the frontend expects
  const notifications = data.map(alert => ({
    id: alert.id,
    title: alert.title,
    message: alert.message,
    level: alert.severity, // 'critical', 'info', etc.
    timestamp: new Date(alert.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }),
    read: false
  }));

  return NextResponse.json({ notifications });
}