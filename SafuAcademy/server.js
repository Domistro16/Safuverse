// server.js - cPanel deployment server
// Serves both the Vite frontend and Express API
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'production'
    });
});

// Mount backend API routes if the backend is built
// In production, the backend TypeScript is compiled to JavaScript
try {
    // Try to load the compiled backend
    const backendPath = path.join(__dirname, 'backend', 'dist', 'index.js');
    const fs = require('fs');

    if (fs.existsSync(backendPath)) {
        // Backend exists as compiled JS
        const backendApp = require(backendPath);
        console.log('✅ Backend API loaded from compiled output');
    } else {
        console.log('⚠️ Backend not compiled. Using standalone health endpoint.');
    }
} catch (e) {
    console.log('⚠️ Backend not available:', e.message);
}

// Serve static Vite build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback for client-side routing
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    const fs = require('fs');

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({
            error: 'Frontend not built',
            message: 'Run: cd frontend && npm run build, then copy dist to root'
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
║  Health:     http://localhost:${port}/api/health              ║
║  Static:     ${distPath}
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
