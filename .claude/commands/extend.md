# /extend -- Add features or make changes (through the RCF chain)

Use this when the user wants to add something new, change existing behaviour, or expand the product after the initial build. Every change goes through the document chain first -- docs before code. This is the RCF iteration cycle.

**This is NOT ad-hoc coding.** If the user asks "can you add X" or "change Y to do Z", route them here. The methodology applies to changes just as much as the initial build.

## Steps

### 1. Understand the change

Ask the user: "What do you want to add or change?" Get a clear description. Then classify:

- **New feature** -- needs a new requirement in the PRD, new build spec(s), new code
- **Enhancement** -- modifies an existing requirement's scope, may need new ACs and updated build specs
- **Bug fix** -- existing AC is not being met. No doc changes needed, just code + test fix
- **UI/UX change** -- visual or interaction change. May or may not need doc updates depending on scope

For bug fixes, skip to step 5 (just fix and test). For everything else, continue.

### 2. Update the PRD

Read `rcf/prd.json`. Then:

- **New feature:** Add a new requirement (REQ-NNN+1) with user stories and acceptance criteria. Follow the same patterns as existing requirements. Apply the scope guardian -- the new feature should be buildable in under 30 minutes.
- **Enhancement:** Update the relevant requirement's description, add new ACs to the relevant story, or add a new story. Preserve existing IDs -- append, don't renumber.

Show the user the changes. Ask: "Here's how the updated requirements look. Good to proceed?"

Commit: `docs: extend PRD -- add <description>`

### 3. Update the design

Read `rcf/design.json`. Update:

- Add new components or endpoints if the change requires them
- Update existing component descriptions if behaviour is changing
- Ensure the design traces to the new/modified requirements

Commit: `docs: extend design -- <description>`

### 4. Generate new build specs

For each new or significantly modified requirement:

- Create a new build spec in `rcf/build-specs/BS-NNN+1.json`
- The spec must contain: requirement ID, acceptance criteria, design context, and implementation plan
- Set dependencies on existing build specs where needed (the new feature may depend on existing APIs or components)

Show the user the build plan: "N new build specs to implement. Here's the order: ..."

Commit: `docs: add build specs for <description>`

### 5. Build

For each new build spec, execute the standard 5-stage cycle via `/build BS-NNN`.

For bug fixes or minor enhancements that modify existing code without new build specs:
1. Identify the relevant build spec and test spec
2. Update the test spec with new/modified test cases for the changed behaviour
3. Make the code change
4. Run the updated tests
5. Update the build spec status log and trace.json
6. Commit: `fix(BS-NNN): <description>`

### 6. Update traceability

After all changes are built:
- Regenerate `rcf/trace.json`
- Run `npm run rcf -- validate`
- Run `npm run rcf -- coverage`
- Fix any gaps

Commit: `docs: update traceability for <description>`

### 7. Confirm

Report to the user:
- What was changed (requirements, design, code)
- New test results
- Updated coverage
- Suggest `/review` if this was a significant change, or continue extending

## Key principles

- **Docs first, code second.** The PRD and design are always updated before implementation starts. This is non-negotiable -- it's what makes changes traceable.
- **Scope guardian stays active.** New features during iteration are just as subject to the 3-5 requirement limit as the initial build. If the user keeps adding, suggest: "We're at N requirements now. Consider running `/present` with what we have and noting the extras as future iterations."
- **IDs are append-only.** Never renumber existing IDs. New requirements get the next sequential ID. This preserves traceability for everything already built.
- **Existing tests must still pass.** After any change, run the full test suite, not just the new tests. Regressions are caught here.
- **The dashboard updates automatically.** If the dashboard is running, the user will see new build specs appear in the pipeline board and progress through the stages in real time.
