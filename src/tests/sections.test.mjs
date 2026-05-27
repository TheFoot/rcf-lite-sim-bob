import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = join(process.cwd(), 'data');

let server;
let BASE_URL;
let testProjectId;
let testTemplateId;

before(async () => {
  await mkdir(DATA_DIR, { recursive: true });
  // Create a test project
  testProjectId = randomUUID();
  await writeFile(join(DATA_DIR, 'projects.json'), JSON.stringify([
    { id: testProjectId, name: 'Test Project', status: 'active', createdAt: new Date().toISOString() }
  ]));
  // Create a test template
  testTemplateId = randomUUID();
  await writeFile(join(DATA_DIR, 'templates.json'), JSON.stringify([
    { id: testTemplateId, name: 'Test Template', category: 'risk-factors', content: '## Risk Factors\n\nTest content.', createdAt: new Date().toISOString() }
  ]));
  await writeFile(join(DATA_DIR, 'sections.json'), '[]');

  server = await startServer({ port: 0 });
  BASE_URL = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  await writeFile(join(DATA_DIR, 'sections.json'), '[]');
});

async function createSection() {
  const res = await fetch(`${BASE_URL}/api/v1/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: testProjectId, templateId: testTemplateId }),
  });
  return res.json();
}

describe('Sections API', () => {
  // TC-003-01
  it('should create a working copy from a template', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: testProjectId, templateId: testTemplateId }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.id);
    assert.equal(body.projectId, testProjectId);
    assert.equal(body.templateId, testTemplateId);
    assert.equal(body.name, 'Test Template');
    assert.ok(body.content.includes('Risk Factors'));
    assert.equal(body.status, 'draft');
  });

  // TC-003-02
  it('should return 400 for invalid templateId', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: testProjectId, templateId: 'non-existent' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  // TC-003-03
  it('should update section content without affecting template', async () => {
    const section = await createSection();
    const res = await fetch(`${BASE_URL}/api/v1/sections/${section.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '## Updated Risk Factors\n\nNew content.' }),
    });
    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.ok(updated.content.includes('Updated'));

    // Verify template is unchanged
    const templateRes = await fetch(`${BASE_URL}/api/v1/templates/${testTemplateId}`);
    const template = await templateRes.json();
    assert.ok(!template.content.includes('Updated'));
  });

  // TC-003-04
  it('should return section with markdown content', async () => {
    const section = await createSection();
    const res = await fetch(`${BASE_URL}/api/v1/sections/${section.id}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.content);
    assert.ok(body.content.includes('Risk Factors'));
  });

  // TC-003-05
  it('should transition draft to in-review', async () => {
    const section = await createSection();
    const res = await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-review' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'in-review');
  });

  // TC-003-06
  it('should transition in-review to approved with approver info', async () => {
    const section = await createSection();
    await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-review' }),
    });
    const res = await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', approvedBy: 'Alice Chen' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'approved');
    assert.equal(body.approvedBy, 'Alice Chen');
    assert.ok(body.approvedAt);
  });

  // TC-003-07
  it('should transition approved to locked', async () => {
    const section = await createSection();
    await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-review' }),
    });
    await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', approvedBy: 'Alice Chen' }),
    });
    const res = await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'locked' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'locked');
  });

  // TC-003-08
  it('should reject editing a locked section', async () => {
    const section = await createSection();
    // Advance to locked
    await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-review' }),
    });
    await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', approvedBy: 'Alice Chen' }),
    });
    await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'locked' }),
    });

    const res = await fetch(`${BASE_URL}/api/v1/sections/${section.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Should not work' }),
    });
    assert.equal(res.status, 400);
  });

  // TC-003-09
  it('should transition in-review back to draft', async () => {
    const section = await createSection();
    await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in-review' }),
    });
    const res = await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'draft');
  });

  // TC-003-10
  it('should reject invalid status transition', async () => {
    const section = await createSection();
    // draft cannot go directly to approved
    const res = await fetch(`${BASE_URL}/api/v1/sections/${section.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    assert.equal(res.status, 400);
  });

  // TC-003-11
  it('should filter sections by projectId', async () => {
    await createSection();
    const res = await fetch(`${BASE_URL}/api/v1/sections?projectId=${testProjectId}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.length >= 1);
    assert.ok(body.every(s => s.projectId === testProjectId));
  });
});
