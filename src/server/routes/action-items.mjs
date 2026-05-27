/**
 * CRUD routes for action items.
 * Traces: REQ-002 -- Action Item Tracking
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'action-items.json');

async function loadAll() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveAll(records) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(records, null, 2) + '\n');
}

function validate(body, rules) {
  const errors = [];
  for (const [field, check] of Object.entries(rules)) {
    const value = body[field];
    if (check.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required.`);
    }
    if (check.type && value !== undefined && value !== null && typeof value !== check.type) {
      errors.push(`${field} must be a ${check.type}.`);
    }
    if (check.oneOf && value !== undefined && !check.oneOf.includes(value)) {
      errors.push(`${field} must be one of: ${check.oneOf.join(', ')}.`);
    }
  }
  return errors;
}

const VALID_STATUSES = ['open', 'in-progress', 'done'];

async function listActionItems(req, res) {
  let records = await loadAll();
  // Optional meetingId filter
  if (req.query.meetingId) {
    records = records.filter((r) => r.meetingId === req.query.meetingId);
  }
  // Optional status filter
  if (req.query.status) {
    records = records.filter((r) => r.status === req.query.status);
  }
  // Optional assignee filter (partial match, case-insensitive)
  if (req.query.assignee) {
    const term = req.query.assignee.toLowerCase();
    records = records.filter((r) => r.assignee && r.assignee.toLowerCase().includes(term));
  }
  res.json(records);
}

async function getActionItem(req, res) {
  const records = await loadAll();
  const record = records.find((r) => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Action item not found.' } });
  }
  res.json(record);
}

async function createActionItem(req, res) {
  const body = req.body || {};
  const errors = validate(body, {
    title: { required: true, type: 'string' },
    meetingId: { required: true, type: 'string' },
  });
  if (errors.length) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors[0] } });
  }

  const status = body.status && VALID_STATUSES.includes(body.status) ? body.status : 'open';

  const record = {
    id: randomUUID(),
    title: body.title.trim(),
    meetingId: body.meetingId,
    assignee: body.assignee || '',
    dueDate: body.dueDate || '',
    status,
    createdAt: new Date().toISOString(),
  };

  const records = await loadAll();
  records.push(record);
  await saveAll(records);
  res.status(201).json(record);
}

async function updateActionItem(req, res) {
  const records = await loadAll();
  const index = records.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Action item not found.' } });
  }

  const body = req.body || {};
  const errors = validate(body, {
    title: { required: true, type: 'string' },
    meetingId: { required: true, type: 'string' },
  });
  if (errors.length) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors[0] } });
  }

  const status = body.status && VALID_STATUSES.includes(body.status) ? body.status : records[index].status;

  const updated = {
    ...records[index],
    title: body.title.trim(),
    meetingId: body.meetingId,
    assignee: body.assignee !== undefined ? body.assignee : records[index].assignee,
    dueDate: body.dueDate !== undefined ? body.dueDate : records[index].dueDate,
    status,
  };
  records[index] = updated;
  await saveAll(records);
  res.json(updated);
}

async function deleteActionItem(req, res) {
  const records = await loadAll();
  const index = records.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Action item not found.' } });
  }

  records.splice(index, 1);
  await saveAll(records);
  res.status(204).end();
}

export function registerActionItemRoutes(router) {
  router.get('/action-items', listActionItems);
  router.get('/action-items/:id', getActionItem);
  router.post('/action-items', createActionItem);
  router.put('/action-items/:id', updateActionItem);
  router.delete('/action-items/:id', deleteActionItem);
}
