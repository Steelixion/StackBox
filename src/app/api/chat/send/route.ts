import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TavilySearch } from "@langchain/tavily";
import { warehouseSearchTool } from "@/lib/warehouseTool";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getConversationHistory, saveChatExchange } from "@/lib/ChatHistory";
import { emailTool } from "@/lib/emailTool";
import { getUserContactTool } from "@/lib/userTool";
import { ChatSaver } from "@/lib/ChatSaver";

export async function POST(req: Request) {
  try {
    const { message, conversationId, role } = await req.json();


    const ownerPrompt = `You are a Business Consultant for a Warehouse Owner. 
    Focus on financial health and market opportunities. Avoid deep technical jargon.`;

    const managerPrompt = `You are an Operations Lead for a Warehouse Manager. 
    Focus on precision, inventory counts, and logistics IDs. Be very technical.`;

    const activeSystemPrompt = role === 'owner' ? ownerPrompt : managerPrompt;

    const formattedHistory = await getConversationHistory(conversationId);


    console.log("Received message:", conversationId);

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }


    const userMessage = message;
    const chatTitle = userMessage.substring(0, 30) + "..."; 
    await ChatSaver(conversationId, chatTitle);

    const model = new ChatGoogleGenerativeAI(

      {

         model: "gemini-3.1-flash-lite-preview",
        apiKey: process.env.GEMINI_API_KEY

      }

    );


    const searchTool = new TavilySearch({
      maxResults: 3,
    });

    const agent = createReactAgent({
      llm: model,
      tools: [searchTool, warehouseSearchTool, emailTool, getUserContactTool],
    });

    const res = await agent.invoke({
      messages: [
        { role: "system", content: activeSystemPrompt }, // The Persona
        ...formattedHistory,                             // Conversation History
        { role: "user", content: message }              // The User Query
      ]
    });

    const latestMessage = res.messages[res.messages.length - 1];
    const aiResponse = latestMessage.content;

    await saveChatExchange(conversationId, message, aiResponse);

    return NextResponse.json({
      message: { role: 'ai', text: aiResponse },
      conversationId: conversationId || "new-id"
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}