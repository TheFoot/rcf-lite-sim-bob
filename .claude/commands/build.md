# /build -- Execute a build spec through the 5-stage cycle

Takes a build spec ID as argument (e.g., `/build BS-001`). Runs the full RCF 5-stage build cycle for that spec.

## Prerequisites

- `rcf/build-specs/BS-NNN.json` must exist and have status "ready" or "defined"
- If the spec has dependencies, all dependencies must have status "verified"
- If no ID is given, check which build spec is next in order and confirm with the user

## The 5-stage cycle

Execute these stages IN ORDER. Do not skip any stage. Do not proceed to the next stage until the current one is complete.

### Stage 1: DEFINE

Read the build spec. For each acceptance criterion listed in the spec:
- Write 1-2 test cases that would prove the criterion is met
- Create `rcf/tests/TS-NNN.json` with the test spec (ID, title, acceptance criteria IDs, test case descriptions)
- Create the actual test file at `src/tests/bs-NNN.test.mjs` with the test scaffolding

Update build spec status to "defining". Commit: `test(BS-NNN): define test specs for N acceptance criteria`

Show the user the test spec. Ask: "Tests defined. Proceeding to build."

### Stage 2: BUILD

Implement the code to satisfy the acceptance criteria. Follow the standards in `standards/`. Use the design context from `rcf/design.json`.

Write code to `src/server/` (backend) and/or `src/public/` (frontend) as appropriate.

Update build spec status to "building". Commit: `feat(BS-NNN): implement <description>`

### Stage 3: REVIEW

Review the code you just wrote against:
- Each acceptance criterion in the build spec -- is it satisfied?
- Standards compliance -- does the code follow `standards/`?
- Basic correctness -- any obvious bugs, security issues, or missing error handling?
- **UI quality (mandatory for any frontend work):**
  - Every list item is clickable and opens a detail/edit view
  - Full CRUD operations work (create, read, update, delete) for every entity
  - No decorative or non-functional UI elements -- every badge, button, and indicator works
  - The main page opens with project context (what is this, what does it do)
  - Seed data is present so the app looks alive on first run
  - Navigation is obvious and functional

If issues are found, fix them before proceeding. Commit fixes: `fix(BS-NNN): <what was fixed>`

### Stage 4: TEST

Run the tests: `node --test src/tests/bs-NNN.test.mjs`

- If all tests pass: proceed to Stage 5
- If tests fail: fix the code (not the tests, unless the test itself is wrong). Re-run. Maximum 3 fix attempts -- if still failing after 3 tries, note the failures and proceed (don't get stuck)

Commit test fixes if any: `fix(BS-NNN): resolve test failures`

### Stage 5: FINALISE

- Update build spec status to "verified" in `rcf/build-specs/BS-NNN.json`
- Update `rcf/tests/TS-NNN.json`:
  - Set top-level `status` to `"passed"`
  - Set EVERY `testCases[].status` to `"passing"` for tests that passed, `"failing"` for tests that failed. This is critical -- the dashboard coverage gauges read these statuses. If you leave them as `"pending"`, the coverage section shows 0%.
- Update `rcf/project.json`:
  - Set `stats.buildSpecsVerified` to the correct count
  - Set `stats.testsPassing` and `stats.testsTotal` to actual numbers
- Regenerate `rcf/trace.json` (the full traceability index)
- Final commit: `chore(BS-NNN): finalise -- all tests passing`

Report to the user:
- "BS-NNN complete. N/M acceptance criteria verified."
- "Traceability: REQ-XXX -> US-XXX -> AC-XXX-XX -> BS-NNN -> TS-NNN (passing)"
- "Next: run `/build BS-NNN+1`" or "All build specs complete! Run `/present`."

## Important

- ONE build spec at a time. Never execute two build specs concurrently.
- If the build spec seems too large, tell the user and suggest splitting it.
- Each stage gets its own commit. The git history IS the audit trail.
- If something goes wrong and you can't fix it in 3 attempts, tell the user and suggest moving to the next spec.
