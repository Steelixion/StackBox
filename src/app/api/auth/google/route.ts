import { NextResponse } from 'next/server';
import { upsertUser } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { access_token } = await req.json();

    if (!access_token) {
      return NextResponse.json({ error: "No access token provided" }, { status: 400 });
    }

    // Fetch user profile from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 401 });
    }

    const data = await response.json();
    
    // Check missing email
    if (!data.email) {
      return NextResponse.json({ error: "No email returned from Google" }, { status: 400 });
    }

    // Insert or update user in our db.json
    const user = await upsertUser({
      email: data.email,
      name: data.name || "User",
      picture: data.picture,
    });

    // Set a very basic plain-text cookie to simulate session
    // In production, you would use Iron-Session, Next-Auth, or JWT
    const cookieStore = await cookies();
    cookieStore.set('auth_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Auth routing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
