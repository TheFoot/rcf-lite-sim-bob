/**
 * Tests for tools/utils/scaffold.mjs
 *
 * Tests verify the CONTENT of generated files (string assertions) rather than
 * spinning up a running Express server.  The scaffolder's job is to produce
 * correct code -- testing that code runs is the app's test suite's job.
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { scaffoldEntity, scaffoldAll } from '../scaffold.mjs';

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

const projectEntity = {
  name: 'Project',
  pluralName: 'projects',
  fields: [
    { name: 'name', type: 'string', required: true },
    { name: 'description', type: 'string' },
    { name: 'active', type: 'boolean' },
  ],
};

/* ---------- Temp dir management ----------------------------------------- */

const tempRoots = [];

afterEach(async () => {
  for (const dir of tempRoots) {
    await rm(dir, { recursive: true, force: true });
  }
  tempRoots.length = 0;
});

function makeTempRoot() {
  const root = join(tmpdir(), `scaffold-test-${randomUUID()}`);
  tempRoots.push(root);
  return root;
}

/* ---------- scaffoldEntity ---------------------------------------------- */

describe('scaffoldEntity', () => {
  it('should create all 5 expected files', async () => {
    const root = makeTempRoot();
    const result = await scaffoldEntity(taskEntity, root);

    assert.equal(result.files.length, 5);
    assert.ok(result.files.includes('src/server/routes/tasks.mjs'));
    assert.ok(result.files.includes('src/public/js/services/tasks-api.mjs'));
    assert.ok(result.files.includes('src/public/js/components/task-card.mjs'));
    assert.ok(result.files.includes('src/public/js/components/task-form.mjs'));
    assert.ok(result.files.includes('src/public/js/components/task-detail.mjs'));
  });

  it('should return a CSS block string', async () => {
    const root = makeTempRoot();
    const result = await scaffoldEntity(taskEntity, root);

    assert.equal(typeof result.css, 'string');
    assert.ok(result.css.includes('.task-card'));
    assert.ok(result.css.includes('.task-form'));
    assert.ok(result.css.includes('.task-detail'));
    assert.ok(result.css.includes('var(--color-surface)'));
  });

  it('should generate files that actually exist on disk', async () => {
    const root = makeTempRoot();
    const result = await scaffoldEntity(taskEntity, root);

    for (const file of result.files) {
      const content = await readFile(join(root, file), 'utf8');
      assert.ok(content.length > 0, `${file} should not be empty`);
    }
  });

  it('should throw for missing entity properties', async () => {
    await assert.rejects(
      async () => scaffoldEntity({}, '/tmp'),
      { name: 'TypeError' },
    );
    await assert.rejects(
      async () => scaffoldEntity({ name: 'X' }, '/tmp'),
      { name: 'TypeError' },
    );
  });

  it('should throw for missing projectRoot', async () => {
    await assert.rejects(
      async () => scaffoldEntity(taskEntity, ''),
      { name: 'TypeError' },
    );
  });
});

/* ---------- Route file content ------------------------------------------ */

describe('scaffoldEntity route file', () => {
  it('should export a registerTaskRoutes function', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/server/routes/tasks.mjs'), 'utf8');
    assert.ok(content.includes('export function registerTaskRoutes(router)'));
  });

  it('should register all CRUD routes', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/server/routes/tasks.mjs'), 'utf8');
    assert.ok(content.includes("router.get('/tasks'"), 'should have list route');
    assert.ok(content.includes("router.get('/tasks/:id'"), 'should have get route');
    assert.ok(content.includes("router.post('/tasks'"), 'should have create route');
    assert.ok(content.includes("router.put('/tasks/:id'"), 'should have update route');
    assert.ok(content.includes("router.delete('/tasks/:id'"), 'should have delete route');
  });

  it('should use ESM imports (no require)', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/server/routes/tasks.mjs'), 'utf8');
    assert.ok(content.includes('import {'));
    assert.ok(!content.includes('require('));
  });

  it('should use crypto.randomUUID() for ID generation', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/server/routes/tasks.mjs'), 'utf8');
    assert.ok(content.includes('randomUUID'));
  });

  it('should use JSON flat file persistence in data/', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/server/routes/tasks.mjs'), 'utf8');
    assert.ok(content.includes("'data'"));
    assert.ok(content.includes("'tasks.json'"));
  });

  it('should include validation for required fields', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/server/routes/tasks.mjs'), 'utf8');
    assert.ok(content.includes('VALIDATION_ERROR'));
    assert.ok(content.includes('title'));
    assert.ok(content.includes('required: true'));
  });

  it('should use the standard error shape', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/server/routes/tasks.mjs'), 'utf8');
    assert.ok(content.includes("{ error: { code: 'NOT_FOUND'"));
    assert.ok(content.includes("{ error: { code: 'VALIDATION_ERROR'"));
  });

  it('should return 201 for create and 204 for delete', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/server/routes/tasks.mjs'), 'utf8');
    assert.ok(content.includes('res.status(201)'));
    assert.ok(content.includes('res.status(204)'));
  });

  it('should handle default values in create handler', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/server/routes/tasks.mjs'), 'utf8');
    // status has a default of 'open'
    assert.ok(content.includes("'open'"), 'should include default status value');
    // priority has a default of 0
    assert.ok(content.includes('0'), 'should include default priority value');
  });
});

/* ---------- Service file content ---------------------------------------- */

