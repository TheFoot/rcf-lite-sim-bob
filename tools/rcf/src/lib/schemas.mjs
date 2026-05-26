import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { schemasDir } from './paths.mjs';

/**
 * Load all JSON schemas from the schemas/ directory.
 * @returns {Map<string, object>} Map of schema filename (without .json) to parsed schema
 */
export function loadSchemas() {
  const dir = schemasDir();
  const schemas = new Map();

  try {
    const files = readdirSync(dir).filter(f => f.endsWith('.schema.json'));
    for (const file of files) {
      const content = readFileSync(join(dir, file), 'utf-8');
      const name = file.replace('.schema.json', '');
      schemas.set(name, JSON.parse(content));
    }
  } catch (err) {
    console.error(`\x1b[31mFailed to load schemas: ${err.message}\x1b[0m`);
  }

  return schemas;
}

/**
 * Validate a value against a JSON Schema (basic implementation).
 * Supports: type, required, properties, enum, pattern, items, minimum, additionalProperties.
 * Does NOT support: $ref, allOf, anyOf, oneOf, if/then/else, etc.
 * @param {*} value - The value to validate
 * @param {object} schema - The JSON Schema
 * @param {string} path - Current property path (for error messages)
 * @returns {string[]} Array of error messages (empty = valid)
 */
export function validate(value, schema, path = '') {
  const errors = [];

  if (!schema) return errors;

  // Type check
  if (schema.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (schema.type === 'integer') {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        errors.push(`${path || '(root)'}: expected integer, got ${actualType}`);
        return errors;
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${path || '(root)'}: expected array, got ${actualType}`);
        return errors;
      }
    } else if (actualType !== schema.type) {
      errors.push(`${path || '(root)'}: expected ${schema.type}, got ${actualType}`);
      return errors;
    }
  }

  // Enum check
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path || '(root)'}: value "${value}" not in enum [${schema.enum.join(', ')}]`);
  }

  // Pattern check
  if (schema.pattern && typeof value === 'string') {
    const re = new RegExp(schema.pattern);
    if (!re.test(value)) {
      errors.push(`${path || '(root)'}: "${value}" does not match pattern ${schema.pattern}`);
    }
  }

  // Minimum check
  if (schema.minimum !== undefined && typeof value === 'number') {
    if (value < schema.minimum) {
      errors.push(`${path || '(root)'}: ${value} is less than minimum ${schema.minimum}`);
    }
  }

  // Object validation
  if (schema.type === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // Required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (value[field] === undefined) {
          errors.push(`${path || '(root)'}: missing required field "${field}"`);
        }
      }
    }

    // Property validation
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (value[key] !== undefined) {
          errors.push(...validate(value[key], propSchema, path ? `${path}.${key}` : key));
        }
      }

      // Additional properties check
      if (schema.additionalProperties === false) {
        for (const key of Object.keys(value)) {
          if (!schema.properties[key]) {
            errors.push(`${path || '(root)'}: unexpected property "${key}"`);
          }
        }
      }
    }
  }

  // Array validation
  if (schema.type === 'array' && Array.isArray(value) && schema.items) {
    for (let i = 0; i < value.length; i++) {
      errors.push(...validate(value[i], schema.items, `${path}[${i}]`));
    }
  }

  return errors;
}

/**
 * Map an RCF document type to its schema name.
 */
export const DOCUMENT_SCHEMA_MAP = {
  project: 'project',
  prd: 'prd',
  design: 'design',
  'build-spec': 'build-spec',
  'test-spec': 'test-spec',
  trace: 'trace',
};
