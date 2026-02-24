import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const payload = session ? await decrypt(session) : null;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  if (!payload && !isAuthPage && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (payload && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (payload && request.nextUrl.pathname.startsWith('/admin') && payload.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
