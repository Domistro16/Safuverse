// server.js - cPanel & Vercel deployment server
// Serves Vite frontend + Express backend API
require('express-async-errors'); // Must be one of the first imports
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const serverless = require('serverless-http');

const app = express();

const backendDistPath = path.join(__dirname, 'backend', 'dist');

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
    credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// ============================================
// BACKEND API ROUTES
// ============================================

// Import backend routes (compiled from TypeScript)
const fs = require('fs');

if (fs.existsSync(backendDistPath)) {
    console.log('✅ Loading backend API routes...');

    // Import compiled routes
    // Using try-catch to avoid crashing if files are missing despite check
    try {
        const authRoutes = require('./backend/dist/routes/auth.routes.js').default;
        const courseRoutes = require('./backend/dist/routes/course.routes.js').default;
        const lessonRoutes = require('./backend/dist/routes/lesson.routes.js').default;
        const userRoutes = require('./backend/dist/routes/user.routes.js').default;
        const { notFoundMiddleware, errorMiddleware } = require('./backend/dist/middleware/error.middleware.js');

        // Mount API routes
        app.use('/api/auth', authRoutes);
        app.use('/api/courses', courseRoutes);
        app.use('/api/lessons', lessonRoutes);
        app.use('/api/user', userRoutes);

        console.log('✅ Backend API routes mounted');

        // Error handling middleware (must be registered after routes)
        // We only register them for /api routes to avoid interfering with frontend 404
        // Actually, errorMiddleware should be global for API errors.
        // notFoundMiddleware might clash with frontend SPA catch-all.
        // So let's mount notFoundHandler ONLY for /api prefix if possible, or just skip it and let standard 404 JSON response from express handle it if frontend doesn't catch it.
        // Better: Explicitly handle 404 for /api/* before the SPA wildcard.
        app.use('/api/*', (req, res, next) => {
            // This catches any unhandled /api/ calls
            res.status(404).json({ error: 'API endpoint not found' });
        });

        // Register error handler
        app.use(errorMiddleware);

    } catch (err) {
        console.error('❌ Error loading backend routes:', err.message);
    }
} else {
    console.log('⚠️ Backend not compiled. Run: cd backend && npm run build');
}

// Health check endpoint (always available)
app.get('/api/health', async (req, res) => {
    const status = {
        ok: true,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'production',
        database: 'unknown',
        backend: fs.existsSync(backendDistPath) ? 'loaded' : 'not-compiled',
    };

    // Check database connection if Prisma is available
    try {
        if (fs.existsSync(backendDistPath)) {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            await prisma.$queryRaw`SELECT 1`;
            status.database = 'connected';
            await prisma.$disconnect();
        }
    } catch (e) {
        status.database = 'error: ' + e.message;
    }

    res.json(status);
});

// ============================================
// STATIC FRONTEND
// ============================================

// Serve static Vite build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback for client-side routing
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // If running in Vercel function, we don't serve static files this way usually,
        // but good fallback.
        res.status(404).json({
            error: 'Frontend not built',
            message: 'Run: npm run build:frontend && npm run copy:dist'
        });
    }
});

// START SERVER (Local / cPanel)
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`
    ╔════════════════════════════════════════════════════════════╗
    ║          SafuAcademy Server (cPanel/Local)                 ║
    ╠════════════════════════════════════════════════════════════╣
    ║  Server:     http://localhost:${port}                         ║
    ║  API:        http://localhost:${port}/api                     ║
    ║  Health:     http://localhost:${port}/api/health              ║
    ║  Frontend:   ${distPath}
    ╚════════════════════════════════════════════════════════════╝
      `);
    });
}

// Export for Vercel
module.exports = app;
module.exports.handler = serverless(app);
