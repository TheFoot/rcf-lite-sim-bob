import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireRcf, buildSpecsDir, testsDir } from '../lib/paths.mjs';
import { nextBuildSpecId, nextTestSpecId } from '../lib/ids.mjs';

const VALID_TYPES = ['requirement', 'story', 'build-spec', 'test-spec'];

export default async function newDoc(args) {
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
\x1b[1mrcf new <type>\x1b[0m -- Create a new RCF document

\x1b[1mTypes:\x1b[0m
  requirement   Add a requirement (lives in prd.json)
  story         Add a user story (lives in prd.json)
  build-spec    Create a new build spec file
  test-spec     Create a new test spec file
`);
    return;
  }

  requireRcf();

  const type = args[0];

  if (!VALID_TYPES.includes(type)) {
    console.error(`\x1b[31mUnknown type: ${type}\x1b[0m`);
    console.error(`Valid types: ${VALID_TYPES.join(', ')}`);
    process.exit(1);
  }

  if (type === 'requirement' || type === 'story') {
    console.log(`Add requirements and stories via /define in Claude Code -- they live in rcf/prd.json`);
    return;
  }

  if (type === 'build-spec') {
    const id = nextBuildSpecId();
    const now = new Date().toISOString();
    const spec = {
      id,
      title: '',
      description: '',
      requirement: '',
      story: '',
      acceptanceCriteria: [],
      status: 'ready',
      order: 1,
      created: now,
      updated: now,
    };

    const filePath = join(buildSpecsDir(), `${id}.json`);
    writeFileSync(filePath, JSON.stringify(spec, null, 2) + '\n');
    console.log(`\x1b[32mCreated:\x1b[0m ${filePath}`);
    console.log(`ID: \x1b[1m${id}\x1b[0m`);
    return;
  }

  if (type === 'test-spec') {
    const id = nextTestSpecId();
    const now = new Date().toISOString();
    const spec = {
      id,
      buildSpec: '',
      acceptanceCriteria: [],
      testCases: [],
      status: 'defined',
      created: now,
      updated: now,
    };

    const filePath = join(testsDir(), `${id}.json`);
    writeFileSync(filePath, JSON.stringify(spec, null, 2) + '\n');
    console.log(`\x1b[32mCreated:\x1b[0m ${filePath}`);
    console.log(`ID: \x1b[1m${id}\x1b[0m`);
    return;
  }
}
