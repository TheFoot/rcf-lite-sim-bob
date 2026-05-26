# Testing

Testing conventions using Node.js built-in test runner. Zero external test dependencies.

## Test runner

Use `node:test` (available in Node 20+). No Mocha, Jest, Vitest, or any external test framework.

Run all tests:
```bash
node --test src/tests/
```

This command is the `npm test` script in `package.json`.

## File conventions

- Test files live in `src/tests/`.
- Named `*.test.mjs` (ESM, matching the rest of the codebase).
- One test file per source module or feature area. Name mirrors the source: `tasks.test.mjs` tests the tasks resource.

## Structure

Use `describe`/`it` from `node:test`. Use `assert` from `node:assert/strict`.

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

describe('Tasks API', () => {
  it('should return an empty array when no tasks exist', async () => {
    const res = await fetch('http://localhost:3000/api/v1/tasks');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, []);
  });
});
```

## What to test

**Test behaviour, not implementation.** Each test answers: "does this feature work as the user/consumer expects?" Do not test internal function calls, private state, or mock everything.

Coverage target: **1-2 tests per acceptance criterion** from the RCF user stories. This is the minimum bar. Each acceptance criterion should have at least:
1. A happy-path test proving the criterion is met.
2. One edge-case or error-path test (invalid input, missing resource, boundary condition).

If an acceptance criterion is trivial (e.g., "page displays a title"), one test is sufficient.

## API integration tests

For REST API testing, run the actual Express server. Use the built-in `fetch` (Node 20+) to make HTTP requests.

### Server lifecycle

Start the server before tests, stop it after:

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.mjs';

let server;
const BASE_URL = 'http://localhost:0'; // resolved after listen

before(async () => {
  server = await startServer({ port: 0 }); // port 0 = random available port
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});
```

Export `startServer` from `src/server/index.mjs` to support this pattern. It should return the `http.Server` instance and accept a `{ port }` option. When `port` is `0`, the OS assigns an available port. Retrieve it via `server.address().port`.

```javascript
// In src/server/index.mjs
export function startServer({ port = process.env.PORT || 3000 } = {}) {
  // ... app setup ...
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${server.address().port}`);
      resolve(server);
    });
  });
}

// Auto-start only when run directly
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  startServer();
}
```

### Test isolation

Each test should be independent. If tests modify state (POST, PUT, DELETE), either:
- Reset state between tests (clear in-memory store, truncate DB).
- Use unique identifiers so tests do not collide.

## Unit tests

For pure functions (validation, data transformation), test directly without a server:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../server/lib/validate.mjs';

describe('validate()', () => {
  it('should return an error when a required field is missing', () => {
    const errors = validate({}, { title: { required: true } });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /title/);
  });
});
```

## What NOT to do

- No snapshot testing.
- No mocking libraries. If you need a test double, write a plain function or object.
- No test coverage thresholds enforced by tooling. Write meaningful tests, not percentage-driven ones.
- No `--experimental` flags unless strictly required by a Node.js feature. `node:test` is stable.
