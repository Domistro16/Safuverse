import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service.js';

const router = Router();
const prisma = new PrismaClient();
const authService = new AuthService(prisma);

// Validation schemas
const getNonceSchema = z.object({
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
});

const verifySchema = z.object({
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
    signature: z.string().min(1, 'Signature required'),
});

/**
 * POST /api/auth/nonce
 * Get a nonce for the wallet to sign
 */
router.post('/nonce', async (req, res) => {
    const { walletAddress } = getNonceSchema.parse(req.body);

    const nonce = await authService.getNonceForWallet(walletAddress);
    const message = authService.createSignMessage(walletAddress.toLowerCase(), nonce);

    res.json({
        nonce,
        message,
    });
});

/**
 * POST /api/auth/verify
 * Verify the signature and return a JWT
 */
router.post('/verify', async (req, res) => {
    const { walletAddress, signature } = verifySchema.parse(req.body);

    const result = await authService.verifySignature(walletAddress, signature);

    if (!result.valid) {
        res.status(401).json({ error: result.error });
        return;
    }

    const user = await authService.getUserById(result.userId!);

    res.json({
        token: result.token,
        user,
    });
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    const user = await authService.getUserById(decoded.userId);

    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    res.json({ user });
});

export default router;
