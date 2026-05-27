# RCF - Structured AI Development

Build traceable, standards-compliant products with AI. Requirements, design, implementation, and testing - all linked, all tracked.

Full methodology documentation: [stravica.ai/rcf-methodology](https://stravica.ai/rcf-methodology/)

## Quick start

```bash
git clone <this-repo>
cd <repo>
npm install
```

Open the project in Claude Code. It auto-boots, reads your project state, and tells you what to do next.

## Prerequisites

- **Node.js** v20+ (https://nodejs.org)
- **Claude Code** - `npm install -g @anthropic-ai/claude-code`
- **Playwright MCP** (required for `/review` phase) - add to your Claude Code MCP config:
  ```json
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["@anthropic-ai/mcp-server-playwright"]
      }
    }
  }
  ```

## Commands

| Command | What it does |
|---------|-------------|
| `/define` | Capture your product idea. Generates requirements with acceptance criteria. |
| `/design` | Generate technical design and ordered build specs from your requirements. |
| `/build` | Build a spec through the 5-stage cycle (define tests, build code, review, test, finalise). Use `/build BS-001` for a specific spec, or ask to build all specs - they run sequentially via subagents. |
| `/review` | Post-build quality check. Fixes test runner issues, closes coverage gaps, verifies the UI works properly. Run this after all builds. |
| `/extend` | Add features or make changes after the initial build. Updates requirements and design first, then builds - keeps everything traceable. |
| `/verify` | Quick health check - test coverage, passing tests, any gaps. |
| `/status` | Where am I? What's done, what's next. |
| `/present` | Generate presentation materials - summary, traceability report, talking points. |

## The pipeline

```
/define --> /design --> /build (x N specs) --> /review --> /present
                                                  |
                                              /extend --> /design --> /build --> ...
```

Each build spec runs through 5 stages: **Define** tests from acceptance criteria, **Build** the code, **Review** against standards, **Test** (run and fix), **Finalise** (update traceability chain).

## Dashboard

The project dashboard starts automatically and runs alongside your Claude Code session at `http://localhost:3001`. It shows:

- **Requirement Status** - pipeline board tracking each requirement through the stages
- **Build Progress** - build spec status with 5-stage progress bars
- **Traceability** - flow diagram linking requirements to stories to criteria to specs to tests
- **Production Readiness** - honest gauges showing how far from production-ready the project is

Click any requirement or build spec card for detail.

## Project structure

```
rcf/                    # RCF document chain (JSON)
  project.json          # Project metadata and stats
  prd.json              # Requirements, stories, acceptance criteria
  design.json           # Technical design
  build-specs/          # One JSON file per build spec
  tests/                # Test specs linked to build specs
  trace.json            # Auto-generated traceability index

schemas/                # JSON schemas for all RCF document types
standards/              # Technical standards (auto-applied during builds)
src/                    # Your application code (generated during /build)
tools/                  # RCF CLI and dashboard (ships with the repo)
data/                   # Seed data and persistence (generated during /build)
```

## CLI

```bash
npm run rcf -- status       # Project phase and completion
npm run rcf -- validate     # Schema validation for all RCF docs
npm run rcf -- coverage     # Traceability coverage report
npm run rcf -- trace REQ-001  # Show chain for a specific item
npm run dashboard           # Start the project dashboard
```
