import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { supabase } from "./supabaseClient";

export const emailTool = tool(
  async ({ recipient, subject, body }) => {
    // This is the line that actually "adds" the email to the table
    const { data, error } = await supabase
      .from('emails')
      .insert([{ recipient, subject, body }]) 
      .select();

    if (error) {
      return `Error saving email to database: ${error.message}`;
    }

    return `Email drafted and saved to Supabase. Webhook should trigger delivery to ${recipient}.`;
  },
  {
    name: "send_warehouse_email",
    description: "Saves an email to the database which triggers a real email send via webhook.",
    schema: z.object({
      recipient: z.string().describe("The email address of the manager/owner"),
      subject: z.string().describe("The email subject"),
      body: z.string().describe("The body of the email (can include HTML tables)"),
    }),
  }
);