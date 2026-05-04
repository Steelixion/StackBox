// src/lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Admin Client: URL and Service Role Key must be set");
}

// This client bypasses RLS - keep it on the server!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);