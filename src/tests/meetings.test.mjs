import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.mjs';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');

let server;
let BASE_URL;

before(async () => {
  // Ensure clean data directory
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(join(DATA_DIR, 'meetings.json'), '[]');
  await writeFile(join(DATA_DIR, 'action-items.json'), '[]');

  server = await startServer({ port: 0 });
  const port = server.address().port;
  BASE_URL = `http://localhost:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  // Reset data before each test
  await writeFile(join(DATA_DIR, 'meetings.json'), '[]');
});

describe('Meetings API', () => {
  // TC-001-01: POST creates a meeting
  it('should create a meeting and return 201', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Sprint Planning', date: '2026-05-28', attendees: 'Alice, Bob', notes: 'Discussed backlog' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id);
    assert.equal(body.title, 'Sprint Planning');
    assert.equal(body.date, '2026-05-28');
    assert.equal(body.attendees, 'Alice, Bob');
  });

  // TC-001-02: POST returns 400 when title is missing
  it('should return 400 when title is missing', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-05-28' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  // TC-001-03: GET returns all meetings
  it('should return all meetings as an array', async () => {
    // Create two meetings first
    await fetch(`${BASE_URL}/api/v1/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Meeting 1', date: '2026-05-28' }),
    });
    await fetch(`${BASE_URL}/api/v1/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Meeting 2', date: '2026-05-29' }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/meetings`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 2);
  });

  // TC-001-04: GET by ID returns a single meeting
  it('should return a single meeting by ID', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Standup', date: '2026-05-28' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/meetings/${created.id}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, created.id);
    assert.equal(body.title, 'Standup');
  });

  // TC-001-05: PUT updates a meeting
  it('should update meeting fields', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Old Title', date: '2026-05-28' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/meetings/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title', date: '2026-05-29', notes: 'Updated notes' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.title, 'New Title');
    assert.equal(body.date, '2026-05-29');
    assert.equal(body.notes, 'Updated notes');
  });

  // TC-001-06: DELETE removes a meeting
  it('should delete a meeting and return 204', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'To Delete', date: '2026-05-28' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/meetings/${created.id}`, {
      method: 'DELETE',
    });
    assert.equal(res.status, 204);

    // Confirm it is gone
    const getRes = await fetch(`${BASE_URL}/api/v1/meetings/${created.id}`);
    assert.equal(getRes.status, 404);
  });

  // TC-001-07: GET by ID returns 404 for non-existent meeting
  it('should return 404 for non-existent meeting', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/meetings/non-existent-id`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
  });

  // TC-001-08: HTML shell loads
  it('should serve HTML shell with app container and navigation', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('id="app"'), 'Should have #app container');
    assert.ok(html.includes('Meeting Notes'), 'Should have app title');
    assert.ok(html.includes('data-link'), 'Should have navigation links');
  });
});
