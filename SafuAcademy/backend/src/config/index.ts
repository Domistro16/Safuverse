import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL!,

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // Blockchain
    rpcUrl: process.env.RPC_URL || 'https://bsc-dataseed.binance.org/',
    chainId: parseInt(process.env.CHAIN_ID || '56', 10),
    level3CourseAddress: process.env.LEVEL3_COURSE_ADDRESS!,
    relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY!,

    // CORS
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(','),

    // Rate limiting
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // 100 requests per window
};

// Validate required environment variables
export function validateConfig(): void {
    const required = [
        'DATABASE_URL',
        'JWT_SECRET',
        'LEVEL3_COURSE_ADDRESS',
        'RELAYER_PRIVATE_KEY',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
