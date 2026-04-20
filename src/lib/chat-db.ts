/**
 * @file src/lib/chat-db.ts
 * Chat history data access layer backed by chat.json.
 * Swap readChatDB/writeChatDB for a real DB adapter without touching any route or UI code.
 */

import fs from 'fs/promises';
import path from 'path';

const CHAT_DB_PATH = path.join(process.cwd(), 'chat.json');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

interface ChatSchema {
  conversations: Conversation[];
}

// ─── Core Read / Write ───────────────────────────────────────────────────────

const DEFAULT_CHAT: ChatSchema = { conversations: [] };

export async function readChatDB(): Promise<ChatSchema> {
  try {
    await fs.access(CHAT_DB_PATH);
    const raw = await fs.readFile(CHAT_DB_PATH, 'utf-8');
    return JSON.parse(raw) as ChatSchema;
  } catch {
    await fs.writeFile(CHAT_DB_PATH, JSON.stringify(DEFAULT_CHAT, null, 2), 'utf-8');
    return DEFAULT_CHAT;
  }
}

export async function writeChatDB(data: ChatSchema): Promise<void> {
  await fs.writeFile(CHAT_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Repository ──────────────────────────────────────────────────────────────

export async function getConversations(): Promise<Conversation[]> {
  const db = await readChatDB();
  // Return newest first
  return [...db.conversations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const db = await readChatDB();
  return db.conversations.find((c) => c.id === id) ?? null;
}

export async function createConversation(firstUserMessage: string): Promise<Conversation> {
  const db = await readChatDB();
  const conv: Conversation = {
    id: `conv-${Date.now()}`,
    title: firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? '...' : ''),
    createdAt: new Date().toISOString(),
    messages: [],
  };
  db.conversations.unshift(conv);
  await writeChatDB(db);
  return conv;
}

export async function appendMessage(
  conversationId: string,
  role: 'user' | 'ai',
  text: string
): Promise<ChatMessage> {
  const db = await readChatDB();
  const conv = db.conversations.find((c) => c.id === conversationId);
  if (!conv) throw new Error(`Conversation ${conversationId} not found`);

  const msg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
    timestamp: new Date().toISOString(),
  };
  conv.messages.push(msg);
  await writeChatDB(db);
  return msg;
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await readChatDB();
  db.conversations = db.conversations.filter((c) => c.id !== id);
  await writeChatDB(db);
}
