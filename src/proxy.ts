import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @file proxy.ts
 * Route-level authentication guard (Next.js 16 proxy convention).
 * Runs on the Edge before any Server Component renders.
 *
 * Protected: /dashboard and all sub-paths.
 * If `auth_user_id` cookie is absent → redirect to /login.
 * If user is already logged in and hits /login → redirect to /dashboard.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = request.cookies.get('auth_user_id')?.value;

  // Protect /dashboard/**
  if (pathname.startsWith('/dashboard')) {
    if (!userId) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated, bounce away from /login
  if (pathname === '/login' && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
