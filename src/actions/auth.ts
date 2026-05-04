'use server'

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function getUserProfile() {
    try {
        // Initialize Admin Client INSIDE the action
        // This ensures the secret key is only accessed on the server
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const cookieStore = await cookies();

        // Use the Admin client to verify the user via their session cookie
        // Note: In Next.js, it's often better to use @supabase/ssr, 
        // but this works for direct cookie access:
        const token = cookieStore.get('sb-access-token')?.value;

        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authUser) {
            console.warn("Auth Error or No User:", authError?.message);
            return null;
        }

        // Fetch from your table (bypassing RLS because we use the Service Role Key)
        // We try both ID and Email to be safe
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('warehouse_users')
            .select('full_name, role')
            .or(`id.eq.${authUser.id},email.eq.${authUser.email}`)
            .maybeSingle();

        if (profileError) {
            console.error("Profile Fetch Error:", profileError.message);
        }

        const name = profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || "User";
        const role = profile?.role || "Operator";

        const allowedRoles = ['Manager', 'Owner'];
        if (!allowedRoles.includes(role)) {
            console.warn(`User ${authUser.email} with role ${role} tried to access dashboard.`);
            return null; // Layout will handle redirect to login
        }

        return {
            id: authUser.id,
            email: authUser.email,
            name: name,
            picture: authUser.user_metadata?.avatar_url,
            role: role
        };


    } catch (error) {
        console.error("Server Action Exception:", error);
        return null;
    }
}