import { supabase } from "./supabaseClient";

export async function ChatSaver(conversationId: string, chatName: string) {
    if (!conversationId || !chatName) {
        console.error("Missing conversationId or chatName");
        return { success: false, error: "Missing conversationId or chatName" };
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
                    { id: conversationId, title: chatName }
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