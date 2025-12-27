import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if the request is an API request
    if (request.nextUrl.pathname.startsWith('/api/')) {
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            const response = new NextResponse(null, { status: 204 }); // 204 No Content is standard for OPTIONS

            const origin = request.headers.get('origin');
            if (origin) {
                response.headers.set('Access-Control-Allow-Origin', origin);
            } else {
                response.headers.set('Access-Control-Allow-Origin', '*');
            }

            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-Api-Version');
            response.headers.set('Access-Control-Allow-Credentials', 'true');
            response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

            return response;
        }

        // Handle regular requests
        const response = NextResponse.next();
        const origin = request.headers.get('origin');

        if (origin) {
            response.headers.set('Access-Control-Allow-Origin', origin);
        } else {
            response.headers.set('Access-Control-Allow-Origin', '*');
        }

        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-Api-Version');
        response.headers.set('Access-Control-Allow-Credentials', 'true');

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
