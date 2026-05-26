#!/usr/bin/env node

/**
 * RCF Lite Dashboard Server
 *
 * Minimal HTTP server that serves the dashboard UI, provides a JSON API
 * for reading RCF project data, and pushes live updates via SSE.
 *
 * Usage:
 *   node tools/dashboard/server.mjs --root /path/to/project --port 3001
 *
 * Zero npm dependencies -- uses only Node built-ins.
 */

import { createServer } from 'node:http';
import { readFile, readdir, stat, watch } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// CLI arguments
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    port: { type: 'string', short: 'p', default: '3001' },
    root: { type: 'string', short: 'r', default: process.cwd() },
  },
  strict: false,
});

const PORT = Number(args.port);
const PROJECT_ROOT = resolve(args.root);
const RCF_DIR = join(PROJECT_ROOT, 'rcf');
const PUBLIC_DIR = new URL('./public/', import.meta.url).pathname;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
};

/** Attempt to read and parse a JSON file; return null on failure. */
async function readJson(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Read all JSON files from a directory, returning an array. */
async function readJsonDir(dirPath) {
  try {
    const entries = await readdir(dirPath);
    const jsons = entries.filter(f => f.endsWith('.json'));
    const results = await Promise.all(
      jsons.map(f => readJson(join(dirPath, f)))
    );
    return results.filter(Boolean);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// API: assemble full project data
// ---------------------------------------------------------------------------

async function getProjectData() {
  const [project, prd, design, trace] = await Promise.all([
    readJson(join(RCF_DIR, 'project.json')),
    readJson(join(RCF_DIR, 'prd.json')),
    readJson(join(RCF_DIR, 'design.json')),
    readJson(join(RCF_DIR, 'trace.json')),
  ]);

  const [buildSpecs, testSpecs] = await Promise.all([
    readJsonDir(join(RCF_DIR, 'build-specs')),
    readJsonDir(join(RCF_DIR, 'tests')),
  ]);

  return {
    project,
    prd,
    design,
    buildSpecs,
    testSpecs,
    trace,
    _meta: {
      rootDir: PROJECT_ROOT,
      rcfDir: RCF_DIR,
      timestamp: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// SSE: file watcher + event broadcasting
// ---------------------------------------------------------------------------

/** @type {Set<import('node:http').ServerResponse>} */
const sseClients = new Set();

function broadcastEvent(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
}

/** Start a recursive watcher on the rcf/ directory. */
async function startWatcher() {
  try {
    await stat(RCF_DIR);
  } catch {
    console.warn(`[dashboard] Warning: ${RCF_DIR} does not exist yet. Watcher will retry.`);
    // Retry in 5s -- the directory may be created later
    setTimeout(startWatcher, 5000);
    return;
  }

  try {
    const watcher = watch(RCF_DIR, { recursive: true });
    for await (const event of watcher) {
      // Debounce: ignore non-JSON changes
      if (event.filename && event.filename.endsWith('.json')) {
        broadcastEvent('change', {
          type: event.eventType,
          file: event.filename,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error('[dashboard] Watcher error:', err.message);
    // Restart after a brief pause
    setTimeout(startWatcher, 2000);
  }
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // --- API: project data ---------------------------------------------------
  if (url.pathname === '/api/project') {
    try {
      const data = await getProjectData();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // --- API: SSE events -----------------------------------------------------
  if (url.pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write('event: connected\ndata: {"status":"ok"}\n\n');

    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // --- Static files --------------------------------------------------------
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  // Prevent directory traversal
  filePath = join(PUBLIC_DIR, filePath.replace(/\.\./g, ''));

  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

server.listen(PORT, () => {
  console.log(`\n  RCF Lite Dashboard`);
  console.log(`  ------------------`);
  console.log(`  URL:     http://localhost:${PORT}`);
  console.log(`  Project: ${PROJECT_ROOT}`);
  console.log(`  RCF dir: ${RCF_DIR}\n`);
});

startWatcher();
