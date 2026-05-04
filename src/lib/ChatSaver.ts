import { supabase } from "./supabaseClient";

export async function ChatSaver(conversationId: string, chatName: string, userId: string) {
    if (!conversationId || !chatName || !userId) {
        console.error("Missing conversationId, chatName or userId");
        return { success: false, error: "Missing conversationId, chatName or userId" };
    }

    try {

        const { data: existingChat, error: checkError } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', conversationId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error("Error checking conversation:", checkError);
            return { success: false, error: checkError.message };
        }

        if (!existingChat) {
            const { error: insertError } = await supabase
                .from('conversations')
                .insert([
                    { id: conversationId, title: chatName, user_id: userId }
                ]);

            if (insertError) {
                console.error("Failed to save new conversation:", insertError);
                return { success: false, error: insertError.message };
            }
        }


        return { success: true };

    } catch (err) {
        console.error("Unexpected error saving chat:", err);
        return { success: false, error: "Internal Server Error" };
    }
}