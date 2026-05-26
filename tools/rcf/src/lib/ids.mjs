import { readdirSync } from 'node:fs';
import { buildSpecsDir, testsDir } from './paths.mjs';

/**
 * ID patterns for each document type.
 */
export const ID_PATTERNS = {
  requirement: /^REQ-(\d{3})$/,
  story: /^US-(\d{3})$/,
  acceptanceCriteria: /^AC-(\d{3})-(\d{2})$/,
  buildSpec: /^BS-(\d{3})$/,
  testSpec: /^TS-(\d{3})$/,
  testCase: /^TC-(\d{3})-(\d{2})$/,
};

/**
 * ID prefixes for each document type.
 */
export const ID_PREFIXES = {
  requirement: 'REQ',
  story: 'US',
  acceptanceCriteria: 'AC',
  buildSpec: 'BS',
  testSpec: 'TS',
  testCase: 'TC',
};

/**
 * Format a numeric ID with zero-padding.
 * @param {string} prefix - e.g. "BS"
 * @param {number} num - Sequence number
 * @returns {string} e.g. "BS-001"
 */
export function formatId(prefix, num) {
  return `${prefix}-${String(num).padStart(3, '0')}`;
}

/**
 * Parse the numeric part of an ID.
 * @param {string} id - e.g. "BS-003"
 * @returns {number} e.g. 3
 */
export function parseIdNum(id) {
  const match = id.match(/-(\d{3})$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Validate an ID against its expected pattern.
 * @param {string} id - The ID to validate
 * @param {string} type - The document type
 * @returns {boolean}
 */
export function isValidId(id, type) {
  const pattern = ID_PATTERNS[type];
  return pattern ? pattern.test(id) : false;
}

/**
 * Scan a directory for files matching a prefix pattern and return the next sequential ID.
 * @param {string} dir - Directory to scan
 * @param {string} prefix - ID prefix (e.g. "BS")
 * @returns {string} Next ID (e.g. "BS-004")
 */
export function nextIdInDir(dir, prefix) {
  let maxNum = 0;
  try {
    const files = readdirSync(dir);
    const pattern = new RegExp(`^${prefix}-(\\d{3})\\.json$`);
    for (const file of files) {
      const match = file.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  } catch {
    // Directory doesn't exist yet -- start at 1
  }
  return formatId(prefix, maxNum + 1);
}

/**
 * Get the next build spec ID.
 * @returns {string}
 */
export function nextBuildSpecId() {
  return nextIdInDir(buildSpecsDir(), 'BS');
}

/**
 * Get the next test spec ID.
 * @returns {string}
 */
export function nextTestSpecId() {
  return nextIdInDir(testsDir(), 'TS');
}
