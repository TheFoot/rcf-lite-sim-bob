import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');

let server;
let BASE_URL;
const TEST_MEETING_ID = 'test-meeting-001';

before(async () => {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(join(DATA_DIR, 'meetings.json'), JSON.stringify([
    { id: TEST_MEETING_ID, title: 'Test Meeting', date: '2026-05-28', attendees: '', notes: '', createdAt: '2026-05-28T10:00:00.000Z' }
  ]));
  await writeFile(join(DATA_DIR, 'action-items.json'), '[]');

  server = await startServer({ port: 0 });
  const port = server.address().port;
  BASE_URL = `http://localhost:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  await writeFile(join(DATA_DIR, 'action-items.json'), '[]');
});

describe('Action Items API', () => {
  // TC-002-01: POST creates an action item
  it('should create an action item linked to a meeting', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/action-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Review docs', meetingId: TEST_MEETING_ID, assignee: 'Alice', dueDate: '2026-06-01', status: 'open' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id);
    assert.equal(body.title, 'Review docs');
    assert.equal(body.meetingId, TEST_MEETING_ID);
    assert.equal(body.assignee, 'Alice');
    assert.equal(body.status, 'open');
  });

  // TC-002-02: POST returns 400 when required fields missing
  it('should return 400 when title or meetingId is missing', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/action-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee: 'Bob' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  // TC-002-03: GET with meetingId filter
  it('should return only action items for the specified meeting', async () => {
    // Create items for two different meetings
    await fetch(`${BASE_URL}/api/v1/action-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Item A', meetingId: TEST_MEETING_ID, status: 'open' }),
    });
    await fetch(`${BASE_URL}/api/v1/action-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Item B', meetingId: 'other-meeting', status: 'open' }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/action-items?meetingId=${TEST_MEETING_ID}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.length, 1);
    assert.equal(body[0].title, 'Item A');
  });

  // TC-002-04: GET by ID returns a single action item
  it('should return a single action item with all fields', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/action-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test item', meetingId: TEST_MEETING_ID, assignee: 'Carol', dueDate: '2026-06-05', status: 'in-progress' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/action-items/${created.id}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, created.id);
    assert.equal(body.title, 'Test item');
    assert.equal(body.assignee, 'Carol');
    assert.equal(body.status, 'in-progress');
  });

  // TC-002-05: PUT updates status and fields
  it('should update action item status and other fields', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/action-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Do thing', meetingId: TEST_MEETING_ID, status: 'open' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/action-items/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Do thing', meetingId: TEST_MEETING_ID, status: 'done', assignee: 'Bob' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'done');
    assert.equal(body.assignee, 'Bob');
  });

  // TC-002-06: DELETE removes an action item
  it('should delete an action item', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/action-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Remove me', meetingId: TEST_MEETING_ID, status: 'open' }),
    });
    const created = await createRes.json();

    const res = await fetch(`${BASE_URL}/api/v1/action-items/${created.id}`, { method: 'DELETE' });
    assert.equal(res.status, 204);

    const getRes = await fetch(`${BASE_URL}/api/v1/action-items/${created.id}`);
    assert.equal(getRes.status, 404);
  });
});
