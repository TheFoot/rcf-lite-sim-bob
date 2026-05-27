import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');

let server;
let BASE_URL;

before(async () => {
  await mkdir(DATA_DIR, { recursive: true });

  await writeFile(join(DATA_DIR, 'projects.json'), JSON.stringify([
    { id: 'export-proj-1', name: 'Export Test Project', description: 'Test project for export', deadline: '2026-12-31', team: 'Alice, Bob', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' }
  ]));

  await writeFile(join(DATA_DIR, 'templates.json'), JSON.stringify([
    { id: 'export-tmpl-1', name: 'Test Template', category: 'risk-factors', content: '## Test', createdAt: '2026-01-01T00:00:00.000Z' }
  ]));

  await writeFile(join(DATA_DIR, 'sections.json'), JSON.stringify([
    { id: 'export-sec-1', projectId: 'export-proj-1', templateId: 'export-tmpl-1', name: 'Risk Factors', content: '## Risk Factors\n\nKey risks include market volatility and regulatory changes.', status: 'approved', approvedBy: 'Alice', approvedAt: '2026-05-20T10:00:00.000Z', order: 1, createdAt: '2026-03-01T00:00:00.000Z' },
    { id: 'export-sec-2', projectId: 'export-proj-1', templateId: 'export-tmpl-1', name: 'Financial Summary', content: '## Financial Summary\n\n| Metric | Value |\n|--------|-------|\n| Revenue | $125M |\n| Profit | $24M |', status: 'locked', approvedBy: 'Bob', approvedAt: '2026-05-18T14:00:00.000Z', order: 2, createdAt: '2026-03-02T00:00:00.000Z' },
    { id: 'export-sec-3', projectId: 'export-proj-1', templateId: 'export-tmpl-1', name: 'Draft Section', content: '## Draft\n\nNot ready.', status: 'draft', approvedBy: null, approvedAt: null, order: 3, createdAt: '2026-03-03T00:00:00.000Z' }
  ]));

  server = await startServer({ port: 0 });
  BASE_URL = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Document Assembly and Export', () => {
  // TC-005-01
  it('should return assembled HTML with approved/locked sections only', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects/export-proj-1/assemble`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.html);
    assert.ok(body.html.includes('Risk Factors'));
    assert.ok(body.html.includes('Financial Summary'));
    // Draft section should NOT be included
    assert.ok(!body.html.includes('Not ready'));
  });

  // TC-005-02
  it('should include table of contents and section numbering', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects/export-proj-1/assemble`);
    const body = await res.json();
    assert.ok(body.html.includes('Table of Contents'));
    // Should have numbered sections
    assert.ok(body.html.includes('1.'));
    assert.ok(body.html.includes('2.'));
  });

  // TC-005-03
  it('should render markdown as HTML in assembled document', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects/export-proj-1/assemble`);
    const body = await res.json();
    // Markdown should be rendered -- headings become HTML tags
    assert.ok(body.html.includes('<h'));
    // Tables should be rendered
    assert.ok(body.html.includes('<table'));
  });

  // TC-005-04
  it('should export as PDF', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects/export-proj-1/export/pdf`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('application/pdf'));
    const buffer = await res.arrayBuffer();
    assert.ok(buffer.byteLength > 0);
  });

  // TC-005-05
  it('should export as DOCX', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects/export-proj-1/export/docx`);
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('officedocument') || contentType.includes('octet-stream'));
    const buffer = await res.arrayBuffer();
    assert.ok(buffer.byteLength > 0);
  });

  // TC-005-06
  it('should return 404 for non-existent project', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects/non-existent/assemble`);
    assert.equal(res.status, 404);
  });
});
