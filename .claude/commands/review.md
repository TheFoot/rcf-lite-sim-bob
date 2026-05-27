# /review -- Post-build verification and quality review

The build is NOT finished until this phase passes. This is not a bug-finding exercise -- it is the verification gate. The app must be manually tested end-to-end before the user sees it.

Runs automatically after all `/build` specs complete, or manually via `/review`.

## Prerequisites

- All build specs must be `verified`
- The app must be running (`npm run dev`). If it's not running, start it. **Do NOT kill the dev server at any point during or after review.**
- Playwright MCP must be available for UI verification

## Steps

### 1. Validate the RCF chain

Run `npm run rcf -- validate`. Fix any schema errors immediately.

### 2. Run the test suite

Run `npm test`. Fix all failures. Common fix: if `package.json` has `node --test src/tests/` (directory form), change to `node --test 'src/tests/**/*.test.mjs'` (glob form).

### 3. Check coverage and close gaps

Run `npm run rcf -- coverage`. For every gap:
- AC without test entries: add test cases with `verifiesAc` linking to the AC
- Create the actual test, run it, confirm it passes
- Re-run coverage until all ACs are covered

### 4. API verification

For every API endpoint defined in the design:
- Call each endpoint programmatically (use `fetch` via Bash or a test script)
- Verify response shape matches the design spec
- Test error cases (invalid input, missing required fields, not-found IDs)
- Confirm seed data is served correctly (not empty responses)

### 5. UI verification with Playwright

This is the critical gate. Use Playwright MCP to navigate the app as a real user would.

**5a. Visual integrity checks**

Navigate to each page/view and verify:
- No content overspilling containers (use `browser_evaluate` to check `element.scrollWidth > element.clientWidth` on key containers)
- Grouped elements (cards, list items, grid cells) are consistent in size and alignment (compare computed dimensions via JS, not just screenshots)
- No broken images, missing icons, or empty containers that should have content
- Text is readable (not clipped, not overflowing, contrast is adequate)
- Responsive layout is not broken at the default viewport

**5b. Rendering integrity**

Check for common rendering failures:
- Raw markdown showing as text instead of rendered HTML (look for literal `##`, `**`, `- `, `[link](url)` in the page text via `browser_evaluate` -- these should have been converted to HTML elements)
- HTML entities showing as raw text (`&amp;`, `&lt;`, `&#8212;` visible to the user)
- JSON or code fragments visible in the UI that should be parsed and displayed as structured content
- Empty sections or containers where content should have rendered (element exists but `textContent` is empty or just whitespace)

**5c. Fake data detection**

Check that ALL visible data comes from the data store, not hardcoded HTML:
- Use `browser_evaluate` to read text content from key UI elements
- Cross-reference with API responses -- if a dashboard shows "8 documents" but the API returns 6, that's a hardcoded value
- Labels like "John Doe", "Lorem ipsum", "Sample Project" that don't match seed data are failures
- Status badges, counts, and metrics must reflect real data state

**5d. User journey walkthroughs**

Click through each core user journey end-to-end:

1. **Browse journey:** Landing page -> list view -> click item -> detail view -> back to list
2. **Create journey:** Navigate to create form -> fill ALL fields -> submit -> verify new item appears in list -> click it to confirm detail is correct
3. **Edit journey:** Open existing item -> click edit -> modify a field -> save -> verify change persists (navigate away and back)
4. **Delete journey:** Open an item -> delete with confirmation -> verify it's gone from the list
5. **Any feature-specific journeys:** If the app has workflow states, filters, assembly features, etc. -- test those paths too

For each journey:
- Verify navigation works (correct page loads, no 404s, no blank screens)
- Verify data persists across navigation (create something, navigate away, come back -- it's still there)
- Check for console errors after each navigation (use `browser_console_messages`)

**5e. Fix everything found**

This is a FIX pass, not a report. For each issue:
1. Fix the code
2. Re-verify with Playwright that the fix works
3. Commit: `fix: review -- <what was fixed>`

Do not report issues to the user and wait. Fix them. Only escalate if a fix would require architectural changes.

### 6. Final verification

After all fixes:
- Re-run `npm test` (confirm no regressions)
- Re-run `npm run rcf -- validate`
- One final Playwright pass through the main user journey to confirm nothing broke during fixes
- Confirm the dev server is still running

### 7. Report

```
Review complete.
- Schema validation: PASS (N documents)
- Test suite: N/N passing
- Coverage: N/N ACs covered
- API verification: N endpoints tested, N passing
- UI verification: N pages checked, N journeys walked, N issues found and fixed
- Dev server: running at http://localhost:3000
- Ready for: /present or /extend
```

## Important

- **The dev server must stay running.** Do not kill it. Ever. The user expects to see the app after review.
- **Playwright MCP is mandatory for this phase.** If it's not available, tell the user to install it and re-run.
- **Use JS for computed checks, not just visual inspection.** `browser_evaluate` with `getComputedStyle`, `getBoundingClientRect`, `scrollWidth`/`clientWidth` comparisons. Screenshots alone miss subtle layout issues.
- **Every fix gets re-verified.** Don't assume a code change worked -- confirm with Playwright.
- **Console errors are failures.** Check `browser_console_messages` on every page. JS errors in the console mean the app is broken even if it looks OK.
