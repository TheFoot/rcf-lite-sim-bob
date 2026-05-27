# Tech Stack

The canonical technology choices for every RCF Lite project. Do not introduce alternatives unless the PRD explicitly requires them.

## Runtime

- **Node.js v20+** (LTS). All code targets the Node 20 API surface.
- **ESM only.** `package.json` must contain `"type": "module"`. Use `import`/`export` everywhere. Never use `require()` or `module.exports`.
- File extensions: `.mjs` for all server-side JavaScript. `.mjs` for frontend modules served via `<script type="module">`.

## Backend

- **Express.js 4.x** for the HTTP server and REST API.
- **Helmet.js** for security headers (see `security-baseline.md`).
- No ORM. If persistence is needed, use SQLite via `better-sqlite3` or flat JSON files -- choose the simplest option that meets the PRD.

## Frontend

- **Vanilla JavaScript.** No React, Vue, Angular, Svelte, or any UI framework.
- **No build step.** No Webpack, Vite, Rollup, or transpilation. Native ES modules are served directly by Express from `src/public/`.
- **No CSS preprocessors.** Use modern CSS with custom properties (variables) for theming.
- See `spa-patterns.md` for UI architecture details.

## Package management

- **npm** (ships with Node). Not yarn, not pnpm.
- `package-lock.json` is committed.
- Keep dependencies minimal. Every `npm install` must be justified by a concrete requirement. Prefer Node built-ins (`node:test`, `node:fs`, `node:crypto`, `node:path`) over third-party packages.

## Dev tooling

- **nodemon** for backend hot-reload during development. Config in `nodemon.json`:
  ```json
  {
    "watch": ["src/server"],
    "ext": "mjs,json",
    "exec": "node src/server/index.mjs"
  }
  ```
- **livereload + connect-livereload** for frontend hot-reload. The Express server injects the livereload snippet in dev mode. A livereload watcher monitors `src/public/` and triggers browser refresh on change.
- Dev startup via a single `npm run dev` script that launches both nodemon and livereload.

## Scripts in package.json

```json
{
  "scripts": {
    "start": "node src/server/index.mjs",
    "dev": "nodemon",
    "test": "node --test src/tests/"
  }
}
```

## Environment

- Configuration via environment variables. Use `process.env` directly -- no dotenv library unless the PRD requires `.env` file support.
- `PORT` defaults to `3000` if not set.
- `NODE_ENV` is either `development` or `production`. Default to `development`.

## Pre-approved utility packages

These are included in `package.json` and available for use when the PRD requires them:

- **pdfkit** -- PDF document creation. Use for generating reports, invoices, or any PDF output. Import: `import PDFDocument from 'pdfkit'`.
- **docx** -- DOCX document creation. Use for generating Word documents. Import: `import { Document, Paragraph, TextRun } from 'docx'`.
- **marked** -- Markdown to HTML conversion. Pure JS, zero transitive deps. Used by the `docs` utility. Import: `import { marked } from 'marked'`.

If additional packages are needed, install via `npm install <package>` and document the justification.

## Local-only -- no shared infrastructure

Everything runs on the developer's laptop. This is a hard constraint.

- **No external APIs.** No calls to cloud services, third-party APIs, or remote endpoints. If the feature needs data, generate mock data locally.
- **No databases.** Use flat JSON files in a `data/` directory for persistence. Read/write with `node:fs`.
- **No Docker or containers.** Plain Node.js process, started with `npm run dev`.
- **No authentication or OAuth.** No login flows, no API keys, no tokens.
- **No required environment variables.** `PORT` is optional (defaults to 3000). Everything else has sensible hardcoded defaults.
- **No network dependencies at runtime.** The app must work fully offline after `npm install`.

If a feature requires data that would normally come from an external service, create a `data/seed.json` with realistic mock data and load it on startup.

## What NOT to use

- No TypeScript (adds a build step).
- No frontend frameworks or libraries (jQuery, Lodash, etc.).
- No CSS frameworks (Tailwind, Bootstrap, etc.).
- No bundlers or transpilers.
- No `require()` or CommonJS patterns.
- No `var`. Use `const` by default, `let` when reassignment is needed.
