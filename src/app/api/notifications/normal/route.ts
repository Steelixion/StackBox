import { NextResponse } from 'next/server';
import { getNotifications } from '@/lib/notifications-db';

export async function GET() {
  const allNotifications = await getNotifications();
  const normalNotifications = allNotifications.filter(n => n.category === 'normal');
  return NextResponse.json({ notifications: normalNotifications }, { status: 200 });
}
