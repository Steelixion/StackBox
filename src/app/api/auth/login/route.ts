import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDB } from '@/lib/db';

/**
 * POST /api/auth/login
 * Email + password credential login against the local JSON database.
 *
 * In production: replace the plain-text comparison with bcrypt.compare()
 * and store bcrypt hashes in the DB instead of raw passwords.
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = await readDB();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    // User not found or password mismatch
    // NOTE: In production use bcrypt.compare(password, user.passwordHash)
    if (!user || (user as { passwordHash?: string }).passwordHash !== password) {
      // Artificial delay to prevent brute-force enumeration
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Set persistent session cookie (7 days)
    const cookieStore = await cookies();
    cookieStore.set('auth_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Never return the password hash to the client
    const { passwordHash: _, ...safeUser } = user as typeof user & { passwordHash?: string };
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('[/api/auth/login]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
