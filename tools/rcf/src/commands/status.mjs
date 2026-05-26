import { requireRcf } from '../lib/paths.mjs';
import { loadAll, countStories, countAcceptanceCriteria } from '../lib/loader.mjs';

export default async function status(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
\x1b[1mrcf status\x1b[0m -- Project health check

Displays a summary of the project state: requirements, stories,
acceptance criteria, build specs, and tests.
`);
    return;
  }

  requireRcf();

  const { project, prd, buildSpecs, testSpecs } = loadAll();

  if (!project) {
    console.error('\x1b[31mNo project.json found. Run `rcf init` first.\x1b[0m');
    process.exit(1);
  }

  const projectName = project.name || '(unnamed)';
  const phase = project.phase || 'new';

  // PRD stats
  const reqCount = prd ? (prd.requirements || []).length : 0;
  const storyCount = prd ? countStories(prd) : 0;
  const acCount = prd ? countAcceptanceCriteria(prd) : 0;

  // Build spec stats
  const bsReady = buildSpecs.filter(b => b.status === 'ready').length;
  const bsDefining = buildSpecs.filter(b => b.status === 'defining').length;
  const bsBuilding = buildSpecs.filter(b => b.status === 'building').length;
  const bsReviewing = buildSpecs.filter(b => b.status === 'reviewing').length;
  const bsTesting = buildSpecs.filter(b => b.status === 'testing').length;
  const bsVerified = buildSpecs.filter(b => b.status === 'verified').length;

  // Test spec stats
  const tsDefined = testSpecs.filter(t => t.status === 'defined').length;
  const tsRunning = testSpecs.filter(t => t.status === 'running').length;
  const tsPassed = testSpecs.filter(t => t.status === 'passed').length;
  const tsFailed = testSpecs.filter(t => t.status === 'failed').length;

  // Count individual test cases
  let tcPassing = 0;
  let tcTotal = 0;
  for (const ts of testSpecs) {
    for (const tc of ts.testCases || []) {
      tcTotal++;
      if (tc.status === 'passing') tcPassing++;
    }
  }

  // Print report
  console.log(`\x1b[1mProject:\x1b[0m ${projectName}`);
  console.log(`\x1b[1mPhase:\x1b[0m   ${phase}`);
  console.log();

  console.log(`\x1b[2mRequirements:\x1b[0m         ${reqCount}`);
  console.log(`\x1b[2mUser Stories:\x1b[0m         ${storyCount}`);
  console.log(`\x1b[2mAcceptance Criteria:\x1b[0m  ${acCount}`);
  console.log();

  const bsParts = [];
  if (bsReady) bsParts.push(`${bsReady} ready`);
  if (bsDefining) bsParts.push(`${bsDefining} defining`);
  if (bsBuilding) bsParts.push(`${bsBuilding} building`);
  if (bsReviewing) bsParts.push(`${bsReviewing} reviewing`);
  if (bsTesting) bsParts.push(`${bsTesting} testing`);
  if (bsVerified) bsParts.push(`${bsVerified} verified`);
  const bsSummary = bsParts.length > 0 ? `${bsParts.join(' | ')} | ${buildSpecs.length} total` : '0 total';
  console.log(`\x1b[2mBuild Specs:\x1b[0m   ${bsSummary}`);

  const tsParts = [];
  if (tsDefined) tsParts.push(`${tsDefined} defined`);
  if (tsRunning) tsParts.push(`${tsRunning} running`);
  if (tsPassed) tsParts.push(`${tsPassed} passed`);
  if (tsFailed) tsParts.push(`${tsFailed} failed`);
  const tsSummary = tsParts.length > 0 ? `${tsParts.join(' | ')} | ${testSpecs.length} total` : '0 total';
  console.log(`\x1b[2mTests:\x1b[0m         ${tsSummary}`);

  if (tcTotal > 0) {
    console.log(`\x1b[2mTest Cases:\x1b[0m    ${tcPassing}/${tcTotal} passing`);
  }
  console.log();

  // Suggest next action
  const next = suggestNext(phase, reqCount, storyCount, acCount, buildSpecs.length, bsVerified, testSpecs.length, tsPassed);
  console.log(`\x1b[1mNext:\x1b[0m ${next}`);
}

function suggestNext(phase, reqs, stories, acs, bsCount, bsVerified, tsCount, tsPassed) {
  if (reqs === 0) return 'Run /define in Claude Code to capture requirements.';
  if (stories === 0) return 'Add user stories to your requirements in prd.json.';
  if (acs === 0) return 'Add acceptance criteria to your user stories.';
  if (bsCount === 0) return 'Run /build-sequence in Claude Code to generate build specs.';
  if (bsVerified < bsCount) return `${bsCount - bsVerified} build spec(s) not yet verified. Continue building.`;
  if (tsCount === 0) return 'Generate test specs to verify your acceptance criteria.';
  if (tsPassed < tsCount) return `${tsCount - tsPassed} test spec(s) not yet passing. Run tests.`;
  return 'All green. Run `rcf coverage` for a detailed report.';
}
