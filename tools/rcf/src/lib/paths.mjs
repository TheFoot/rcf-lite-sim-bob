import { join, resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the rcf/ directory relative to CWD.
 * @returns {string} Absolute path to the rcf/ directory
 */
export function rcfDir() {
  return join(process.cwd(), 'rcf');
}

/**
 * Check if the rcf/ directory exists.
 * @returns {boolean}
 */
export function rcfExists() {
  return existsSync(rcfDir());
}

/**
 * Require that rcf/ exists, or exit with a message.
 */
export function requireRcf() {
  if (!rcfExists()) {
    console.error('\x1b[31mNo rcf/ directory found. Run `rcf init` first.\x1b[0m');
    process.exit(1);
  }
}

/**
 * Get path to a file inside rcf/.
 * @param {...string} segments - Path segments relative to rcf/
 * @returns {string}
 */
export function rcfPath(...segments) {
  return join(rcfDir(), ...segments);
}

/**
 * Get the schemas directory (../../schemas/ relative to this CLI tool).
 * @returns {string}
 */
export function schemasDir() {
  return resolve(__dirname, '..', '..', '..', '..', 'schemas');
}

/**
 * Get path to the build-specs directory.
 * @returns {string}
 */
export function buildSpecsDir() {
  return rcfPath('build-specs');
}

/**
 * Get path to the tests directory.
 * @returns {string}
 */
export function testsDir() {
  return rcfPath('tests');
}
