import { NextResponse } from 'next/server';
import { getNotifications } from '@/lib/notifications-db';

export async function GET() {
  const allNotifications = await getNotifications();
  const shipmentNotifications = allNotifications.filter(n => n.category === 'shipment');
  return NextResponse.json({ notifications: shipmentNotifications }, { status: 200 });
}
