# /review -- Post-build quality review

Comprehensive quality review after all build specs are verified. Catches the issues that pipeline completion alone misses: test runner quirks, coverage gaps, UI quality, and common problems that would embarrass the builder during a demo.

Run this AFTER all `/build` cycles are complete and BEFORE `/present`.

## Steps

### 1. Validate the RCF chain

Run `npm run rcf -- validate`. If there are validation errors, fix them now -- edit the JSON files directly to satisfy the schemas.

### 2. Check test runner

Run the test suite using the EXACT command from package.json: `npm test`

If tests fail:
- Read the failure output carefully
- If the failure is a test runner issue (MODULE_NOT_FOUND, incorrect path resolution, glob pattern mismatch), fix `package.json` scripts or the test file paths
- If the failure is an actual test failure, fix the code
- Re-run until all tests pass

Common fix: if `package.json` has `node --test src/tests/` (directory form), change it to `node --test 'src/tests/**/*.test.mjs'` (glob form). Node 24 requires the glob.

### 3. Check coverage and close gaps

Run `npm run rcf -- coverage`. For every gap reported:

- **AC without test spec entries:** These are usually visual/integration criteria (e.g., "dashboard shows summary", "navigation link exists"). Add them as test cases in the relevant `rcf/tests/TS-NNN.json` with `type: "visual"` and a `verifiedBy: "manual"` field. Then create a simple browser test in `src/tests/` that verifies the HTML element exists when the page loads.
- **Requirements without stories:** This should not happen post-build. If it does, something was skipped during `/define`. Add the missing stories.
- **ACs without build specs:** Map them to the relevant existing build spec.

Re-run coverage until it reports 100% or all remaining gaps are documented with a reason.

### 4. Start the app and verify UI quality

Start the app: `npm run dev` (if not already running).

Open `http://localhost:3000` in the browser (use Playwright if available, otherwise instruct the user to open it).

Check each item -- if ANY fails, fix it before proceeding:

- [ ] Landing page has project context (app name, description, summary stats or hero section)
- [ ] Navigation works (all links lead somewhere, active state is visible)
- [ ] Lists show seed data (not empty state)
- [ ] Every list item is clickable (opens a detail view)
- [ ] Create form works (add a new item, verify it appears in the list)
- [ ] Edit works (modify an item, verify changes persist)
- [ ] Delete works (remove an item with confirmation, verify it disappears)
- [ ] No broken elements (no 404 images, no console errors, no dead buttons)
- [ ] App looks polished (consistent theme, proper spacing, responsive layout)

### 5. Fix any issues found

For each issue:
1. Fix the code
2. Re-run the relevant tests
3. Commit: `fix: review -- <what was fixed>`

### 6. Final report

After all fixes are applied, report to the user:

```
Review complete.
- Schema validation: PASS (N documents)
- Test suite: N/N passing
- Coverage: X% (detail any remaining gaps with reasons)
- UI quality: PASS / N issues fixed
- Ready for: /present
```

If the review found and fixed issues, briefly list what was wrong and what was done. This is valuable feedback for the user's learning.

## Important

- This is a FIX pass, not just a report. If you find a problem, fix it.
- Do not skip the UI verification. Pipeline green + broken UI = failed demo.
- If an issue requires architectural changes (not just fixes), flag it to the user rather than restructuring silently.
- Commit fixes incrementally, not in one big commit.
