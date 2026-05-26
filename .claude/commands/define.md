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

6. **Start the dashboard.** Run `npm run dashboard &` in the background and open `http://localhost:3001` in the browser. Tell the user: "Dashboard is running at http://localhost:3001 -- keep it open to track progress as we build."

7. **Guide forward.** Tell the user: "Requirements are locked. Run `/design` to generate the technical design and build specs."

## Workshop mode -- individual component builds

If the user mentions they're building one component of a larger team product, help them scope appropriately:

- Their component should be fully self-contained -- no dependencies on other team members' work
- Use mock/generated data instead of requiring live APIs or databases
- Include a `data/` directory with JSON seed files for realistic demo data
- The component should have BOTH something visual (a page or UI) AND something technical (an API endpoint or data processing)
- It should be demonstrable in 2 minutes during a presentation
- Generate realistic mock data during the build -- names, dates, status values that look real

Help the user narrow their component to 2-3 requirements max. Suggest: "For a workshop component, aim for one core feature that works end-to-end, plus one supporting feature. That gives you a complete demo without overcommitting."

If the user seems stuck on what to build, suggest concrete options based on their role:
- **Product/UX:** Template designer, review workflow board, form builder
- **Backend dev:** Document generator (PDF/DOCX), search service, data import tool, export gateway
- **Data:** Analytics dashboard, data pipeline, report generator
- **Compliance/governance:** Policy checker, audit trail, compliance dashboard
- **Platform/infra:** Notification service, event bus, monitoring dashboard
- **QA/CI:** Test result dashboard, quality metrics, automated checker

## Scope guardian reminders

- 3-5 requirements maximum for a workshop/demo scope (2-3 for individual components)
- Each requirement should be implementable in under 30 minutes
- Depth over breadth -- one fully-traced feature beats five half-built ones
- "We can always add more in a future iteration" is a valid and professional response
- Mock data is your friend -- generate it, don't try to connect to real services
