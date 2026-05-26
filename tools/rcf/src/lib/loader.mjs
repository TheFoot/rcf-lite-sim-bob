import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { rcfPath, buildSpecsDir, testsDir } from './paths.mjs';

/**
 * Read and parse a JSON file. Returns null if file doesn't exist.
 * @param {string} filePath - Absolute path
 * @returns {object|null}
 */
export function readJson(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Load the project manifest.
 * @returns {object|null}
 */
export function loadProject() {
  return readJson(rcfPath('project.json'));
}

/**
 * Load the PRD.
 * @returns {object|null}
 */
export function loadPrd() {
  return readJson(rcfPath('prd.json'));
}

/**
 * Load the design document.
 * @returns {object|null}
 */
export function loadDesign() {
  return readJson(rcfPath('design.json'));
}

/**
 * Load all build specs from rcf/build-specs/.
 * @returns {object[]}
 */
export function loadBuildSpecs() {
  const dir = buildSpecsDir();
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  return files.map(f => readJson(join(dir, f))).filter(Boolean);
}

/**
 * Load all test specs from rcf/tests/.
 * @returns {object[]}
 */
export function loadTestSpecs() {
  const dir = testsDir();
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  return files.map(f => readJson(join(dir, f))).filter(Boolean);
}

/**
 * Load everything in the rcf/ directory.
 * @returns {{ project: object|null, prd: object|null, design: object|null, buildSpecs: object[], testSpecs: object[] }}
 */
export function loadAll() {
  return {
    project: loadProject(),
    prd: loadPrd(),
    design: loadDesign(),
    buildSpecs: loadBuildSpecs(),
    testSpecs: loadTestSpecs(),
  };
}

/**
 * Count acceptance criteria across all requirements/stories in a PRD.
 * @param {object} prd - The PRD object
 * @returns {number}
 */
export function countAcceptanceCriteria(prd) {
  if (!prd || !prd.requirements) return 0;
  let count = 0;
  for (const req of prd.requirements) {
    for (const story of req.stories || []) {
      count += (story.acceptanceCriteria || []).length;
    }
  }
  return count;
}

/**
 * Count total stories across all requirements in a PRD.
 * @param {object} prd - The PRD object
 * @returns {number}
 */
export function countStories(prd) {
  if (!prd || !prd.requirements) return 0;
  let count = 0;
  for (const req of prd.requirements) {
    count += (req.stories || []).length;
  }
  return count;
}

/**
 * Collect all acceptance criteria IDs from the PRD.
 * @param {object} prd
 * @returns {string[]}
 */
export function collectAcIds(prd) {
  const ids = [];
  if (!prd || !prd.requirements) return ids;
  for (const req of prd.requirements) {
    for (const story of req.stories || []) {
      for (const ac of story.acceptanceCriteria || []) {
        ids.push(ac.id);
      }
    }
  }
  return ids;
}

/**
 * Collect all story IDs from the PRD.
 * @param {object} prd
 * @returns {string[]}
 */
export function collectStoryIds(prd) {
  const ids = [];
  if (!prd || !prd.requirements) return ids;
  for (const req of prd.requirements) {
    for (const story of req.stories || []) {
      ids.push(story.id);
    }
  }
  return ids;
}

/**
 * Collect all requirement IDs from the PRD.
 * @param {object} prd
 * @returns {string[]}
 */
export function collectRequirementIds(prd) {
  if (!prd || !prd.requirements) return [];
  return prd.requirements.map(r => r.id);
}
