import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { PrismaClient } from '@prisma/client';

// Extend Express Request type to include user info
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            walletAddress?: string;
        }
    }
}

const prisma = new PrismaClient();
const authService = new AuthService(prisma);

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authorization header missing or invalid' });
        return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    req.userId = decoded.userId;
    req.walletAddress = decoded.walletAddress;
    next();
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = authService.verifyToken(token);

        if (decoded) {
            req.userId = decoded.userId;
            req.walletAddress = decoded.walletAddress;
        }
    }

    next();
}
