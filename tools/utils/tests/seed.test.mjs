/**
 * Tests for tools/utils/seed.mjs
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { generateRecords, seedToFile } from '../seed.mjs';

/* ---------- Test entity ------------------------------------------------- */

const taskEntity = {
  name: 'Task',
  pluralName: 'tasks',
  fields: [
    { name: 'title', type: 'string', required: true },
    { name: 'description', type: 'string' },
    { name: 'status', type: 'enum', options: ['open', 'in-progress', 'done'], default: 'open' },
    { name: 'assignee', type: 'string' },
    { name: 'priority', type: 'number', default: 0 },
  ],
};

/* ---------- generateRecords --------------------------------------------- */

describe('generateRecords', () => {
  it('should generate the requested number of records', () => {
    const records = generateRecords(taskEntity, 10);
    assert.equal(records.length, 10);
  });

  it('should give each record a UUID id and createdAt', () => {
    const records = generateRecords(taskEntity, 3);
    for (const record of records) {
      assert.ok(record.id, 'record should have an id');
      assert.match(record.id, /^[0-9a-f]{8}-[0-9a-f]{4}-/, 'id should be UUID format');
      assert.ok(record.createdAt, 'record should have createdAt');
      assert.ok(!isNaN(Date.parse(record.createdAt)), 'createdAt should be valid ISO date');
    }
  });

  it('should populate all entity fields', () => {
    const records = generateRecords(taskEntity, 5);
    for (const record of records) {
      assert.ok('title' in record);
      assert.ok('description' in record);
      assert.ok('status' in record);
      assert.ok('assignee' in record);
      assert.ok('priority' in record);
    }
  });

  it('should generate enum values from the options array', () => {
    const records = generateRecords(taskEntity, 20);
    const validStatuses = ['open', 'in-progress', 'done'];
    for (const record of records) {
      assert.ok(validStatuses.includes(record.status), `status should be valid enum, got: ${record.status}`);
    }
  });

  it('should generate numbers for number fields', () => {
    const records = generateRecords(taskEntity, 10);
    for (const record of records) {
      assert.equal(typeof record.priority, 'number');
    }
  });

  it('should generate person names for assignee field', () => {
    const records = generateRecords(taskEntity, 10);
    for (const record of records) {
      assert.equal(typeof record.assignee, 'string');
      assert.ok(record.assignee.length > 0, 'assignee should not be empty');
      // Should contain a space (first + last name)
      assert.ok(record.assignee.includes(' '), `assignee should be a full name, got: ${record.assignee}`);
    }
  });

  it('should handle zero count', () => {
    const records = generateRecords(taskEntity, 0);
    assert.equal(records.length, 0);
  });

  it('should throw for missing fields array', () => {
    assert.throws(
      () => generateRecords({ name: 'X' }, 5),
      { name: 'TypeError' },
    );
  });

  it('should throw for negative count', () => {
    assert.throws(
      () => generateRecords(taskEntity, -1),
      { name: 'TypeError' },
    );
  });

  it('should generate email strings for email fields', () => {
    const entity = {
      name: 'Contact',
      pluralName: 'contacts',
      fields: [{ name: 'email', type: 'string' }],
    };
    const records = generateRecords(entity, 10);
    for (const record of records) {
      assert.ok(record.email.includes('@'), `email should contain @, got: ${record.email}`);
    }
  });

  it('should generate boolean values for boolean fields', () => {
    const entity = {
      name: 'Flag',
      pluralName: 'flags',
      fields: [{ name: 'active', type: 'boolean' }],
    };
    const records = generateRecords(entity, 20);
    const values = new Set(records.map((r) => r.active));
    // With 20 records, we should get both true and false
    assert.ok(values.has(true) || values.has(false));
    for (const record of records) {
      assert.equal(typeof record.active, 'boolean');
    }
  });

  it('should generate ISO dates for date fields', () => {
    const entity = {
      name: 'Event',
      pluralName: 'events',
      fields: [{ name: 'scheduledAt', type: 'date' }],
    };
    const records = generateRecords(entity, 5);
    for (const record of records) {
      assert.ok(!isNaN(Date.parse(record.scheduledAt)));
    }
  });

  it('should generate UUIDs for id/reference fields', () => {
    const entity = {
      name: 'Link',
      pluralName: 'links',
      fields: [{ name: 'targetId', type: 'reference' }],
    };
    const records = generateRecords(entity, 3);
    for (const record of records) {
      assert.match(record.targetId, /^[0-9a-f]{8}-[0-9a-f]{4}-/);
    }
  });

  it('should respect min/max for number fields', () => {
    const entity = {
      name: 'Score',
      pluralName: 'scores',
      fields: [{ name: 'value', type: 'number', min: 10, max: 20 }],
    };
    const records = generateRecords(entity, 50);
    for (const record of records) {
      assert.ok(record.value >= 10, `value should be >= 10, got: ${record.value}`);
      assert.ok(record.value <= 20, `value should be <= 20, got: ${record.value}`);
    }
  });

  it('should sort records by createdAt descending', () => {
    const records = generateRecords(taskEntity, 10);
    for (let i = 1; i < records.length; i++) {
      assert.ok(
        new Date(records[i - 1].createdAt) >= new Date(records[i].createdAt),
        'records should be sorted newest first',
      );
    }
  });
});

/* ---------- seedToFile -------------------------------------------------- */

describe('seedToFile', () => {
  const tempRoots = [];

  afterEach(async () => {
    for (const dir of tempRoots) {
      await rm(dir, { recursive: true, force: true });
    }
    tempRoots.length = 0;
  });

  it('should write records to data/{pluralName}.json', async () => {
    const root = join(tmpdir(), `seed-test-${randomUUID()}`);
    tempRoots.push(root);

    const records = await seedToFile(taskEntity, 5, root);
    assert.equal(records.length, 5);

    const filePath = join(root, 'data', 'tasks.json');
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    assert.equal(parsed.length, 5);
    assert.equal(parsed[0].id, records[0].id);
  });

  it('should create the data directory if missing', async () => {
    const root = join(tmpdir(), `seed-test-${randomUUID()}`);
    tempRoots.push(root);

    await seedToFile(taskEntity, 1, root);
    const raw = await readFile(join(root, 'data', 'tasks.json'), 'utf8');
    assert.ok(JSON.parse(raw).length === 1);
  });

  it('should throw for missing pluralName', async () => {
    await assert.rejects(
      async () => seedToFile({ name: 'X', fields: [] }, 1, '/tmp'),
      { name: 'TypeError' },
    );
  });

  it('should throw for missing projectRoot', async () => {
    await assert.rejects(
      async () => seedToFile(taskEntity, 1, ''),
      { name: 'TypeError' },
    );
  });
});
