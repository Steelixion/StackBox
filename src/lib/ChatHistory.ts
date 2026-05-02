import { supabase } from "./supabaseClient";



export async function getConversationHistory(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error fetching history:", error);
    return [];
  }

  return data.map(msg => ({
    role: msg.role === 'ai' ? 'assistant' : 'user',
    content: msg.content
  }));
}


export async function saveChatExchange(conversationId: string, userMessage: string, aiResponse: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      { 
        conversation_id: conversationId, 
        role: 'user', 
        content: userMessage 
      },
      { 
        conversation_id: conversationId, 
        role: 'ai', 
        content: aiResponse 
      }
    ]);

  if (error) {
    console.error("Error saving chat history:", error.message);
    return { success: false, error };
  }

  return { success: true, data };
}