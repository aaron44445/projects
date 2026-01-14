import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/calendar',
  '/clients',
  '/services',
  '/staff',
  '/packages',
  '/gift-cards',
  '/marketing',
  '/reviews',
  '/reports',
  '/settings',
  '/onboarding',
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check for access token in cookies
  const accessToken = request.cookies.get('access_token');
  const isAuthenticated = !!accessToken;

  // Redirect to login if trying to access protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if trying to access auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
