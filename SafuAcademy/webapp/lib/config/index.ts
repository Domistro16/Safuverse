// Environment configuration for SafuAcademy
// Works with Next.js environment variables

export const config = {
    // Server
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
    // Note: Owner transactions are signed via MetaMask on frontend, not via backend

    // S3/R2 Storage
    s3Region: process.env.S3_REGION || 'auto',
    s3Endpoint: process.env.S3_ENDPOINT,
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretKey: process.env.S3_SECRET_KEY,
    s3Bucket: process.env.S3_BUCKET || 'safuacademy-videos',

    // Admin
    adminAddresses: (process.env.ADMIN_ADDRESSES || '').split(',').map(a => a.trim().toLowerCase()).filter(Boolean),
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

// Check if S3 is configured
export function isS3Configured(): boolean {
    return !!(config.s3Endpoint && config.s3AccessKey && config.s3SecretKey);
}

