# Project Structure

Canonical folder layout and naming conventions. Every RCF Lite project follows this structure.

## Directory layout

```
src/
  server/
    index.mjs              # Express app setup, startServer export, listen
    routes/                 # Route handlers -- one file per resource
      example.mjs           #   exports registerExampleRoutes(router)
    middleware/             # Express middleware
      error-handler.mjs     #   global error handler
      rate-limiter.mjs      #   rate limiting
    lib/                    # Shared server utilities (validation, helpers)
  public/
    index.html              # SPA entry point (single HTML shell)
    css/
      theme.css             # Design tokens (custom properties) + base styles
      components.css        # Component-scoped styles
    js/
      app.mjs               # SPA entry point -- bootstraps routing, initial render
      components/            # UI components -- one file per component
        example-card.mjs     #   exports createExampleCard(props)
      services/              # API client functions -- one file per resource
        example-api.mjs      #   exports fetchExamples(), createExample(), etc.
    assets/                  # Images, icons, fonts (if any)
  tests/
    *.test.mjs              # Test files (see testing.md)
rcf/                        # RCF document chain (PRD, stories, TAD as JSON)
standards/                  # Standards documents (these files)
schemas/                    # JSON schemas for RCF document validation
tools/                      # CLI tools and project utilities
package.json
package-lock.json
nodemon.json                # nodemon configuration for dev
.gitignore
.env.example                # Template for required environment variables (no secrets)
README.md
CLAUDE.md                   # AI assistant instructions (loads these standards)
```

## Naming conventions

### Files and folders

- **kebab-case** for all files and directories: `task-list.mjs`, `error-handler.mjs`, `user-stories/`.
- Server-side JavaScript files: `.mjs` extension.
- Frontend JavaScript modules: `.mjs` extension.
- Test files: `*.test.mjs`.
- No index files except `src/server/index.mjs` and `src/public/index.html`. Explicit names are easier to navigate.

### JavaScript identifiers

- **camelCase** for variables and functions: `fetchTasks`, `createTaskCard`, `isValid`.
- **PascalCase** for class names (if classes are used): `TaskStore`, `ValidationError`.
- **UPPER_SNAKE_CASE** for true constants (environment config, magic numbers): `MAX_REQUESTS`, `WINDOW_MS`.
- Descriptive names. No abbreviations: `response` not `res` (except in Express handlers where `req`/`res` is idiomatic), `element` not `el`, `button` not `btn`.

### CSS

- BEM-lite: `.block`, `.block--modifier`, `.block__element`.
- State classes prefixed with `is-` or `has-`: `.is-active`, `.has-error`.
- Custom properties prefixed with nothing (they are already scoped to `:root`): `--color-primary`, `--spacing-unit`.

## Key architectural rules

1. **`src/server/index.mjs` exports `startServer()`**. This function creates the Express app, mounts middleware and routes, and returns a Promise that resolves to the `http.Server` instance. This enables test files to start/stop the server programmatically. Auto-start only when the file is the direct entry point.

2. **Route files export a registration function**, not a pre-built router. The function receives a router and attaches handlers. This keeps route mounting explicit in `index.mjs`.

3. **Frontend components are pure functions** that accept a data object and return a DOM element. They do not fetch data or access global state.

4. **Services are the only code that calls `fetch`** on the frontend. Components receive data; services retrieve it.

5. **No circular imports.** Dependency flow is one-directional:
   - Server: `index.mjs` -> `routes/` -> `lib/`
   - Frontend: `app.mjs` -> `components/` + `services/`

6. **Static files served by Express** from `src/public/` using `express.static`. No separate static file server.

## Creating new resources

When adding a new resource (e.g., "projects"):

1. Create `src/server/routes/projects.mjs` with `registerProjectRoutes(router)`.
2. Import and mount in `src/server/index.mjs`.
3. Create `src/public/js/services/projects-api.mjs` with API client functions.
4. Create `src/public/js/components/project-card.mjs` (or whatever UI is needed).
5. Add styles to `src/public/css/components.css`.
6. Create `src/tests/projects.test.mjs` with tests covering the acceptance criteria.

Follow this checklist every time. Do not scatter resource logic across unrelated files.
