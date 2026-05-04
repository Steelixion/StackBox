'use server'

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getUserProfile } from "./auth";

export async function createEmployee(formData: FormData) {
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string; // 'Manager' or 'Employee'
    const password = formData.get('password') as string;

    // ── Security Check: Managers can only create Employees ──────────────────
    const currentUser = await getUserProfile();
    if (currentUser?.role === 'Manager' && role !== 'Employee') {
        return { success: false, error: "Access Denied: Managers can only create Employee accounts." };
    }

    try {
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) {
            console.error("Auth Creation Error:", authError.message);
            // Handle common auth errors
            if (authError.message.includes('already registered')) {
                return { success: false, error: "An account with this email already exists." };
            }
            return { success: false, error: authError.message };
        }

        // 2. Create profile in warehouse_users
        const { error: profileError } = await supabaseAdmin
            .from('warehouse_users')
            .insert([{
                id: authData.user.id,
                full_name: fullName,
                email: email,
                role: role
            }]);

        if (profileError) {
            console.error("Profile Creation Error:", profileError);
            
            // Handle Unique Constraint Violation (Postgres code 23505)
            if (profileError.code === '23505') {
                if (profileError.message.includes('role')) {
                    return { success: false, error: `The role "${role}" is already taken. Each role must be unique per your system configuration.` };
                }
                return { success: false, error: "This employee or email is already registered in the warehouse database." };
            }
            
            return { success: false, error: profileError.message };
        }


        revalidatePath('/dashboard/employees');
        return { success: true };
    } catch (error) {
        console.error("Unexpected Error:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

export async function fetchEmployees() {
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
        .from('warehouse_users')
        .select('*')
        .order('full_name', { ascending: true });

    if (error) {
        console.error("Fetch Employees Error:", error.message);
        return [];
    }

    return data;
}

export async function deleteEmployee(id: string) {
    try {
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Delete from warehouse_users
        const { error: profileError } = await supabaseAdmin
            .from('warehouse_users')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error("Profile Deletion Error:", profileError);
            
            // Handle Foreign Key Violation (Postgres code 23503)
            if (profileError.code === '23503') {
                return { 
                    success: false, 
                    error: "Cannot delete this employee because they are linked to existing records (like boxes or strategies). Please reassign their items first." 
                };
            }
            
            return { success: false, error: profileError.message };
        }


        // 2. Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            // Note: If they are deleted from profile but not auth, it might be messy, 
            // but usually this means they just can't log in to the app specifically.
            console.error("Auth Deletion Error:", authError.message);
            return { success: false, error: authError.message };
        }

        revalidatePath('/dashboard/employees');
        return { success: true };
    } catch (error) {
        console.error("Unexpected Error during deletion:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}

