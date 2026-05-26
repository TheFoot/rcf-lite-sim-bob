import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { rcfDir, rcfPath, buildSpecsDir, testsDir } from '../lib/paths.mjs';

export default async function init(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
\x1b[1mrcf init\x1b[0m -- Initialise an RCF project

Creates the rcf/ directory structure and project.json manifest.
Run this from the root of your project.
`);
    return;
  }

  const dir = rcfDir();

  if (existsSync(rcfPath('project.json'))) {
    console.log('\x1b[33mrcf/ directory already initialised.\x1b[0m');
    return;
  }

  // Create directories
  mkdirSync(dir, { recursive: true });
  mkdirSync(buildSpecsDir(), { recursive: true });
  mkdirSync(testsDir(), { recursive: true });

  // Create project.json
  const now = new Date().toISOString();
  const project = {
    name: '',
    description: '',
    phase: 'new',
    created: now,
    updated: now,
    stats: {
      requirements: 0,
      stories: 0,
      acceptanceCriteria: 0,
      buildSpecs: 0,
      buildSpecsVerified: 0,
      testsPassing: 0,
      testsTotal: 0,
    },
  };

  writeFileSync(rcfPath('project.json'), JSON.stringify(project, null, 2) + '\n');

  console.log('\x1b[32mRCF project initialised.\x1b[0m Run /define in Claude Code to capture requirements.');
}
