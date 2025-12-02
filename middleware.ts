import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // CRITICAL: Never redirect API routes, especially webhooks
  // Stripe webhooks MUST receive direct responses, not redirects
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For non-API routes, you can add other middleware logic here
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
