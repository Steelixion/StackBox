import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * Clears the authentication cookie and returns a redirect to /login.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_user_id');
  return NextResponse.json({ success: true });
}
