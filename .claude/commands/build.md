# /build -- Execute build specs through the 5-stage cycle

Takes a build spec ID (e.g., `/build BS-001`) or builds all remaining specs when asked ("build all", "run all specs", "complete all build specs").

## Single spec

Standard mode. Dispatches ONE spec to a subagent for the 5-stage cycle.

## All specs

When the user asks to build all specs:

1. Read all build specs, sort by `order`, filter to non-verified
2. Execute SEQUENTIALLY via subagent dispatch -- one spec at a time, in dependency order
3. After each spec completes, report progress ("BS-001 complete. Starting BS-002...")
4. After all specs, regenerate trace.json and run validation

**Always dispatch to a subagent when the Agent tool is available.** The main thread stays free for the user.

## Prerequisites

- `rcf/build-specs/BS-NNN.json` must exist and have status "ready" or "defined"
- If the spec has dependencies, all dependencies must have status "verified"
- If no ID is given and only one spec remains, start it. If multiple remain, confirm with the user or build all in order.

## Status updates (CRITICAL -- non-negotiable)

Update `rcf/build-specs/BS-NNN.json` status at EVERY stage transition: `ready` -> `defining` -> `building` -> `reviewing` -> `testing` -> `verified`. Each write triggers the dashboard to update via SSE.

**The status write is the FIRST action in each stage, before any other work.** Do NOT batch updates to the end. Do NOT write `startedAt` retroactively from memory -- write it at the moment Stage 1 begins. The dashboard's live pipeline progress depends on seeing intermediate statuses. If the file is only modified once (at finalise), the pipeline board never shows progress -- it jumps from "ready" to "verified" with no intermediate states visible.

Per-stage write checklist:
- **Stage 1 start:** write `status: "defining"` + `startedAt: <now>` to BS-NNN.json
- **Stage 2 start:** write `status: "building"` to BS-NNN.json
- **Stage 3 start:** write `status: "reviewing"` to BS-NNN.json
- **Stage 4 start:** write `status: "testing"` to BS-NNN.json
- **Stage 5:** write `status: "verified"` + `completedAt: <now>` to BS-NNN.json

## The 5-stage cycle

Execute these stages IN ORDER. Do not skip any stage. Do not proceed to the next stage until the current one is complete.

### Before Stage 1: Create feature branch

```bash
git checkout main
git pull origin main
git checkout -b feat/BS-NNN-<short-description>
```

This branch is where ALL work for this build spec happens. Every commit in the cycle below goes to this branch and is pushed immediately.

### Stage 1: DEFINE

**First:** update `rcf/build-specs/BS-NNN.json` -- set `status` to `"defining"` and `startedAt` to the current ISO timestamp (e.g. `"2026-05-27T10:15:00Z"`). This write must happen BEFORE any other work in this stage.

Read the build spec. For each acceptance criterion listed in the spec:
- Write 1-2 test cases that would prove the criterion is met
- Create `rcf/tests/TS-NNN.json` with the test spec (ID, title, acceptance criteria IDs, test case descriptions)
- Create the actual test file at `src/tests/bs-NNN.test.mjs` with the test scaffolding

Commit and push:
```bash
git add -A && git commit -m "test(BS-NNN): define test specs for N acceptance criteria

Traces: REQ-NNN, US-NNN, AC-NNN-01 through AC-NNN-NN"
git push origin feat/BS-NNN-<short-description>
```

Show the user the test spec. Ask: "Tests defined. Proceeding to build."

### Stage 2: BUILD

**First:** update `rcf/build-specs/BS-NNN.json` -- set `status` to `"building"`. This write must happen BEFORE writing any implementation code.

Implement the code to satisfy the acceptance criteria. Follow the standards in `standards/`. Use the design context from `rcf/design.json`.

Write code to `src/server/` (backend) and/or `src/public/` (frontend) as appropriate.

Commit and push:
```bash
git add -A && git commit -m "feat(BS-NNN): implement <description>

Traces: REQ-NNN -- <requirement title>"
git push origin feat/BS-NNN-<short-description>
```

