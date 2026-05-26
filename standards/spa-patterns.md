# SPA Patterns

Architecture and conventions for the vanilla JS single-page application frontend.

## HTML

- Single entry point: `src/public/index.html`.
- Semantic HTML5 elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`. No `<div>` soup.
- The SPA shell is static HTML. Dynamic content is injected into a `<main id="app">` container by JavaScript.
- Load the app entry point as a module: `<script type="module" src="/js/app.mjs"></script>`.

## Component model

Each UI component is a single ES module file in `src/public/js/components/`. A component exports a function that returns a DOM element (not an HTML string).

```javascript
// src/public/js/components/task-card.mjs
export function createTaskCard({ title, status }) {
  const card = document.createElement('article');
  card.className = 'task-card';

  const heading = document.createElement('h3');
  heading.textContent = title;

  const badge = document.createElement('span');
  badge.className = `badge badge--${status}`;
  badge.textContent = status;

  card.append(heading, badge);
  return card;
}
```

Rules:
- One component per file. File name matches the component name in kebab-case.
- Components receive data as a plain object parameter. No global state access inside components.
- Use `textContent` for user-provided data. Never `innerHTML` with dynamic content (see `security-baseline.md`).
- Components do not fetch data. They receive it from the calling code.

## Routing (if needed)

Client-side routing via the History API. A minimal router in `src/public/js/router.mjs`:
- Define routes as a `Map` of path pattern to handler function.
- Listen to `popstate` and intercept `<a>` clicks with `data-link` attributes.
- Each route handler clears `#app` and renders its view.
- Express must serve `index.html` for all non-API, non-static routes (SPA fallback).

## API communication

API client functions live in `src/public/js/services/`. Each service file covers one resource.

```javascript
// src/public/js/services/tasks-api.mjs
const BASE = '/api/v1';

export async function fetchTasks() {
  const res = await fetch(`${BASE}/tasks`);
  if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
  return res.json();
}
```

## CSS architecture

Two stylesheets, loaded in order:

1. **`theme.css`** -- Design tokens and base styles.
2. **`components.css`** -- Component-scoped styles.

### Default colour theme

```css
:root {
  --color-primary: #1a2332;
  --color-primary-light: #243044;
  --color-accent: #00b4d8;
  --color-accent-hover: #0096b7;
  --color-text: #ffffff;
  --color-text-muted: #94a3b8;
  --color-surface: #1e293b;
  --color-border: #334155;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-size-base: 1rem;
  --font-size-sm: 0.875rem;
  --font-size-lg: 1.25rem;
  --spacing-unit: 0.5rem;
  --radius: 6px;
}
```

### Layout

- Mobile-first responsive design. Base styles target small screens; use `min-width` media queries to enhance for larger screens.
- CSS Grid for page-level layouts. Flexbox for component-internal alignment.
- Breakpoints: `640px` (sm), `768px` (md), `1024px` (lg), `1280px` (xl). Use these values directly in media queries -- no preprocessor variables.

### Naming

- BEM-lite: `.block`, `.block--modifier`, `.block__element`. Keep nesting to two levels maximum.
- Prefix state classes with `is-` or `has-`: `.is-active`, `.has-error`.

## Interactivity and CRUD

Every entity in the app must support full CRUD through the UI. This is the minimum bar for a demo-quality build.

### View structure per entity

Each entity type needs three views:

1. **List view** -- Displays all items. Each item is clickable (navigates to detail view). Include a "Create new" button.
2. **Detail view** -- Shows all fields for one item. Includes "Edit" and "Delete" actions. Delete shows a confirmation before removing.
3. **Form view** -- Used for both create and edit. Pre-populated for edit mode. Validates required fields. On submit, persists via the API and navigates back to the list or detail.

### Interaction rules

- Every list item is a clickable row or card. Use `<a data-link>` or a click handler that navigates to the detail route.
- No read-only lists. If you can see items, you can interact with them.
- After create/update/delete, the list refreshes automatically. No manual page reload.
- Empty states: when a list has no items, show a clear message and a prominent "Create your first X" call-to-action.

### Landing page

The app's landing page (usually `/` or `/dashboard`) must open with:

1. **Project context** -- the app name, a one-line description, and the current state (e.g., "3 tasks in progress, 2 completed").
2. **Quick navigation** -- clear paths to each major feature/entity.
3. **Live summary data** -- counts, statuses, or a simple chart. Not an empty shell.

Generate realistic seed data so the landing page is populated on first run.

## Static assets

All frontend files served from `src/public/`:
- `src/public/index.html` -- SPA shell.
- `src/public/css/` -- Stylesheets.
- `src/public/js/` -- JavaScript modules.
- `src/public/js/components/` -- UI component modules.
- `src/public/js/services/` -- API client modules.
- `src/public/assets/` -- Images, icons, fonts (if any).
