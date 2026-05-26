# REST API Patterns

Conventions for Express.js REST APIs. Every endpoint follows these rules.

## URL structure

All API routes live under `/api/v1/`. Resource names are plural, kebab-case.

```
GET    /api/v1/tasks          # List all
GET    /api/v1/tasks/:id      # Get one
POST   /api/v1/tasks          # Create
PUT    /api/v1/tasks/:id      # Full update
PATCH  /api/v1/tasks/:id      # Partial update
DELETE /api/v1/tasks/:id      # Delete
```

## Request/response format

- All request bodies are JSON. Set `express.json()` middleware globally.
- All responses are JSON. Set `Content-Type: application/json` (Express does this automatically for `res.json()`).
- Successful responses return the resource directly (not wrapped):
  ```json
  { "id": "abc-123", "title": "Example task", "status": "open" }
  ```
- List endpoints return an array at the top level:
  ```json
  [{ "id": "abc-123", "title": "Example task" }]
  ```

## Error response shape

Every error response uses this exact structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must be a non-empty string."
  }
}
```

Standard error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`, `RATE_LIMITED`, `UNAUTHORIZED`.

## HTTP status codes

Use them correctly:
- `200` -- Success (GET, PUT, PATCH, DELETE).
- `201` -- Created (POST that creates a resource). Include the created resource in the body.
- `204` -- No content (DELETE when nothing to return).
- `400` -- Bad request (validation failure, malformed input).
- `404` -- Not found.
- `409` -- Conflict (duplicate resource, version mismatch).
- `429` -- Rate limited.
- `500` -- Internal server error (unexpected failures).

## Route file structure

One file per resource in `src/server/routes/`. Each file exports a function that receives the Express router and registers routes.

```javascript
// src/server/routes/tasks.mjs
export function registerTaskRoutes(router) {
  router.get('/tasks', listTasks);
  router.get('/tasks/:id', getTask);
  router.post('/tasks', createTask);
  router.put('/tasks/:id', updateTask);
  router.delete('/tasks/:id', deleteTask);
}

async function listTasks(req, res) { /* ... */ }
```

Mount in the main server file:

```javascript
// src/server/index.mjs
import { Router } from 'express';
import { registerTaskRoutes } from './routes/tasks.mjs';

const apiRouter = Router();
registerTaskRoutes(apiRouter);
app.use('/api/v1', apiRouter);
```

## Input validation

Use a simple validation helper -- no library required. Validate at the top of each handler.

```javascript
function validate(body, rules) {
  const errors = [];
  for (const [field, check] of Object.entries(rules)) {
    const value = body[field];
    if (check.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required.`);
    }
    if (check.type && value !== undefined && typeof value !== check.type) {
      errors.push(`${field} must be a ${check.type}.`);
    }
    if (check.maxLength && typeof value === 'string' && value.length > check.maxLength) {
      errors.push(`${field} must be at most ${check.maxLength} characters.`);
    }
  }
  return errors;
}
```

When validation fails, return 400 with the first meaningful error message:
```javascript
const errors = validate(req.body, { title: { required: true, type: 'string', maxLength: 200 } });
if (errors.length) {
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors[0] } });
}
```

## Middleware

Middleware files live in `src/server/middleware/`. Each exports a function.

Standard middleware applied to all routes (in order):
1. `express.json()` -- Parse JSON bodies.
2. `helmet()` -- Security headers.
3. CORS middleware -- See `security-baseline.md`.
4. Request logging (if needed) -- Simple `console.log` with method, URL, status, duration.
5. Error handler -- Registered last, catches unhandled errors and returns 500.

```javascript
// src/server/middleware/error-handler.mjs
export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
}
```
