// server.js (local development server)
require('dotenv').config();
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);
console.log('PORT:', process.env.PORT);

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Dynamically load all API routes from /api folder
function loadApiRoutes(dir, basePath = '/api') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            loadApiRoutes(fullPath, `${basePath}/${entry.name}`);
        } else if (entry.name.endsWith('.js')) {
            const routePath = `${basePath}/${entry.name.replace('.js', '')}`;
            const handler = require(fullPath);
            // Support both direct exports and default exports
            const routeHandler = handler.default || handler;
            app.all(routePath, (req, res) => {
                // Add req.query params
                req.query = req.query || {};
                Object.assign(req.query, req.params);
                routeHandler(req, res);
            });
            console.log(`Mounted: ${routePath}`);
        }
    }
}

loadApiRoutes(path.join(__dirname, 'api'));

// Fallback to index.html for SPA routes (optional)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin/`);
    console.log(`🔌 API base: http://localhost:${PORT}/api`);
});