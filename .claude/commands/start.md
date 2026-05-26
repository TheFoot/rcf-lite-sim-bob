# /start -- Re-detect project state and guide

Re-read all project context and report current position. Use this after a break, a fresh session, or when you need to re-orient.

## Steps

1. Read `rcf/project.json`. If it doesn't exist, this is a new project -- guide the user to `/define`.

2. If the project exists, read:
   - `rcf/prd.json` (requirements)
   - `rcf/design.json` (technical design)
   - All files in `rcf/build-specs/` (build spec statuses)
   - All files in `rcf/tests/` (test spec statuses)

3. Report to the user:
   - **Project name** and current phase
   - **Requirements:** N defined, with M acceptance criteria total
   - **Build specs:** X total, Y completed, Z remaining
   - **Tests:** A specs written, B passing
   - **Next action:** What should the user do now? Be specific -- name the command and the ID.

4. If all build specs are verified, suggest `/present` to prepare presentation materials.

Keep the report concise -- 5-10 lines max. The user wants orientation, not a lecture.
