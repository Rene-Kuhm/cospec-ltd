import { auth } from './src/auth';
import { Rol } from '@cospec/shared-types';
import { NextResponse } from 'next/server';

const WEB_ALLOWED_ROLES = new Set<Rol>([Rol.ADMIN, Rol.OPERADOR]);

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.rol;
  const hasWebAccess = userRole ? WEB_ALLOWED_ROLES.has(userRole) : false;
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isLogin = req.nextUrl.pathname === '/login';

  if (isDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isDashboard && !hasWebAccess) {
    return NextResponse.redirect(new URL('/login?error=role-denied', req.url));
  }

  if (isLogin && isAuthenticated && hasWebAccess) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
});

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard', '/login'],
};
