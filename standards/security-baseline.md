# Security Baseline

Minimum security requirements for every RCF Lite project. These are non-negotiable defaults, not suggestions.

## Server-side

### HTTP security headers

Use Helmet.js with default configuration. Install as a production dependency.

```javascript
import helmet from 'helmet';
app.use(helmet());
```

This sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and disables `X-Powered-By` among others. Do not disable Helmet defaults unless a specific PRD requirement demands it (and document why).

### CORS

Enable CORS with explicit origin control:

```javascript
import cors from 'cors';

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

- In development, allow `localhost` only.
- In production, set `CORS_ORIGINS` to the exact deployed domain(s). Never use `*` in production.

### Rate limiting

Apply a simple in-memory rate limiter to API routes. This is not production-grade (no Redis, no distributed state) but prevents basic abuse.

```javascript
// src/server/middleware/rate-limiter.mjs
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

export function rateLimiter(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const record = hits.get(key) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + WINDOW_MS;
  }

  record.count++;
  hits.set(key, record);

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' }
    });
  }

  next();
}
```

Apply to API routes: `app.use('/api', rateLimiter);`

### Input handling

- **Sanitise all user input** before processing. Strip leading/trailing whitespace on string fields. Reject unexpected fields (do not blindly spread `req.body` into data objects).
- **Never use `eval()`**, `new Function()`, `vm.runInNewContext()`, or any dynamic code execution with user-supplied data.
- **No shell commands with user input.** If you must call `child_process`, never interpolate user data into the command string. Use the array form of `execFile` with no shell.
- **Secrets in environment variables.** API keys, database credentials, signing keys -- all via `process.env`. Never hardcode secrets. Never commit `.env` files (ensure `.gitignore` includes `.env*`).

### Dependencies

- Run `npm audit` before any release. Fix critical and high vulnerabilities.
- Pin exact versions in `package.json` (no `^` or `~` prefixes) for production dependencies.

## Frontend

### DOM manipulation

- **Never set `innerHTML` with user-provided data.** Use `textContent` for text, or build DOM nodes with `document.createElement()` and set properties individually.
- **Never use `document.write()`.**
- If you must render HTML from a trusted source (e.g., server-rendered markdown), sanitise it first with DOMPurify or equivalent. But prefer not to.

```javascript
// WRONG - XSS vulnerability
element.innerHTML = `<p>${userInput}</p>`;

// CORRECT
const p = document.createElement('p');
p.textContent = userInput;
element.append(p);
```

### External resources

- Do not load scripts from CDNs unless the PRD requires a specific external library. Serve all JS locally.
- If an external script is required, use `integrity` (SRI) and `crossorigin` attributes.

### Storage

- Do not store secrets (tokens, passwords) in `localStorage` or `sessionStorage`.
- If authentication is needed, use `httpOnly` cookies set by the server.

## Checklist for every PR

Before shipping, verify:
1. No `eval()`, `new Function()`, or `innerHTML` with dynamic data.
2. No hardcoded secrets in source files.
3. `.env*` files are in `.gitignore`.
4. Helmet.js is enabled.
5. CORS origins are explicit (not `*`).
6. All user input is validated server-side before use.
7. `npm audit` reports no critical or high vulnerabilities.
