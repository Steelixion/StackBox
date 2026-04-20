import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import { warehouseSearchTool } from "../src/lib/warehouseTool";

import * as dotenv from "dotenv";

// Load the API key from your .env.local file [cite: 211, 215]
dotenv.config({ path: ".env.local" });


//Initialize gemini flash
const model = new ChatGoogleGenerativeAI(
    {
        model: "gemini-3.1-flash-lite-preview",
        apiKey: process.env.GEMINI_API_KEY
    }
);

//this is the ddg search tool
const searchTool = new TavilySearch({
    maxResults: 3,
});


async function main() {
    const question = process.argv.slice(2).join(" "); //argv has first two system args, split 2 remove them
    if (!question) {
        console.error("Please provide a question as a command-line argument.");
        return
    }
    console.log(`Asking Question: ${question}`);

    //create the agent with the model and tool
    const agent = createReactAgent({
        llm: model,
        tools: [searchTool, warehouseSearchTool]
    });

    console.log("Agent is thinking...");


    // Run the agent with the question and log the final answer

    const result = await agent.invoke({
        messages: [{ role: "user", content: question}]
    });

    const lastMessage = result.messages[result.messages.length - 1];
    console.log(`Answer: ${lastMessage.content}`);

}

main();