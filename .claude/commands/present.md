# /present -- Generate a compact 5-minute presentation talk track

Produce a talk track and demo notes for a tight 5-minute presentation slot. This is NOT a technical report -- it is a script the presenter can follow while showing the app and dashboard live.

## Steps

1. **Read all RCF docs.** Full project state -- project.json, prd.json, design.json, build specs, test specs, trace.json.

2. **Generate `PRESENTATION.md`** with this exact structure:

### Opening (30 seconds)

One sentence: what was built and why. One sentence: what makes it impressive (built in N minutes, N requirements fully traced, N tests all passing). Keep it punchy.

### Live demo flow (3 minutes)

A numbered walkthrough the presenter follows while screen-sharing the app. Each step is one action + one sentence of what to say:

1. Show the landing page -- point out it is populated with realistic data, not empty
2. Walk through the core user journey (create something, view it, edit it, delete it)
3. Show one feature-specific highlight (the thing that makes this app interesting beyond CRUD)
4. Show the RCF dashboard (switch to the dashboard URL) -- point out the pipeline board, traceability chain, production readiness gauge
5. Click into one requirement card to show the full trace: requirement -> story -> AC -> build spec -> tests

Keep each step to ONE action. No multi-step detours.

### The methodology story (1 minute)

Three bullet points the presenter says out loud:
- "Every line of code traces back to a business requirement -- click any item on the dashboard and you see the full chain"
- "The AI followed the same standards everyone else used -- tech stack, coding patterns, security baseline -- all baked into the context, not enforced by humans"
- "This is RCF -- structured AI development. The prototype took N minutes. The methodology scales to production with deeper specs and formal test suites"

### Closing (30 seconds)

Key metrics in one line: N requirements, N acceptance criteria, N tests passing, N% production readiness, built in N minutes.

One sentence on what would come next (deeper requirements, production standards, CI/CD -- but the foundation is already traceable).

3. **Also generate a `DEMO-NOTES.md`** -- a minimal cheat sheet:

```
APP:       http://localhost:NNNN
DASHBOARD: http://localhost:NNNN
METRICS:   N reqs | N ACs | N tests | N% readiness | Nm build

DEMO PATH:
1. Landing page (populated, not empty)
2. Create/view/edit/delete [entity]
3. [Feature highlight]
4. Switch to dashboard
5. Click REQ-001 -> trace chain

KEY LINE: "Every line of code traces back to a business requirement"
```

4. **Tell the user** both files are ready. Suggest a dry run: "Walk through the demo flow once with the app open -- it should take under 3 minutes. The talk track fills the rest."

## Important

- **No per-requirement traceability dumps.** The dashboard shows this live -- the presenter clicks it, not reads it.
- **No technical architecture section.** The judges see the code quality in the demo, not in a document.
- **No bullet-point lists of "what RCF provides".** One clear methodology story, told as speech, not slides.
- The presentation is a PERFORMANCE, not a DOCUMENT. Write it as things to say and do, not things to read.
