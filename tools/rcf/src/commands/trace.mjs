import { requireRcf } from '../lib/paths.mjs';
import { loadAll, collectAcIds } from '../lib/loader.mjs';

export default async function trace(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
\x1b[1mrcf trace [ID]\x1b[0m -- Show traceability chain

Without arguments: shows the full traceability tree.
With an ID: shows the chain for that specific item (up and down).

\x1b[1mExamples:\x1b[0m
  rcf trace           # Full tree
  rcf trace REQ-001   # Chain for requirement REQ-001
  rcf trace BS-003    # Chain for build spec BS-003
`);
    return;
  }

  requireRcf();

  const { prd, buildSpecs, testSpecs } = loadAll();

  if (!prd) {
    console.log('\x1b[33mNo PRD found. Run /define in Claude Code first.\x1b[0m');
    return;
  }

  const targetId = args[0] || null;

  if (targetId) {
    printFilteredTrace(prd, buildSpecs, testSpecs, targetId);
  } else {
    printFullTrace(prd, buildSpecs, testSpecs);
  }
}

function printFullTrace(prd, buildSpecs, testSpecs) {
  if (!prd.requirements || prd.requirements.length === 0) {
    console.log('\x1b[33mNo requirements defined yet.\x1b[0m');
    return;
  }

  for (const req of prd.requirements) {
    console.log(`\x1b[1m${req.id}: ${req.title}\x1b[0m`);

    for (const story of req.stories || []) {
      console.log(`  └─ ${story.id}: ${story.title}`);

      for (const ac of story.acceptanceCriteria || []) {
        const acLabel = `Given ${ac.given}, when ${ac.when}, then ${ac.then}`;
        console.log(`     └─ ${ac.id}: ${truncate(acLabel, 70)}`);

        // Find build specs covering this AC
        const matchingBs = buildSpecs.filter(bs =>
          (bs.acceptanceCriteria || []).includes(ac.id)
        );

        for (const bs of matchingBs) {
          const statusTag = statusColour(bs.status);
          console.log(`        └─ ${bs.id}: ${bs.title || '(untitled)'} ${statusTag}`);

          // Find test specs for this build spec
          const matchingTs = testSpecs.filter(ts => ts.buildSpec === bs.id);
          for (const ts of matchingTs) {
            const passing = (ts.testCases || []).filter(tc => tc.status === 'passing').length;
            const total = (ts.testCases || []).length;
            const tsStatus = ts.status === 'passed'
              ? `\x1b[32m${passing}/${total} passing\x1b[0m`
              : ts.status === 'failed'
                ? `\x1b[31m${passing}/${total} passing\x1b[0m`
                : `\x1b[2m${passing}/${total} passing\x1b[0m`;
            console.log(`           └─ ${ts.id}: ${tsStatus}`);
          }
        }

        // Also find test specs directly linked to this AC (not via build spec)
        const directTs = testSpecs.filter(ts =>
          (ts.acceptanceCriteria || []).includes(ac.id) &&
          !buildSpecs.some(bs =>
            (bs.acceptanceCriteria || []).includes(ac.id) && ts.buildSpec === bs.id
          )
        );
        for (const ts of directTs) {
          const passing = (ts.testCases || []).filter(tc => tc.status === 'passing').length;
          const total = (ts.testCases || []).length;
          console.log(`        └─ ${ts.id}: ${passing}/${total} passing \x1b[2m(direct)\x1b[0m`);
        }
      }
    }
    console.log();
  }
}

function printFilteredTrace(prd, buildSpecs, testSpecs, targetId) {
  // Determine what kind of ID this is
  const isReq = /^REQ-\d{3}$/.test(targetId);
  const isStory = /^US-\d{3}$/.test(targetId);
  const isAc = /^AC-\d{3}-\d{2}$/.test(targetId);
  const isBs = /^BS-\d{3}$/.test(targetId);
  const isTs = /^TS-\d{3}$/.test(targetId);

  if (isReq) {
    const req = (prd.requirements || []).find(r => r.id === targetId);
    if (!req) {
      console.error(`\x1b[31mRequirement ${targetId} not found.\x1b[0m`);
      process.exit(1);
    }
    // Print the full subtree for this requirement
    printFullTrace({ requirements: [req] }, buildSpecs, testSpecs);
    return;
  }

  if (isStory) {
    for (const req of prd.requirements || []) {
      const story = (req.stories || []).find(s => s.id === targetId);
      if (story) {
        console.log(`\x1b[2m(from ${req.id}: ${req.title})\x1b[0m`);
        printFullTrace({ requirements: [{ ...req, stories: [story] }] }, buildSpecs, testSpecs);
        return;
      }
    }
    console.error(`\x1b[31mStory ${targetId} not found.\x1b[0m`);
    process.exit(1);
  }

  if (isAc) {
    for (const req of prd.requirements || []) {
      for (const story of req.stories || []) {
        const ac = (story.acceptanceCriteria || []).find(a => a.id === targetId);
        if (ac) {
          console.log(`\x1b[2m(from ${req.id} > ${story.id})\x1b[0m`);
          printFullTrace(
            { requirements: [{ ...req, stories: [{ ...story, acceptanceCriteria: [ac] }] }] },
            buildSpecs,
            testSpecs
          );
          return;
        }
      }
    }
    console.error(`\x1b[31mAcceptance criteria ${targetId} not found.\x1b[0m`);
    process.exit(1);
  }

  if (isBs) {
    const bs = buildSpecs.find(b => b.id === targetId);
    if (!bs) {
      console.error(`\x1b[31mBuild spec ${targetId} not found.\x1b[0m`);
      process.exit(1);
    }

    // Trace upward
    const req = (prd.requirements || []).find(r => r.id === bs.requirement);
    const story = req ? (req.stories || []).find(s => s.id === bs.story) : null;

    if (req) console.log(`\x1b[2mRequirement:\x1b[0m ${req.id}: ${req.title}`);
    if (story) console.log(`\x1b[2mStory:\x1b[0m       ${story.id}: ${story.title}`);

    const statusTag = statusColour(bs.status);
    console.log(`\x1b[1mBuild Spec:\x1b[0m  ${bs.id}: ${bs.title || '(untitled)'} ${statusTag}`);

    // ACs
    for (const acId of bs.acceptanceCriteria || []) {
      console.log(`  \x1b[2mAC:\x1b[0m ${acId}`);
    }

    // Test specs
    const matchingTs = testSpecs.filter(ts => ts.buildSpec === bs.id);
    for (const ts of matchingTs) {
      const passing = (ts.testCases || []).filter(tc => tc.status === 'passing').length;
      const total = (ts.testCases || []).length;
      console.log(`  \x1b[2mTest:\x1b[0m ${ts.id}: ${passing}/${total} passing`);
    }
    return;
  }

  if (isTs) {
    const ts = testSpecs.find(t => t.id === targetId);
    if (!ts) {
      console.error(`\x1b[31mTest spec ${targetId} not found.\x1b[0m`);
      process.exit(1);
    }

    // Trace upward via build spec
    const bs = buildSpecs.find(b => b.id === ts.buildSpec);
    const req = bs ? (prd.requirements || []).find(r => r.id === bs.requirement) : null;
    const story = req && bs ? (req.stories || []).find(s => s.id === bs.story) : null;

    if (req) console.log(`\x1b[2mRequirement:\x1b[0m ${req.id}: ${req.title}`);
    if (story) console.log(`\x1b[2mStory:\x1b[0m       ${story.id}: ${story.title}`);
    if (bs) console.log(`\x1b[2mBuild Spec:\x1b[0m  ${bs.id}: ${bs.title || '(untitled)'} [${bs.status}]`);

    console.log(`\x1b[1mTest Spec:\x1b[0m   ${ts.id} [${ts.status}]`);

    for (const tc of ts.testCases || []) {
      const icon = tc.status === 'passing' ? '\x1b[32m✓\x1b[0m' : tc.status === 'failing' ? '\x1b[31m✗\x1b[0m' : '\x1b[2m○\x1b[0m';
      console.log(`  ${icon} ${tc.id}: ${tc.description} \x1b[2m(verifies ${tc.verifiesAc})\x1b[0m`);
    }
    return;
  }

  console.error(`\x1b[31mUnrecognised ID format: ${targetId}\x1b[0m`);
  console.error('Expected: REQ-NNN, US-NNN, AC-NNN-NN, BS-NNN, or TS-NNN');
  process.exit(1);
}

function statusColour(status) {
  switch (status) {
    case 'verified': return '\x1b[32m[verified]\x1b[0m';
    case 'building': return '\x1b[33m[building]\x1b[0m';
    case 'testing': return '\x1b[36m[testing]\x1b[0m';
    case 'reviewing': return '\x1b[35m[reviewing]\x1b[0m';
    case 'ready': return '\x1b[2m[ready]\x1b[0m';
    case 'defining': return '\x1b[2m[defining]\x1b[0m';
    default: return `[${status}]`;
  }
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
