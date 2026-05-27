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

const PROJECT_ROOT = resolve(args.root);
const RCF_DIR = join(PROJECT_ROOT, 'rcf');
const PUBLIC_DIR = new URL('./public/', import.meta.url).pathname;

let PORT = Number(args.port);
let APP_PORT = 3000;
try {
  const projRaw = await readFile(join(RCF_DIR, 'project.json'), 'utf8');
  const proj = JSON.parse(projRaw);
  if (proj.ports?.dashboard && args.port === '3001') PORT = proj.ports.dashboard;
  if (proj.ports?.app) APP_PORT = proj.ports.app;
} catch {}

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
      appPort: APP_PORT,
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

  // --- API: Technical Architecture Report (print-ready HTML) ----------------
  if (url.pathname === '/api/tech-report') {
    try {
      const data = await getProjectData();
      const project = data.project || {};
      const design = data.design || {};
      const prd = data.prd || {};
      const buildSpecs = data.buildSpecs || [];
      const testSpecs = data.testSpecs || [];

      const components = design.components || [];
      const endpoints = design.endpoints || [];
      const dataModel = design.dataModel || design.models || design.entities || [];
      const models = Array.isArray(dataModel) ? dataModel : (design.dataModel ? [design.dataModel] : []);

      const totalReqs = (prd.requirements || []).length;
      const totalAc = (prd.requirements || []).reduce((sum, r) =>
        sum + (r.stories || []).reduce((s2, st) => s2 + (st.acceptanceCriteria || []).length, 0), 0);
      const verifiedBs = buildSpecs.filter(bs => bs.status === 'verified').length;
      let passingTests = 0;
      for (const ts of testSpecs) {
        passingTests += (ts.testCases || []).filter(tc => tc.status === 'passing').length;
      }

      const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      let html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${esc(project.name || 'Project')} - Technical Architecture</title>
<style>
  @media print { body { font-size: 11pt; } h1 { font-size: 18pt; } h2 { font-size: 14pt; break-before: avoid; } table { break-inside: avoid; } .no-print { display: none; } }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
  h1 { border-bottom: 2px solid #1a2332; padding-bottom: 8px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
  h2 { color: #1a2332; margin-top: 32px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th { text-align: left; padding: 6px 12px; background: #f5f5f5; border-bottom: 2px solid #ddd; font-weight: 600; }
  td { padding: 6px 12px; border-bottom: 1px solid #eee; }
  .method { font-weight: 700; font-size: 11px; }
  .method-get { color: #22c55e; } .method-post { color: #00b4d8; } .method-put { color: #ed8936; } .method-delete { color: #ef4444; }
  .path { font-family: monospace; color: #1a2332; }
  .entity { background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 6px; padding: 12px; margin: 8px 0; }
  .entity-name { font-weight: 700; color: #1a2332; margin-bottom: 6px; }
  .field { display: inline-block; font-size: 12px; padding: 2px 8px; background: #e5e5e5; border-radius: 4px; margin: 2px; }
  .stats { display: flex; gap: 24px; margin: 16px 0; }
  .stat { text-align: center; }
  .stat-val { font-size: 24px; font-weight: 700; color: #1a2332; }
  .stat-lbl { font-size: 11px; color: #888; text-transform: uppercase; }
  .print-btn { background: #1a2332; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; margin: 16px 0; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">Save as PDF</button>
<h1>${esc(project.name || 'Project')} - Technical Architecture</h1>
<div class="subtitle">Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} | Built on RCF Methodology</div>

<div class="stats">
  <div class="stat"><div class="stat-val">${totalReqs}</div><div class="stat-lbl">Requirements</div></div>
  <div class="stat"><div class="stat-val">${totalAc}</div><div class="stat-lbl">Acceptance Criteria</div></div>
  <div class="stat"><div class="stat-val">${verifiedBs}/${buildSpecs.length}</div><div class="stat-lbl">Specs Verified</div></div>
  <div class="stat"><div class="stat-val">${passingTests}</div><div class="stat-lbl">Tests Passing</div></div>
</div>

${project.description ? `<p>${esc(project.description)}</p>` : ''}`;

      // Components
      if (components.length > 0) {
        html += '<h2>Components</h2><table><thead><tr><th>Component</th><th>Description</th><th>Traces To</th></tr></thead><tbody>';
        for (const c of components) {
          html += `<tr><td><strong>${esc(c.name || '')}</strong></td><td>${esc(c.description || '')}</td><td>${esc((c.tracesTo || []).join(', '))}</td></tr>`;
        }
        html += '</tbody></table>';
      }

      // API Endpoints
      if (endpoints.length > 0) {
        html += '<h2>API Endpoints</h2><table><thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead><tbody>';
        for (const ep of endpoints) {
          const m = (ep.method || 'GET').toUpperCase();
          html += `<tr><td class="method method-${m.toLowerCase()}">${m}</td><td class="path">${esc(ep.path || ep.route || '')}</td><td>${esc(ep.description || '')}</td></tr>`;
        }
        html += '</tbody></table>';
      }

      // Data Model
      if (models.length > 0) {
        html += '<h2>Data Model</h2>';
        for (const model of models) {
          const name = model.name || model.entity || 'Entity';
          const fields = model.fields || model.properties || [];
          html += `<div class="entity"><div class="entity-name">${esc(name)}</div><div>`;
          if (Array.isArray(fields)) {
            for (const f of fields) {
              const label = typeof f === 'string' ? f : `${f.name || ''}${f.type ? ': ' + f.type : ''}`;
              html += `<span class="field">${esc(label)}</span>`;
            }
          }
          html += '</div></div>';
        }
      }

      // Requirements summary
      if (prd.requirements && prd.requirements.length > 0) {
        html += '<h2>Requirements</h2><table><thead><tr><th>ID</th><th>Requirement</th><th>Stories</th><th>ACs</th></tr></thead><tbody>';
        for (const req of prd.requirements) {
          const stories = (req.stories || []).length;
          const acs = (req.stories || []).reduce((s, st) => s + (st.acceptanceCriteria || []).length, 0);
          html += `<tr><td><strong>${esc(req.id)}</strong></td><td>${esc(req.title || '')}</td><td>${stories}</td><td>${acs}</td></tr>`;
        }
        html += '</tbody></table>';
      }

      html += `<div class="footer">Built on RCF Methodology | ${esc(project.name || 'Project')} | ${new Date().toISOString().slice(0, 10)}</div></body></html>`;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error generating report: ${err.message}`);
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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: node tools/dashboard/server.mjs --port ${Number(PORT) + 1}`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`\n  RCF Lite Dashboard`);
  console.log(`  ------------------`);
  console.log(`  URL:     http://localhost:${PORT}`);
  console.log(`  Project: ${PROJECT_ROOT}`);
  console.log(`  RCF dir: ${RCF_DIR}\n`);
});

startWatcher();
