/**
 * CRUD routes for meetings.
 * Traces: REQ-001 -- Meeting Management
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'meetings.json');

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
  }
  return errors;
}

async function listMeetings(req, res) {
  const records = await loadAll();
  res.json(records);
}

async function getMeeting(req, res) {
  const records = await loadAll();
  const record = records.find((r) => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Meeting not found.' } });
  }
  res.json(record);
}

async function createMeeting(req, res) {
  const body = req.body || {};
  const errors = validate(body, {
    title: { required: true, type: 'string' },
    date: { required: true, type: 'string' },
  });
  if (errors.length) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors[0] } });
  }

  const record = {
    id: randomUUID(),
    title: body.title.trim(),
    date: body.date,
    attendees: body.attendees || '',
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
  };

  const records = await loadAll();
  records.push(record);
  await saveAll(records);
  res.status(201).json(record);
}

async function updateMeeting(req, res) {
  const records = await loadAll();
  const index = records.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Meeting not found.' } });
  }

  const body = req.body || {};
  const errors = validate(body, {
    title: { required: true, type: 'string' },
    date: { required: true, type: 'string' },
  });
  if (errors.length) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors[0] } });
  }

  const updated = {
    ...records[index],
    title: body.title.trim(),
    date: body.date,
    attendees: body.attendees !== undefined ? body.attendees : records[index].attendees,
    notes: body.notes !== undefined ? body.notes : records[index].notes,
  };
  records[index] = updated;
  await saveAll(records);
  res.json(updated);
}

async function deleteMeeting(req, res) {
  const records = await loadAll();
  const index = records.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Meeting not found.' } });
  }

  records.splice(index, 1);
  await saveAll(records);
  res.status(204).end();
}

export function registerMeetingRoutes(router) {
  router.get('/meetings', listMeetings);
  router.get('/meetings/:id', getMeeting);
  router.post('/meetings', createMeeting);
  router.put('/meetings/:id', updateMeeting);
  router.delete('/meetings/:id', deleteMeeting);
}
