import { DynamicTool } from "@langchain/core/tools";
import { supabase } from "./supabaseClient";

export const warehouseSearchTool = new DynamicTool({
    name: "search_warehouse_inventory",
    description: "Search the warehouse inventory for a specific item. Input should be the name of the item to search for.",
    func: async (input: string) => {
        const { data, error } = await supabase
            .from("items")
            .select("*")
            .ilike("name", `%${input}%`);
        if (error) {
            console.error("Error searching warehouse inventory:", error);
            return `Error searching warehouse inventory: ${error.message}`;
        }
        return JSON.stringify(data);
    }
});