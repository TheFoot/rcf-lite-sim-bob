import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------

app.use(express.static(join(__dirname, '..', 'public')));

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// SPA fallback -- serve index.html for any non-API, non-static route
// ---------------------------------------------------------------------------

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

export function startServer(port = PORT) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      const addr = server.address();
      console.log(`Server running at http://localhost:${addr.port}`);
      resolve(server);
    });
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  startServer();
}
