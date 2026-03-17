import { auth } from './src/auth';
import { NextResponse } from 'next/server';

export default auth((req: any) => {
  const isAuthenticated = !!req.auth;
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isLogin = req.nextUrl.pathname === '/login';

  if (isDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isLogin && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
});

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard', '/login'],
};
