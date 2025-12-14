// server.js - cPanel deployment server
// Serves Vite frontend + Express backend API
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
    credentials: true,
}));
app.use(express.json());

// ============================================
// BACKEND API ROUTES
// ============================================

// Import backend routes (compiled from TypeScript)
const backendDistPath = path.join(__dirname, 'backend', 'dist');
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

        // Mount API routes
        app.use('/api/auth', authRoutes);
        app.use('/api/courses', courseRoutes);
        app.use('/api/lessons', lessonRoutes);
        app.use('/api/user', userRoutes);

        console.log('✅ Backend API routes mounted');
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
        res.status(404).json({
            error: 'Frontend not built',
            message: 'Run: npm run build:frontend && npm run copy:dist'
        });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          SafuAcademy Server (cPanel)                       ║
╠════════════════════════════════════════════════════════════╣
║  Server:     http://localhost:${port}                         ║
║  API:        http://localhost:${port}/api                     ║
║  Health:     http://localhost:${port}/api/health              ║
║  Frontend:   ${distPath}
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
