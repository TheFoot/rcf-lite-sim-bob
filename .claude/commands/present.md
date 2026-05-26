# /present -- Generate presentation materials

Produce materials for presenting this project, including a summary, traceability report, and talking points.

## Steps

1. **Read all RCF docs.** Full project state.

2. **Generate a project summary** (write to `PRESENTATION.md`):

   ### Product Overview
   - What was built and why (from the PRD)
   - The problem it solves
   - Key features (from requirements)

   ### How AI Was Used
   - Requirements captured and structured via RCF
   - Technical design auto-generated from standards
   - Code generated through the 5-stage build cycle
   - Tests derived from acceptance criteria
   - Standards enforced automatically

   ### Traceability Chain
   For each requirement, show the full chain:
   ```
   REQ-001: <title>
    -> US-001: <title>
       -> AC-001-01: <criterion>
          -> BS-001: <build spec title> [verified]
             -> TS-001: 2/2 tests passing
   ```

   ### Technical Architecture
   - Components (from design.json)
   - Standards applied (list the standards docs)
   - Technology stack summary

   ### What RCF Provides
   - Structured requirements gathering
   - Automatic standards enforcement
   - Traceable code -- every line links to a business requirement
   - Built-in testing from acceptance criteria
   - Methodology scales from hackathon to production (via full RCF)

   ### Demo Talking Points
   - "Every line of code traces back to a business requirement"
   - "Standards are baked into the AI context, not enforced by humans"
   - "The 5-stage build cycle ensures nothing ships without review and tests"
   - "RCF is the prototyping subset -- full RCF adds architecture docs, build sequencing, and formal test suites"

3. **Tell the user** the file is ready and suggest they review it. Offer to adjust talking points or emphasis.
