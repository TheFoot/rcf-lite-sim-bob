import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'templates.json');

let server;
let BASE_URL;

before(async () => {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, '[]');
  server = await startServer({ port: 0 });
  const port = server.address().port;
  BASE_URL = `http://localhost:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  await writeFile(DATA_FILE, '[]');
});

describe('Templates API', () => {
  // TC-002-01
  it('should create a new template with valid data', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Risk Factors', category: 'risk-factors', content: '## Risk Factors\n\nKey risks include...' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id);
    assert.equal(body.name, 'Risk Factors');
    assert.equal(body.category, 'risk-factors');
    assert.ok(body.content.includes('Risk Factors'));
  });

  // TC-002-02
  it('should return 400 when name is missing', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'other', content: 'test' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  // TC-002-03
  it('should return all templates', async () => {
    await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Template A', category: 'other', content: 'A' }),
    });
    await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Template B', category: 'other', content: 'B' }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/templates`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.length, 2);
  });

  // TC-002-04
  it('should return a single template by id', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Detailed', category: 'financial-summary', content: '## Financial Summary\n\nRevenue...' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/templates/${created.id}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.name, 'Detailed');
    assert.ok(body.content.includes('Financial Summary'));
  });

  // TC-002-05
  it('should update a template', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Original', category: 'other', content: 'old content' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/templates/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated', category: 'risk-factors', content: 'new content' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.name, 'Updated');
    assert.equal(body.content, 'new content');
  });

  // TC-002-06
  it('should delete a template', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'To Delete', category: 'other', content: 'bye' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/templates/${created.id}`, { method: 'DELETE' });
    assert.equal(res.status, 204);

    const getRes = await fetch(`${BASE_URL}/api/v1/templates/${created.id}`);
    assert.equal(getRes.status, 404);
  });

  // TC-002-07
  it('should return 404 for non-existent template', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/templates/non-existent-id`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});
