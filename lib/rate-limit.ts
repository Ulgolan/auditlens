/**
 * Per-IP, in-memory rate limiter for the paid /api/evaluate route.
 *
 * Extracted from the route handler so it can be unit-tested on its own —
 * pure function calls against a Map, no HTTP, no Next.js request/response
 * machinery, and critically, nothing anywhere near a real network call.
 * (The earlier version lived inline in the route and was tested by calling
 * the real POST handler 41 times; with a real ANTHROPIC_API_KEY in the
 * environment — which CI has, harness.yml sets it at the job level — the
 * first 40 of those calls sailed past this check and each hit the real
 * Anthropic API, which is why that test passed in under a second locally
 * with no key and timed out at 5000ms in CI. See tests/rate-limit.test.ts.)
 *
 * CAVEAT: the Map lives in the function instance's memory. It resets on
 * every cold start, and a burst of concurrent requests can land on
 * separate warm instances that do not share this Map — so the limit is
 * per-instance, not a global guarantee. Acceptable for a single-operator
 * tool per Gate Zero; would need a shared store (e.g. Redis) to hold under
 * multi-instance concurrency.
 */

export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const RATE_LIMIT_MAX_REQUESTS = 40;

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test-only: clears every bucket so one test case can't leak into another. */
export function resetRateLimitStoreForTests(): void {
  rateBuckets.clear();
}
