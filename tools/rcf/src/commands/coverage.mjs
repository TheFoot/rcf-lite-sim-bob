import { requireRcf } from '../lib/paths.mjs';
import { loadAll, countStories, countAcceptanceCriteria, collectAcIds, collectStoryIds, collectRequirementIds } from '../lib/loader.mjs';

export default async function coverage(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
\x1b[1mrcf coverage\x1b[0m -- Requirements coverage report

Shows how well your requirements are covered by stories,
acceptance criteria, build specs, and test specs.
Highlights any gaps.
`);
    return;
  }

  requireRcf();

  const { prd, buildSpecs, testSpecs } = loadAll();

  if (!prd) {
    console.log('\x1b[33mNo PRD found. Run /define in Claude Code first.\x1b[0m');
    return;
  }

  const requirements = prd.requirements || [];
  const reqIds = collectRequirementIds(prd);
  const storyIds = collectStoryIds(prd);
  const acIds = collectAcIds(prd);

  // 1. Requirements with stories
  const reqsWithStories = requirements.filter(r => (r.stories || []).length > 0);
  const reqsWithoutStories = requirements.filter(r => (r.stories || []).length === 0);

  // 2. Stories with acceptance criteria
  const storiesWithAc = [];
  const storiesWithoutAc = [];
  for (const req of requirements) {
    for (const story of req.stories || []) {
      if ((story.acceptanceCriteria || []).length > 0) {
        storiesWithAc.push(story.id);
      } else {
        storiesWithoutAc.push(story.id);
      }
    }
  }

  // 3. AC with build specs
  const allBsAcIds = new Set();
  for (const bs of buildSpecs) {
    for (const acId of bs.acceptanceCriteria || []) {
      allBsAcIds.add(acId);
    }
  }
  const acsWithBuildSpecs = acIds.filter(id => allBsAcIds.has(id));
  const acsWithoutBuildSpecs = acIds.filter(id => !allBsAcIds.has(id));

  // 4. AC with test specs
  const allTsAcIds = new Set();
  for (const ts of testSpecs) {
    for (const acId of ts.acceptanceCriteria || []) {
      allTsAcIds.add(acId);
    }
    // Also count ACs covered via test case verifiesAc
    for (const tc of ts.testCases || []) {
      if (tc.verifiesAc) allTsAcIds.add(tc.verifiesAc);
    }
  }
  const acsWithTestSpecs = acIds.filter(id => allTsAcIds.has(id));
  const acsWithoutTestSpecs = acIds.filter(id => !allTsAcIds.has(id));

  // Overall coverage: proportion of AC that have both build spec AND test spec
  const acsCoveredBoth = acIds.filter(id => allBsAcIds.has(id) && allTsAcIds.has(id));
  const overallPct = acIds.length > 0
    ? ((acsCoveredBoth.length / acIds.length) * 100).toFixed(1)
    : '0.0';

  // Print report
  console.log('\x1b[1mCoverage Report\x1b[0m\n');

  printLine('Requirements with stories', reqsWithStories.length, requirements.length);
  printLine('Stories with acceptance criteria', storiesWithAc.length, storyIds.length);
  printLine('AC with build specs', acsWithBuildSpecs.length, acIds.length);
  printLine('AC with test specs', acsWithTestSpecs.length, acIds.length);

  console.log();
  const overallNum = parseFloat(overallPct);
  const overallColour = overallNum >= 100 ? '\x1b[32m' : overallNum >= 50 ? '\x1b[33m' : '\x1b[31m';
  console.log(`\x1b[1mOverall coverage:\x1b[0m ${overallColour}${overallPct}%\x1b[0m`);

  // Gaps
  const gaps = [];
  if (reqsWithoutStories.length > 0) {
    gaps.push({ label: 'Requirements without stories', ids: reqsWithoutStories.map(r => r.id) });
  }
  if (storiesWithoutAc.length > 0) {
    gaps.push({ label: 'Stories without acceptance criteria', ids: storiesWithoutAc });
  }
  if (acsWithoutBuildSpecs.length > 0) {
    gaps.push({ label: 'AC without build specs', ids: acsWithoutBuildSpecs });
  }
  if (acsWithoutTestSpecs.length > 0) {
    gaps.push({ label: 'AC without test specs', ids: acsWithoutTestSpecs });
  }

  if (gaps.length > 0) {
    console.log('\n\x1b[1mGaps:\x1b[0m');
    for (const gap of gaps) {
      console.log(`  \x1b[33m${gap.label}:\x1b[0m ${gap.ids.join(', ')}`);
    }
  } else {
    console.log('\n\x1b[32mNo gaps found -- full traceability.\x1b[0m');
  }
}

function printLine(label, covered, total) {
  const pct = total > 0 ? ((covered / total) * 100).toFixed(0) : '0';
  const colour = covered === total && total > 0 ? '\x1b[32m' : covered > 0 ? '\x1b[33m' : '\x1b[31m';
  const padded = label.padEnd(38);
  console.log(`  ${padded} ${colour}${covered}/${total}\x1b[0m`);
}
