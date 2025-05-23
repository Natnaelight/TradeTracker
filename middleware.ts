import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Check if the request is for an API route
  if (path.startsWith('/api/')) {
    // For API routes, check if the Telegram init data is present
    const telegramInitData = request.headers.get('X-Telegram-Init-Data');
    
    if (!telegramInitData && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard',
    '/add-trade',
    '/reports',
    '/capital',
  ],
};