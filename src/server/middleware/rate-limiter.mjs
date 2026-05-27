/**
 * Simple in-memory rate limiter.
 */

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
