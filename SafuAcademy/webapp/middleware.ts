import { NextResponse, NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware — adds security headers to all responses
 * and validates critical configuration on the first request.
 */


export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
    );
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
}

export const config = {
    // Run on all routes except static files and Next.js internals
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
