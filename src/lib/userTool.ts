import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { supabase } from "./supabaseClient";

export const getUserContactTool = tool(
  async ({ role }) => {
    const { data, error } = await supabase
      .from('warehouse_users')
      .select('email, full_name')
      .eq('role', role.toLowerCase())
      .single();

    if (error || !data) return `Could not find a user with the role: ${role}`;

    return `The ${role} is ${data.full_name} and their email is ${data.email}.`;
  },
  {
    name: "get_user_contact",
    description: "Searches the warehouse directory for a person's email based on their role (e.g., 'manager').",
    schema: z.object({
      role: z.string().describe("The role to search for, like 'manager' or 'owner'"),
    }),
  }
);