### Stage 3: REVIEW

**First:** update `rcf/build-specs/BS-NNN.json` -- set `status` to `"reviewing"`. This write must happen BEFORE starting the review.

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
- **Layout polish (mandatory for any frontend work):**
  - Headings have adequate margin above and below -- they should not be crammed against adjacent content. Check both `margin-top` and `margin-bottom` on all `h1`-`h6` elements.
  - In row/column layouts (headers, grid rows, tables), column widths are proportional to content. A column containing a paragraph of text must get more width than a column with a small badge or action button. Equal-width columns where content sizes vary dramatically looks wrong -- use CSS grid `fr` units or flex with appropriate proportions.
  - Text blocks have breathing room -- adequate `line-height`, `padding`, and `margin` to create readable visual groupings. No text crammed edge-to-edge inside containers.
  - Containers that may receive many items (lists, boards, card grids) have a sensible `max-height` with `overflow-y: auto` so the layout does not stretch infinitely.

If issues are found, fix them before proceeding. Commit and push fixes:
```bash
git add -A && git commit -m "fix(BS-NNN): <what was fixed>"
git push origin feat/BS-NNN-<short-description>
```

### Stage 4: TEST

**First:** update `rcf/build-specs/BS-NNN.json` -- set `status` to `"testing"`. This write must happen BEFORE running any tests.

Run the tests: `node --test src/tests/bs-NNN.test.mjs`

- If all tests pass: proceed to Stage 5
- If tests fail: fix the code (not the tests, unless the test itself is wrong). Re-run. Maximum 3 fix attempts -- if still failing after 3 tries, note the failures and proceed (don't get stuck)

Commit and push test fixes if any:
```bash
git add -A && git commit -m "fix(BS-NNN): resolve test failures"
git push origin feat/BS-NNN-<short-description>
```

### Stage 5: FINALISE

- Update build spec status to "verified" in `rcf/build-specs/BS-NNN.json`. Set `completedAt` to the current ISO timestamp.
- Update `rcf/tests/TS-NNN.json`:
  - Set top-level `status` to `"passed"`
  - Set EVERY `testCases[].status` to `"passing"` for tests that passed, `"failing"` for tests that failed. This is critical -- the dashboard coverage gauges read these statuses. If you leave them as `"pending"`, the coverage section shows 0%.
- Update `rcf/project.json`:
  - Set `stats.buildSpecsVerified` to the correct count
  - Set `stats.testsPassing` and `stats.testsTotal` to actual numbers
- Regenerate `rcf/trace.json` (the full traceability index)
- Final commit and push:
```bash
git add -A && git commit -m "chore(BS-NNN): finalise -- N tests passing, traceability updated"
git push origin feat/BS-NNN-<short-description>
```

### After Stage 5: Open PR and merge

Open a pull request from the feature branch to `main`:

```bash
gh pr create --base main --title "BS-NNN: <build spec title>" --body "$(cat <<'EOF'
## BS-NNN: <title>

### Traces to
- REQ-NNN: <requirement title>
- US-NNN: <story title>
- Acceptance criteria: <list AC IDs>

### What was built
<2-3 bullet points>

### Test results
- N/N tests passing
- All acceptance criteria verified

Built with RCF methodology
EOF
)"
```

Then merge and return to main:
```bash
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

Report to the user:
- "BS-NNN complete. N/M acceptance criteria verified. PR merged."
- "Traceability: REQ-XXX -> US-XXX -> AC-XXX-XX -> BS-NNN -> TS-NNN (passing)"
- "Next: run `/build BS-NNN+1`" or "All build specs complete! Run `/present`."

## Important

- ONE build spec at a time. Never execute two build specs concurrently.
- If the build spec seems too large, tell the user and suggest splitting it.
- Each stage gets its own commit. The git history IS the audit trail.
- If something goes wrong and you can't fix it in 3 attempts, tell the user and suggest moving to the next spec.
