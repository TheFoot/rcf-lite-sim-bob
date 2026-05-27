/**
 * Mock data generator.
 *
 * Generates realistic-looking records for any entity definition.
 * Zero external dependencies -- uses curated word pools and crypto.randomUUID().
 */

import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

/* ---------- Word pools -------------------------------------------------- */

const FIRST_NAMES = [
  'Alice', 'Ben', 'Carla', 'David', 'Elena', 'Frank', 'Grace', 'Hector',
  'Iris', 'James', 'Karen', 'Leo', 'Maria', 'Nathan', 'Olivia', 'Paul',
  'Quinn', 'Rosa', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier',
];

const LAST_NAMES = [
  'Adams', 'Baker', 'Chen', 'Davis', 'Evans', 'Foster', 'Garcia', 'Harris',
  'Ito', 'Johnson', 'Kim', 'Lee', 'Martinez', 'Nguyen', 'O\'Brien', 'Patel',
  'Quinn', 'Roberts', 'Smith', 'Taylor', 'Ueda', 'Vasquez', 'Williams', 'Young',
];

const TITLE_ADJECTIVES = [
  'Automated', 'Interactive', 'Responsive', 'Secure', 'Scalable', 'Modular',
  'Dynamic', 'Unified', 'Integrated', 'Optimised', 'Streamlined', 'Resilient',
];

const TITLE_NOUNS = [
  'Dashboard', 'Pipeline', 'Workflow', 'Report', 'Integration', 'Module',
  'Service', 'Endpoint', 'Deployment', 'Configuration', 'Migration', 'Template',
];

const SENTENCE_STARTERS = [
  'This component handles', 'We need to implement', 'The team discussed',
  'Consider updating', 'Review the approach for', 'The requirement covers',
  'This task involves', 'Focus on delivering', 'Testing should verify',
  'The specification outlines',
];

const SENTENCE_MIDDLES = [
  'the core functionality of', 'a complete rewrite of', 'incremental improvements to',
  'validation logic for', 'user-facing changes in', 'backend processing of',
  'data transformation within', 'error handling across', 'performance tuning of',
  'the initial setup for',
];

const SENTENCE_ENDINGS = [
  'the notification subsystem.', 'the data export feature.', 'the user registration flow.',
  'the API gateway layer.', 'the configuration manager.', 'the access control module.',
  'the event processing pipeline.', 'the reporting dashboard.', 'the file upload handler.',
  'the search indexing service.',
];

const EMAIL_DOMAINS = [
  'example.com', 'acme.org', 'techcorp.io', 'devteam.net', 'workshop.dev',
];

/* ---------- Helpers ----------------------------------------------------- */

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomIsoDate(daysBack = 90) {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset).toISOString();
}

function generateName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function generateEmail() {
  const first = pick(FIRST_NAMES).toLowerCase();
  const last = pick(LAST_NAMES).toLowerCase();
  return `${first}.${last}@${pick(EMAIL_DOMAINS)}`;
}

function generateTitle() {
  return `${pick(TITLE_ADJECTIVES)} ${pick(TITLE_NOUNS)}`;
}

function generateSentence() {
  return `${pick(SENTENCE_STARTERS)} ${pick(SENTENCE_MIDDLES)} ${pick(SENTENCE_ENDINGS)}`;
}

function generateDescription() {
  const count = randomInt(1, 2);
  const sentences = [];
  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence());
  }
  return sentences.join(' ');
}

/* ---------- Field generator dispatcher ---------------------------------- */

function generateFieldValue(field) {
  const name = (field.name || '').toLowerCase();
  const type = field.type || 'string';

  // Default value handling
  if (field.default !== undefined && Math.random() < 0.3) {
    return field.default;
  }

  switch (type) {
    case 'enum':
      return pick(field.options || ['unknown']);

    case 'boolean':
      return Math.random() < 0.5;

    case 'number': {
      const min = field.min !== undefined ? field.min : 0;
      const max = field.max !== undefined ? field.max : 100;
      return randomInt(min, max);
    }

    case 'date':
      return randomIsoDate();

    case 'id':
    case 'reference':
      return randomUUID();

    case 'string':
    default:
      // Infer generator from field name
      if (name.includes('email')) return generateEmail();
      if (name.includes('name') || name === 'assignee' || name === 'author' || name === 'owner') return generateName();
      if (name.includes('title') || name === 'subject') return generateTitle();
      if (name.includes('description') || name.includes('summary') || name.includes('body') || name.includes('note')) return generateDescription();
      // Generic string
      return generateSentence();
  }
}

/* ---------- Public API -------------------------------------------------- */

/**
 * Generate an array of records for the given entity definition.
 *
 * @param {object} entity  - { name, pluralName, fields: [...] }
 * @param {number} count   - number of records to generate
 * @returns {Array<object>}
 */
export function generateRecords(entity, count) {
  if (!entity || !Array.isArray(entity.fields)) {
    throw new TypeError('entity must have a fields array');
  }
  if (typeof count !== 'number' || count < 0) {
    throw new TypeError('count must be a non-negative number');
  }

  const records = [];
  for (let i = 0; i < count; i++) {
    const record = {
      id: randomUUID(),
      createdAt: randomIsoDate(),
    };
    for (const field of entity.fields) {
      record[field.name] = generateFieldValue(field);
    }
    records.push(record);
  }

  // Sort by createdAt descending (newest first)
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return records;
}

/**
 * Generate records and write them to data/{pluralName}.json.
 *
 * @param {object} entity       - entity definition
 * @param {number} count        - number of records
 * @param {string} projectRoot  - absolute path to project root
 * @returns {Promise<Array<object>>} the generated records
 */
export async function seedToFile(entity, count, projectRoot) {
  if (!entity || !entity.pluralName) {
    throw new TypeError('entity must have a pluralName');
  }
  if (!projectRoot) {
    throw new TypeError('projectRoot is required');
  }

  const records = generateRecords(entity, count);
  const dataDir = join(projectRoot, 'data');
  await mkdir(dataDir, { recursive: true });
  const filePath = join(dataDir, `${entity.pluralName}.json`);
  await writeFile(filePath, JSON.stringify(records, null, 2) + '\n');
  return records;
}
