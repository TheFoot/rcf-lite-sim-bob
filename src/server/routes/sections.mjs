/**
 * CRUD routes for sections (working copies of templates within projects).
 * Includes workflow status transitions.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = join(process.cwd(), 'data');
const SECTIONS_FILE = join(DATA_DIR, 'sections.json');
const TEMPLATES_FILE = join(DATA_DIR, 'templates.json');

async function loadSections() {
  try {
    return JSON.parse(await readFile(SECTIONS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function saveSections(records) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SECTIONS_FILE, JSON.stringify(records, null, 2) + '\n');
}

async function loadTemplates() {
  try {
    return JSON.parse(await readFile(TEMPLATES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

// Valid workflow transitions
const VALID_TRANSITIONS = {
  'draft': ['in-review'],
  'in-review': ['approved', 'draft'],
  'approved': ['locked'],
  'locked': [],
};

async function listSections(req, res) {
  let records = await loadSections();
  if (req.query.projectId) {
    records = records.filter((r) => r.projectId === req.query.projectId);
  }
  res.json(records);
}

async function getSection(req, res) {
  const records = await loadSections();
  const record = records.find((r) => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Section not found.' } });
  }
  res.json(record);
}

async function createSection(req, res) {
  const body = req.body || {};
  if (!body.projectId || !body.templateId) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'projectId and templateId are required.' } });
  }

  // Look up the template
  const templates = await loadTemplates();
  const template = templates.find((t) => t.id === body.templateId);
  if (!template) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Template not found.' } });
  }

  const sections = await loadSections();
  const orderInProject = sections.filter((s) => s.projectId === body.projectId).length + 1;

  const record = {
    id: randomUUID(),
    projectId: body.projectId,
    templateId: body.templateId,
    name: template.name,
    content: template.content,
    status: 'draft',
    approvedBy: null,
    approvedAt: null,
    order: orderInProject,
    createdAt: new Date().toISOString(),
  };

  sections.push(record);
  await saveSections(sections);
  res.status(201).json(record);
}

async function updateSection(req, res) {
  const records = await loadSections();
  const index = records.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Section not found.' } });
  }

  if (records[index].status === 'locked') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Cannot edit a locked section.' } });
  }

  const body = req.body || {};
  // Only allow updating content and name (not status -- use PATCH /status for that)
  const updated = {
    ...records[index],
    ...(body.content !== undefined && { content: body.content }),
    ...(body.name !== undefined && { name: body.name }),
  };
  records[index] = updated;
  await saveSections(records);
  res.json(updated);
}

async function deleteSection(req, res) {
  const records = await loadSections();
  const index = records.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Section not found.' } });
  }

  records.splice(index, 1);
  await saveSections(records);
  res.status(204).end();
}

async function transitionStatus(req, res) {
  const records = await loadSections();
  const index = records.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Section not found.' } });
  }

  const body = req.body || {};
  const newStatus = body.status;
  const currentStatus = records[index].status;

  if (!newStatus) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'status is required.' } });
  }

  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Cannot transition from '${currentStatus}' to '${newStatus}'. Valid transitions: ${allowed.join(', ') || 'none'}.`,
      },
    });
  }

  records[index].status = newStatus;

  // Record approval info
  if (newStatus === 'approved') {
    records[index].approvedBy = body.approvedBy || 'System';
    records[index].approvedAt = new Date().toISOString();
  }

  // Clear approval info if sent back to draft
  if (newStatus === 'draft') {
    records[index].approvedBy = null;
    records[index].approvedAt = null;
  }

  await saveSections(records);
  res.json(records[index]);
}

export function registerSectionRoutes(router) {
  router.get('/sections', listSections);
  router.get('/sections/:id', getSection);
  router.post('/sections', createSection);
  router.put('/sections/:id', updateSection);
  router.delete('/sections/:id', deleteSection);
  router.patch('/sections/:id/status', transitionStatus);
}
