import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDB } from '@/lib/db';

/**
 * GET /api/auth/me
 * Returns the currently logged-in user's profile from the session cookie.
 * Returns 401 if not authenticated.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = await readDB();
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      // Cookie is stale — clear it
      const response = NextResponse.json({ error: 'User not found' }, { status: 401 });
      response.cookies.delete('auth_user_id');
      return response;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[/api/auth/me]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
