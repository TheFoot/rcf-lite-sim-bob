import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { Router } from 'express';
import { registerProjectRoutes } from './routes/projects.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

let configuredPort = 3000;
try {
  const proj = JSON.parse(readFileSync('rcf/project.json', 'utf8'));
  if (proj.ports?.app) configuredPort = proj.ports.app;
} catch {}
const PORT = process.env.PORT || configuredPort;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(express.json());

// CORS -- allow same-origin by default; loosen in dev if needed
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------

app.use(express.static(join(__dirname, '..', 'public')));

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

const apiRouter = Router();

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

registerProjectRoutes(apiRouter);

app.use('/api/v1', apiRouter);

// ---------------------------------------------------------------------------
// SPA fallback -- serve index.html for any non-API, non-static route
// ---------------------------------------------------------------------------

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

app.use((err, _req, res, _next) => {
  console.error(`[ERROR] ${_req.method} ${_req.url}:`, err.message);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

export function startServer({ port = PORT } = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const addr = server.address();
      console.log(`Server running at http://localhost:${addr.port}`);
      resolve(server);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Try: PORT=${Number(port) + 1} npm run dev`);
        process.exit(1);
      }
      reject(err);
    });
  });
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  startServer();
}
