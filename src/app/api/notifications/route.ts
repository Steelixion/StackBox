import { NextResponse } from 'next/server';
import { getNotifications, markNotificationRead } from '@/lib/notifications-db';

export async function GET() {
  const notifications = await getNotifications();
  return NextResponse.json({ notifications }, { status: 200 });
}

export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    
    const success = await markNotificationRead(id);
    if (!success) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
