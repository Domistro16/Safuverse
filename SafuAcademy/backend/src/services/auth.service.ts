import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

export class AuthService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    generateNonce(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    async getNonceForWallet(walletAddress: string): Promise<string> {
        const address = walletAddress.toLowerCase();

        let user = await this.prisma.user.findUnique({
            where: { walletAddress: address },
        });

        if (!user) {
            const nonce = this.generateNonce();
            user = await this.prisma.user.create({
                data: {
                    walletAddress: address,
                    nonce,
                },
            });
        } else {
            // Generate new nonce for each auth attempt
            const nonce = this.generateNonce();
            user = await this.prisma.user.update({
                where: { walletAddress: address },
                data: { nonce },
            });
        }

        return user.nonce;
    }

    createSignMessage(walletAddress: string, nonce: string): string {
        return `Welcome to SafuAcademy!\n\nSign this message to authenticate.\n\nWallet: ${walletAddress}\nNonce: ${nonce}`;
    }

    async verifySignature(
        walletAddress: string,
        signature: string
    ): Promise<{ valid: boolean; token?: string; userId?: string; error?: string }> {
        try {
            const address = walletAddress.toLowerCase();

            const user = await this.prisma.user.findUnique({
                where: { walletAddress: address },
            });

            if (!user) {
                return { valid: false, error: 'User not found. Request nonce first.' };
            }

            // Create the message that was signed
            const message = this.createSignMessage(address, user.nonce);

            // Recover the address from the signature
            const recoveredAddress = ethers.verifyMessage(message, signature);

            if (recoveredAddress.toLowerCase() !== address) {
                return { valid: false, error: 'Invalid signature' };
            }

            // Rotate nonce after successful verification
            await this.prisma.user.update({
                where: { walletAddress: address },
                data: { nonce: this.generateNonce() },
            });

            // Generate JWT
            const token = this.generateToken(user.id, address);

            return { valid: true, token, userId: user.id };
        } catch (error) {
            console.error('Signature verification error:', error);
            return { valid: false, error: 'Signature verification failed' };
        }
    }

    generateToken(userId: string, walletAddress: string): string {
        return jwt.sign(
            { userId, walletAddress },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
        );
    }

    verifyToken(token: string): { userId: string; walletAddress: string } | null {
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as {
                userId: string;
                walletAddress: string;
            };
            return decoded;
        } catch {
            return null;
        }
    }

    async getUserById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                walletAddress: true,
                points: true,
                createdAt: true,
            },
        });
    }

    async getUserByWallet(walletAddress: string) {
        return this.prisma.user.findUnique({
            where: { walletAddress: walletAddress.toLowerCase() },
            select: {
                id: true,
                walletAddress: true,
                points: true,
                createdAt: true,
            },
        });
    }
}
