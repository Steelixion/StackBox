import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'Notifications.json');

export interface NotificationItem {
  id: string;
  category: 'shipment' | 'normal';
  level: 'critical' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationsSchema {
  notifications: NotificationItem[];
}

const DEFAULT_DB: NotificationsSchema = { notifications: [] };

export async function readNotificationsDB(): Promise<NotificationsSchema> {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    return DEFAULT_DB;
  }
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return { ...DEFAULT_DB, ...JSON.parse(raw) } as NotificationsSchema;
  } catch (error) {
    console.error('[notifications-db] read failed:', error);
    return DEFAULT_DB;
  }
}

export async function writeNotificationsDB(data: NotificationsSchema): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[notifications-db] write failed:', error);
  }
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const db = await readNotificationsDB();
  return db.notifications;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const db = await readNotificationsDB();
  const idx = db.notifications.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  
  db.notifications[idx].read = true;
  await writeNotificationsDB(db);
  return true;
}
