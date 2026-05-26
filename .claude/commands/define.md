# /define -- Capture requirements

Guide the user through defining their product idea and generating a structured PRD with requirements and acceptance criteria.

## Steps

1. **Ask what they want to build.** One question: "What product or feature do you want to build? Describe the problem it solves and who it's for." Wait for their answer.

2. **Generate the PRD.** From their description, create `rcf/prd.json` with:
   - Project name and description
   - 3-5 requirements (REQ-001 through REQ-NNN). Apply the scope guardian -- if the idea implies more than 5, prioritise and explain why.
   - Each requirement has:
     - A clear title and description
     - 1-3 user stories (US-NNN)
     - Each story has 1-3 acceptance criteria (AC-NNN-NN)
   - Use the schema at `schemas/prd.schema.json` if it exists, or follow the structure in CLAUDE.md.

3. **Present for review.** Show the user:
   - The requirements list with titles
   - Total counts: N requirements, M stories, P acceptance criteria
   - Ask: "Does this capture what you want to build? I can add, remove, or refine any requirement."

4. **Refine.** Iterate until the user is happy. Keep the scope guardian active -- gently push back on scope creep.

5. **Save.** Write the final PRD to `rcf/prd.json`. Create `rcf/project.json` if it doesn't exist (set phase to "defined"). Commit with message: `feat: define PRD with N requirements`.

6. **Guide forward.** Tell the user: "Requirements are locked. Run `/design` to generate the technical design and build specs."

## Scope guardian reminders

- 3-5 requirements maximum for a workshop/demo scope
- Each requirement should be implementable in under 30 minutes
- Depth over breadth -- one fully-traced feature beats five half-built ones
- "We can always add more in a future iteration" is a valid and professional response
