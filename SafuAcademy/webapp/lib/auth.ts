import { NextRequest } from 'next/server';
import { AuthService } from './services/auth.service';
import prisma from './prisma';

const authService = new AuthService(prisma);

export interface AuthUser {
    userId: string;
    walletAddress: string;
}

/**
 * Extract and verify JWT token from request headers
 * Returns user info if valid, null otherwise
 */
export function verifyAuth(request: NextRequest): AuthUser | null {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    return authService.verifyToken(token);
}

/**
 * Require authentication - throws if not authenticated
 */
export function requireAuth(request: NextRequest): AuthUser {
    const user = verifyAuth(request);

    if (!user) {
        throw new Error('Unauthorized');
    }

    return user;
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
    return Response.json({ error: message }, { status: 401 });
}
