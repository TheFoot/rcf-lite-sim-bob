# /status -- Quick project health check

Report the current state of the project in a concise format.

## Steps

1. Read `rcf/project.json`, `rcf/prd.json`, all build specs, all test specs.

2. Display:

```
Project: <name>
Phase: <current phase>

Requirements:  N defined
User Stories:  M defined
Acceptance Criteria: P defined

Build Specs:
  Ready:    X
  Building: Y
  Verified: Z
  Total:    X+Y+Z

Tests:
  Defined:  A
  Passing:  B
  Failing:  C

Next action: <what should the user do now>
```

3. If any build spec has been stuck in "building" status, flag it.

4. Suggest the next command to run.

That's it. Short, factual, actionable.
