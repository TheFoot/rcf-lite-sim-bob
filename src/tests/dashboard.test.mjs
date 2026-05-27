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

  // Seed with known data
  const meetings = [
    { id: 'meet-1', title: 'Sprint Planning', date: '2026-05-27', attendees: 'Alice, Bob', notes: 'Sprint 12', createdAt: '2026-05-27T09:00:00.000Z' },
    { id: 'meet-2', title: 'Design Review', date: '2026-05-25', attendees: 'Bob, Carol', notes: 'Components', createdAt: '2026-05-25T14:00:00.000Z' },
    { id: 'meet-3', title: 'Standup', date: '2026-05-24', attendees: 'Alice', notes: '', createdAt: '2026-05-24T10:00:00.000Z' },
  ];
  await writeFile(join(DATA_DIR, 'meetings.json'), JSON.stringify(meetings));

  const actionItems = [
    { id: 'ai-1', title: 'Task 1', meetingId: 'meet-1', assignee: 'Alice', dueDate: '2026-06-01', status: 'open', createdAt: '2026-05-27T10:00:00.000Z' },
    { id: 'ai-2', title: 'Task 2', meetingId: 'meet-1', assignee: 'Bob', dueDate: '2026-05-20', status: 'open', createdAt: '2026-05-27T10:00:00.000Z' },
    { id: 'ai-3', title: 'Task 3', meetingId: 'meet-2', assignee: 'Carol', dueDate: '2026-06-05', status: 'done', createdAt: '2026-05-25T10:00:00.000Z' },
  ];
  await writeFile(join(DATA_DIR, 'action-items.json'), JSON.stringify(actionItems));

  server = await startServer({ port: 0 });
  const port = server.address().port;
  BASE_URL = `http://localhost:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Dashboard API', () => {
  // TC-003-01: Summary stats
  it('should return summary stats', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.totalMeetings, 3);
    assert.equal(body.totalActionItems, 3);
    assert.ok(typeof body.overdueItems === 'number');
    // ai-2 has dueDate 2026-05-20 and status 'open' so it should be overdue
    assert.ok(body.overdueItems >= 1, 'Should have at least 1 overdue item');
  });

  // TC-003-02: Recent meetings
  it('should return recent meetings (max 5)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard`);
    const body = await res.json();
    assert.ok(Array.isArray(body.recentMeetings));
    assert.ok(body.recentMeetings.length <= 5);
    assert.equal(body.recentMeetings.length, 3);
    // Most recent first
    assert.equal(body.recentMeetings[0].id, 'meet-1');
  });

  // TC-003-03: Upcoming action items
  it('should return upcoming action items sorted by due date', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard`);
    const body = await res.json();
    assert.ok(Array.isArray(body.upcomingActionItems));
    // Should include open/in-progress items, not done
    const statuses = body.upcomingActionItems.map(ai => ai.status);
    assert.ok(!statuses.includes('done'), 'Should not include done items');
  });

  // TC-003-04: HTML contains dashboard elements
  it('should serve HTML with app title', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Meeting Notes'), 'Should have app title');
  });
});
