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

  // Set up seed data with known values
  await writeFile(join(DATA_DIR, 'projects.json'), JSON.stringify([
    { id: 'dash-proj-1', name: 'Test Project A', description: 'Desc A', deadline: '2026-08-15T00:00:00.000Z', team: 'Alice, Bob', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'dash-proj-2', name: 'Test Project B', description: 'Desc B', deadline: '2026-06-30T00:00:00.000Z', team: 'Carla, David', status: 'active', createdAt: '2026-02-01T00:00:00.000Z' }
  ]));

  await writeFile(join(DATA_DIR, 'templates.json'), JSON.stringify([
    { id: 'dash-tmpl-1', name: 'Template 1', category: 'risk-factors', content: '## Risk', createdAt: '2026-01-01T00:00:00.000Z' }
  ]));

  await writeFile(join(DATA_DIR, 'sections.json'), JSON.stringify([
    { id: 'dash-sec-1', projectId: 'dash-proj-1', templateId: 'dash-tmpl-1', name: 'Risk Factors', content: '## Risk', status: 'approved', approvedBy: 'Alice', approvedAt: '2026-05-20T10:00:00.000Z', order: 1, createdAt: '2026-03-01T00:00:00.000Z' },
    { id: 'dash-sec-2', projectId: 'dash-proj-1', templateId: 'dash-tmpl-1', name: 'Legal', content: '## Legal', status: 'draft', approvedBy: null, approvedAt: null, order: 2, createdAt: '2026-03-02T00:00:00.000Z' },
    { id: 'dash-sec-3', projectId: 'dash-proj-1', templateId: 'dash-tmpl-1', name: 'Financial', content: '## Fin', status: 'locked', approvedBy: 'Bob', approvedAt: '2026-05-18T14:00:00.000Z', order: 3, createdAt: '2026-03-03T00:00:00.000Z' },
    { id: 'dash-sec-4', projectId: 'dash-proj-2', templateId: 'dash-tmpl-1', name: 'Risk', content: '## Risk', status: 'in-review', approvedBy: null, approvedAt: null, order: 1, createdAt: '2026-04-01T00:00:00.000Z' },
    { id: 'dash-sec-5', projectId: 'dash-proj-2', templateId: 'dash-tmpl-1', name: 'Overview', content: '## Over', status: 'locked', approvedBy: 'Carla', approvedAt: '2026-05-15T09:00:00.000Z', order: 2, createdAt: '2026-04-02T00:00:00.000Z' }
  ]));

  server = await startServer({ port: 0 });
  BASE_URL = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Dashboard API', () => {
  // TC-004-01
  it('should return project summaries with completion percentages', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.projects);
    assert.ok(body.projects.length >= 2);
    const projA = body.projects.find(p => p.id === 'dash-proj-1');
    assert.ok(projA);
    assert.ok(typeof projA.completionPercent === 'number');
    // Project A: 3 sections, 2 complete (approved + locked) = 66.7%
    assert.ok(projA.completionPercent > 60);
  });

  // TC-004-02
  it('should return blocking sections', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard`);
    const body = await res.json();
    assert.ok(body.blockingSections);
    assert.ok(body.blockingSections.length >= 2);
    // draft and in-review sections are blocking
    const statuses = body.blockingSections.map(s => s.status);
    assert.ok(statuses.every(s => s === 'draft' || s === 'in-review'));
  });

  // TC-004-03
  it('should return team activity', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard`);
    const body = await res.json();
    assert.ok(body.recentActivity);
    assert.ok(body.recentActivity.length >= 1);
    // Activity should include approvals
    const approval = body.recentActivity.find(a => a.approvedBy);
    assert.ok(approval);
  });

  // TC-004-04
  it('should return upcoming deadlines sorted by urgency', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard`);
    const body = await res.json();
    assert.ok(body.upcomingDeadlines);
    assert.ok(body.upcomingDeadlines.length >= 2);
    // Should be sorted by deadline (earliest first)
    const dates = body.upcomingDeadlines.map(d => new Date(d.deadline).getTime());
    for (let i = 1; i < dates.length; i++) {
      assert.ok(dates[i] >= dates[i - 1], 'Deadlines should be sorted ascending');
    }
  });

  // TC-004-05
  it('should serve the dashboard HTML page', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Regulatory Document Builder'));
    assert.ok(html.includes('id="app"'));
  });
});
