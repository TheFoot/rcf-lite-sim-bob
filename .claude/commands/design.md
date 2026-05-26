# /design -- Generate technical design and build specs

Read the PRD, apply the standards, and produce a technical design with ordered build specs.

## Prerequisites

`rcf/prd.json` must exist with at least one requirement. If not, tell the user to run `/define` first.

## Steps

1. **Read context.** Load:
   - `rcf/prd.json` (the requirements)
   - All files in `standards/` (technical standards)
   - `rcf/project.json` (project metadata)

2. **Generate design.** Create `rcf/design.json` with:
   - Architecture overview (1-2 paragraphs: what components exist, how they connect)
   - Components list -- each component traced to the requirements it serves
   - API endpoints (if applicable) -- method, path, purpose, linked requirement
   - Data model (if applicable) -- entities, fields, relationships
   - All technology decisions come from `standards/` -- do not invent or debate.

3. **Generate build specs.** Create one `rcf/build-specs/BS-NNN.json` per user story (or per logical unit of work). Each build spec contains:
   - ID (BS-001, BS-002, etc.)
   - Title and description
   - The requirement and user story it implements (by ID)
   - The acceptance criteria it must satisfy (by ID)
   - Relevant design context (which components, endpoints, data models)
   - Which standards apply
   - Status: "ready"
   - Dependency: which build specs must complete first (if any)

   Order build specs by dependency -- foundational work first (data model, core API), features second (UI, integrations).

4. **Present for review.** Show:
   - Architecture summary (brief)
   - Build spec list with order, titles, and dependencies
   - Estimated build order: "BS-001 first (foundation), then BS-002 and BS-003 (features)"
   - Ask: "Does this design look right? I can adjust before we start building."

5. **Save and guide forward.** Write design.json and all build spec files. Update `rcf/project.json` phase to "designed". Commit: `feat: technical design with N build specs`.

   Tell the user: "Design is locked. Run `/build BS-001` to start the first build spec through the 5-stage cycle."