describe('scaffoldEntity service file', () => {
  it('should export all CRUD functions', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/services/tasks-api.mjs'), 'utf8');
    assert.ok(content.includes('export async function fetchTasks()'));
    assert.ok(content.includes('export async function fetchTask(id)'));
    assert.ok(content.includes('export async function createTask(data)'));
    assert.ok(content.includes('export async function updateTask(id, data)'));
    assert.ok(content.includes('export async function deleteTask(id)'));
  });

  it('should use the correct API base path', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/services/tasks-api.mjs'), 'utf8');
    assert.ok(content.includes("'/api/v1'"));
  });

  it('should use ESM exports', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/services/tasks-api.mjs'), 'utf8');
    assert.ok(content.includes('export async function'));
    assert.ok(!content.includes('module.exports'));
  });
});

/* ---------- Card component content -------------------------------------- */

describe('scaffoldEntity card component', () => {
  it('should export createTaskCard function', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-card.mjs'), 'utf8');
    assert.ok(content.includes('export function createTaskCard(item)'));
  });

  it('should use document.createElement (DOM, not innerHTML)', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-card.mjs'), 'utf8');
    assert.ok(content.includes('document.createElement'));
    assert.ok(!content.includes('innerHTML'));
  });

  it('should use textContent for user data', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-card.mjs'), 'utf8');
    assert.ok(content.includes('textContent'));
  });

  it('should set cursor pointer for clickability', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-card.mjs'), 'utf8');
    assert.ok(content.includes('cursor'));
  });
});

/* ---------- Form component content -------------------------------------- */

describe('scaffoldEntity form component', () => {
  it('should export createTaskForm function', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-form.mjs'), 'utf8');
    assert.ok(content.includes('export function createTaskForm('));
  });

  it('should create a form element', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-form.mjs'), 'utf8');
    assert.ok(content.includes("document.createElement('form')"));
  });

  it('should generate select element for enum fields', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-form.mjs'), 'utf8');
    assert.ok(content.includes("document.createElement('select')"));
    assert.ok(content.includes("'open'"));
    assert.ok(content.includes("'in-progress'"));
    assert.ok(content.includes("'done'"));
  });

  it('should generate number input for number fields', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-form.mjs'), 'utf8');
    assert.ok(content.includes("type = 'number'"));
  });

  it('should handle required field validation', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-form.mjs'), 'utf8');
    assert.ok(content.includes('required = true') || content.includes('.required'));
    assert.ok(content.includes('Title is required'));
  });

  it('should support pre-population for edit mode', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-form.mjs'), 'utf8');
    assert.ok(content.includes('item &&'));
    assert.ok(content.includes("item ? 'Update' : 'Create'"));
  });
});

/* ---------- Detail component content ------------------------------------ */

describe('scaffoldEntity detail component', () => {
  it('should export createTaskDetail function', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-detail.mjs'), 'utf8');
    assert.ok(content.includes('export function createTaskDetail('));
  });

  it('should include edit and delete buttons', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-detail.mjs'), 'utf8');
    assert.ok(content.includes("'Edit'"));
    assert.ok(content.includes("'Delete'"));
    assert.ok(content.includes('btn--primary'));
    assert.ok(content.includes('btn--danger'));
  });

  it('should include a delete confirmation', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-detail.mjs'), 'utf8');
    assert.ok(content.includes('confirm('));
  });

  it('should use textContent not innerHTML', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-detail.mjs'), 'utf8');
    assert.ok(content.includes('textContent'));
    assert.ok(!content.includes('innerHTML'));
  });

  it('should display all entity fields', async () => {
    const root = makeTempRoot();
    await scaffoldEntity(taskEntity, root);

    const content = await readFile(join(root, 'src/public/js/components/task-detail.mjs'), 'utf8');
    for (const field of taskEntity.fields) {
      assert.ok(content.includes(field.name), `should display field: ${field.name}`);
    }
  });
});

/* ---------- scaffoldAll ------------------------------------------------- */

describe('scaffoldAll', () => {
  it('should scaffold multiple entities', async () => {
    const root = makeTempRoot();
    const result = await scaffoldAll([taskEntity, projectEntity], root);

    assert.equal(result.allFiles.length, 10); // 5 per entity
    assert.equal(result.cssBlocks.length, 2);
  });

  it('should return a registration snippet with imports and mounts', async () => {
    const root = makeTempRoot();
    const result = await scaffoldAll([taskEntity, projectEntity], root);

    assert.ok(result.registrationSnippet.includes("import { registerTaskRoutes }"));
    assert.ok(result.registrationSnippet.includes("import { registerProjectRoutes }"));
    assert.ok(result.registrationSnippet.includes('registerTaskRoutes(apiRouter)'));
    assert.ok(result.registrationSnippet.includes('registerProjectRoutes(apiRouter)'));
  });

  it('should use correct file paths in imports', async () => {
    const root = makeTempRoot();
    const result = await scaffoldAll([taskEntity], root);

    assert.ok(result.registrationSnippet.includes("'./routes/tasks.mjs'"));
  });

  it('should throw for empty entities array', async () => {
    await assert.rejects(
      async () => scaffoldAll([], '/tmp'),
      { name: 'TypeError' },
    );
  });

  it('should throw for non-array input', async () => {
    await assert.rejects(
      async () => scaffoldAll('not-an-array', '/tmp'),
      { name: 'TypeError' },
    );
  });
});
