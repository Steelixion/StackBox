import { createClient } from "@supabase/supabase-js";

const isServer = typeof window === 'undefined';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Determine which key to use:
// - On the server, we prefer the Service Role Key for full access in Actions/API routes.
// - On the client, we MUST use the Anon Key (via NEXT_PUBLIC).
const key = isServer 
  ? (supabaseServiceRoleKey || supabaseAnonKey) 
  : supabaseAnonKey;

if (!supabaseUrl || !key) {
  if (isServer) {
    throw new Error("Supabase URL and Key must be set in environment variables");
  } else {
    console.warn("Supabase environment variables are missing on the client side. Some features like logout might not work.");
  }
}

// Create a dummy client if keys are missing on the client side to prevent crashes
export const supabase = (supabaseUrl && key) 
  ? createClient(supabaseUrl, key) 
  : { auth: { signOut: async () => { console.warn("Cannot sign out without env keys") } } } as any;