import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

    
const supabaseUrl = process.env.SUPABASE_URL || ' ';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ' ';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
export { supabase };