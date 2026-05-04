import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // ── Role Check ──────────────────────────────────────────────────────────
    // Only Managers and Owners can log in to the web app
    const { data: profile } = await supabase
      .from('warehouse_users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const allowedRoles = ['Manager', 'Owner'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      // Sign out immediately if not allowed
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Access denied. Only Managers and Owners can access the dashboard.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}