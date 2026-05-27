import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.mjs';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'projects.json');

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

describe('Projects API', () => {
  // TC-001-01: POST creates a new project and returns 201
  it('should create a new project with valid data', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Q3 Prospectus', description: 'Test project', deadline: '2026-09-30', team: 'Alice, Bob' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id);
    assert.equal(body.name, 'Q3 Prospectus');
    assert.equal(body.description, 'Test project');
    assert.equal(body.status, 'active');
  });

  // TC-001-02: POST with missing name returns 400
  it('should return 400 when name is missing', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'No name' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  // TC-001-03: GET returns list of all projects
  it('should return all projects', async () => {
    // Create two projects
    await fetch(`${BASE_URL}/api/v1/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Project A' }),
    });
    await fetch(`${BASE_URL}/api/v1/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Project B' }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/projects`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.length, 2);
  });

  // TC-001-04: GET /:id returns single project with all fields
  it('should return a single project by id', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Detailed Project', description: 'Full detail', deadline: '2026-12-31', team: 'Team Alpha' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/projects/${created.id}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, created.id);
    assert.equal(body.name, 'Detailed Project');
    assert.equal(body.description, 'Full detail');
  });

  // TC-001-05: GET /:id with invalid id returns 404
  it('should return 404 for non-existent project', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects/non-existent-id`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'NOT_FOUND');
  });

  // TC-001-06: PUT /:id updates project
  it('should update a project', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Original Name' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/projects/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name', description: 'Now with description' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.name, 'Updated Name');
    assert.equal(body.description, 'Now with description');
  });

  // TC-001-07: DELETE /:id removes the project
  it('should delete a project', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'To Delete' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/projects/${created.id}`, { method: 'DELETE' });
    assert.equal(res.status, 204);

    // Verify it's gone
    const getRes = await fetch(`${BASE_URL}/api/v1/projects/${created.id}`);
    assert.equal(getRes.status, 404);
  });

  // TC-001-08: DELETE with invalid id returns 404
  it('should return 404 when deleting non-existent project', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects/non-existent-id`, { method: 'DELETE' });
    assert.equal(res.status, 404);
  });
});
