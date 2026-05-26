# /verify -- Check test coverage and run pending tests

Quick verification pass across the whole project.

## Steps

1. **Read all RCF docs.** Load project.json, prd.json, all build specs, all test specs.

2. **Coverage check.** Report:
   - Requirements with no user stories
   - User stories with no acceptance criteria
   - Acceptance criteria with no test specs
   - Build specs with no tests defined
   - Any gaps in the traceability chain

3. **Run all tests.** Execute: `node --test src/tests/`

4. **Report.**
   - Total: N requirements, M acceptance criteria, P test specs, Q test cases
   - Passing: X/Q tests passing
   - Coverage: Y% of acceptance criteria have passing tests
   - Gaps: list any uncovered requirements or failing tests

5. **Suggest next actions.** If there are gaps, tell the user which build spec to revisit. If everything is green, suggest `/present`.

Keep the report factual and concise. This is a health check, not a deep analysis.
