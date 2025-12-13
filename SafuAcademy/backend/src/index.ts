import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import { config, validateConfig } from './config/index.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware.js';
import { RelayerService } from './services/relayer.service.js';

import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import lessonRoutes from './routes/lesson.routes.js';
import userRoutes from './routes/user.routes.js';

// Validate environment variables
try {
    validateConfig();
} catch (error) {
    console.error('Configuration error:', (error as Error).message);
    console.log('Continuing with available configuration for development...');
}

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        // Check relayer setup
        const relayerService = new RelayerService(prisma);
        const relayerCheck = await relayerService.verifyRelayerSetup();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
            relayer: relayerCheck.valid ? 'configured' : 'error',
            relayerError: relayerCheck.error,
            relayerAddress: await relayerService.getRelayerAddress(),
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: (error as Error).message,
        });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/user', userRoutes);

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

// Start server
const PORT = config.port;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          SafuAcademy Backend Server Started                ║
╠════════════════════════════════════════════════════════════╣
║  Server:     http://localhost:${PORT}                         ║
║  Health:     http://localhost:${PORT}/api/health              ║
║  Env:        ${config.nodeEnv.padEnd(43)}║
║  Chain ID:   ${String(config.chainId).padEnd(43)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
