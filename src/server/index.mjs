/**
 * Meeting Notes -- Express server entry point.
 * Traces: REQ-001, REQ-002, REQ-003, REQ-004
 */

import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { Router } from 'express';
import { registerMeetingRoutes } from './routes/meetings.mjs';
import { registerActionItemRoutes } from './routes/action-items.mjs';
import { errorHandler } from './middleware/error-handler.mjs';
import { rateLimiter } from './middleware/rate-limiter.mjs';

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

// CORS
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
apiRouter.use(rateLimiter);

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

registerMeetingRoutes(apiRouter);
registerActionItemRoutes(apiRouter);

app.use('/api/v1', apiRouter);

// ---------------------------------------------------------------------------
// SPA fallback
// ---------------------------------------------------------------------------

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

app.use(errorHandler);

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
