# /documentation -- Generate product documentation

Produce two documents from the current project state: a user-facing how-to guide and a demo-ready write-up.

## Prerequisites

At least one build spec should be verified. If nothing is built yet, tell the user to complete some builds first.

## Steps

1. **Read all RCF docs.** Load project.json, prd.json, design.json, all build specs, all test specs.

2. **Generate the how-to guide.** Write to `docs/HOW-TO.md`:

   ### <Product Name>

   **What it does:** (1-2 sentences from the PRD description)

   **Quick start:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000

   **Features:**
   For each verified requirement, write a short section:
   - What the feature does (from the requirement description)
   - How to use it (from the acceptance criteria -- translate into user instructions)
   - Any relevant API endpoints (from design.json)

   **API Reference:** (if the project has API endpoints)
   For each endpoint in design.json, list: method, path, purpose, example request/response.

   **Project Structure:**
   Brief description of the folder layout and where key files live.

   Keep it practical and concise. A new user should be able to use the product after reading this.

3. **Generate the demo write-up.** Write to `docs/DEMO.md`:

   ### <Product Name> -- Demo Summary

   **The Problem:** (from PRD -- what problem does this solve?)

   **The Solution:** (1 paragraph -- what was built and how it works)

   **Built With:**
   - RCF Lite methodology (structured requirements, traced builds, verified tests)
   - AI-assisted development (Claude Code with custom slash commands)
   - Standards-compliant (list which standards were applied)

   **Key Features:** (bullet list of verified requirements with one-line descriptions)

   **How AI Was Used:**
   - Requirements captured and structured via `/define`
   - Technical design auto-generated via `/design`
   - Code built through 5-stage cycle (Define → Build → Review → Test → Finalise)
   - Tests derived from acceptance criteria
   - Standards enforced automatically via context

   **Traceability Chain:**
   For each requirement, show the trace:
   ```
   REQ-001: <title>
    → US-001 → AC-001-01 → BS-001 [verified] → TS-001 [2/2 passing]
   ```

   **What This Demonstrates:**
   - AI can produce traceable, standards-compliant code
   - The methodology scales -- each team member followed the same process
   - Governance is built into the pipeline, not bolted on afterwards
   - From requirements to verified code in under 2 hours

   **Next Steps:** (what would it take to make this production-ready -- brief, honest)

4. **Create the docs/ directory** if it doesn't exist.

5. **Tell the user** both files are ready. Suggest reviewing and tweaking the demo write-up for their presentation style.
