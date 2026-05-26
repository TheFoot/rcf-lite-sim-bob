import { existsSync } from 'node:fs';
import { requireRcf, rcfPath, buildSpecsDir, testsDir } from '../lib/paths.mjs';
import { loadAll, collectRequirementIds, collectStoryIds, collectAcIds } from '../lib/loader.mjs';
import { loadSchemas, validate } from '../lib/schemas.mjs';

export default async function validateCmd(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
\x1b[1mrcf validate\x1b[0m -- Schema validation and referential integrity check

Validates all RCF documents against their JSON schemas and checks
that all cross-references (IDs) are valid.

Exit code 0 if valid, 1 if errors found.
`);
    return;
  }

  requireRcf();

  const schemas = loadSchemas();
  if (schemas.size === 0) {
    console.error('\x1b[31mNo schemas found. Check that schemas/ directory exists.\x1b[0m');
    process.exit(2);
  }

  const { project, prd, design, buildSpecs, testSpecs } = loadAll();

  let totalDocs = 0;
  let totalErrors = 0;
  const allErrors = [];

  // Validate project.json
  if (project) {
    totalDocs++;
    const projectSchema = schemas.get('project');
    if (projectSchema) {
      const errors = validate(project, projectSchema, 'project.json');
      if (errors.length > 0) {
        totalErrors += errors.length;
        allErrors.push({ file: 'rcf/project.json', errors });
      }
    }
  }

  // Validate prd.json
  if (prd) {
    totalDocs++;
    const prdSchema = schemas.get('prd');
    if (prdSchema) {
      const errors = validate(prd, prdSchema, 'prd.json');
      if (errors.length > 0) {
        totalErrors += errors.length;
        allErrors.push({ file: 'rcf/prd.json', errors });
      }
    }
  }

  // Validate design.json
  if (design) {
    totalDocs++;
    const designSchema = schemas.get('design');
    if (designSchema) {
      const errors = validate(design, designSchema, 'design.json');
      if (errors.length > 0) {
        totalErrors += errors.length;
        allErrors.push({ file: 'rcf/design.json', errors });
      }
    }
  }

  // Validate build specs
  const bsSchema = schemas.get('build-spec');
  for (const bs of buildSpecs) {
    totalDocs++;
    if (bsSchema) {
      const errors = validate(bs, bsSchema, `build-specs/${bs.id}.json`);
      if (errors.length > 0) {
        totalErrors += errors.length;
        allErrors.push({ file: `rcf/build-specs/${bs.id}.json`, errors });
      }
    }
  }

  // Validate test specs
  const tsSchema = schemas.get('test-spec');
  for (const ts of testSpecs) {
    totalDocs++;
    if (tsSchema) {
      const errors = validate(ts, tsSchema, `tests/${ts.id}.json`);
      if (errors.length > 0) {
        totalErrors += errors.length;
        allErrors.push({ file: `rcf/tests/${ts.id}.json`, errors });
      }
    }
  }

  // Referential integrity checks
  const refErrors = [];

  if (prd) {
    const reqIds = new Set(collectRequirementIds(prd));
    const storyIds = new Set(collectStoryIds(prd));
    const acIds = new Set(collectAcIds(prd));

    // Check build specs reference valid PRD entities
    for (const bs of buildSpecs) {
      const bsReqs = Array.isArray(bs.requirement) ? bs.requirement : bs.requirement ? [bs.requirement] : [];
      for (const r of bsReqs) {
        if (!reqIds.has(r)) {
          refErrors.push(`${bs.id}: references unknown requirement "${r}"`);
        }
      }
      const bsStories = Array.isArray(bs.story) ? bs.story : bs.story ? [bs.story] : [];
      for (const s of bsStories) {
        if (!storyIds.has(s)) {
          refErrors.push(`${bs.id}: references unknown story "${s}"`);
        }
      }
      for (const acId of bs.acceptanceCriteria || []) {
        if (!acIds.has(acId)) {
          refErrors.push(`${bs.id}: references unknown acceptance criteria "${acId}"`);
        }
      }
      // Check dependencies reference valid build specs
      const bsIdSet = new Set(buildSpecs.map(b => b.id));
      for (const dep of bs.dependencies || []) {
        if (!bsIdSet.has(dep)) {
          refErrors.push(`${bs.id}: references unknown dependency "${dep}"`);
        }
      }
    }

    // Check test specs reference valid build specs
    const bsIdSet = new Set(buildSpecs.map(b => b.id));
    for (const ts of testSpecs) {
      if (ts.buildSpec && !bsIdSet.has(ts.buildSpec)) {
        refErrors.push(`${ts.id}: references unknown build spec "${ts.buildSpec}"`);
      }
      for (const acId of ts.acceptanceCriteria || []) {
        if (!acIds.has(acId)) {
          refErrors.push(`${ts.id}: references unknown acceptance criteria "${acId}"`);
        }
      }
      for (const tc of ts.testCases || []) {
        if (tc.verifiesAc && !acIds.has(tc.verifiesAc)) {
          refErrors.push(`${ts.id}/${tc.id}: verifies unknown acceptance criteria "${tc.verifiesAc}"`);
        }
      }
    }
  }

  if (refErrors.length > 0) {
    totalErrors += refErrors.length;
    allErrors.push({ file: '(referential integrity)', errors: refErrors });
  }

  // Print results
  if (allErrors.length === 0) {
    console.log(`\x1b[32m${totalDocs} document(s) validated, 0 errors found.\x1b[0m`);
    process.exit(0);
  } else {
    console.log(`\x1b[31m${totalDocs} document(s) validated, ${totalErrors} error(s) found.\x1b[0m\n`);

    for (const { file, errors } of allErrors) {
      console.log(`  \x1b[1m${file}:\x1b[0m`);
      for (const err of errors) {
        console.log(`    \x1b[31m- ${err}\x1b[0m`);
      }
      console.log();
    }

    process.exit(1);
  }
}
