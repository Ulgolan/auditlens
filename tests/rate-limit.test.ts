import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  checkRateLimit,
  RATE_LIMIT_MAX_REQUESTS,
  resetRateLimitStoreForTests,
} from "../lib/rate-limit";

/**
 * Gate Zero #5 — the paid /api/evaluate endpoint is metered per IP.
 *
 * Split into two hermetic pieces, neither of which can perform network I/O
 * regardless of whether ANTHROPIC_API_KEY is set in the environment:
 *
 * 1. A pure unit test against the limiter module itself — a Map and some
 *    arithmetic, nothing else in the call graph.
 * 2. One thin handler test with `fetch` mocked, proving the 429 path
 *    returns before the Anthropic client is ever touched.
 *
 * The earlier version of this file called the real POST handler 41 times
 * directly. With no ANTHROPIC_API_KEY that happened to short-circuit
 * harmlessly at the route's own apiKey check (500, no network) — but
 * harness.yml sets ANTHROPIC_API_KEY at the job level, so every CI step
 * inherits it, and the 40 "allowed" calls in that loop each reached the
 * real `fetch()` to the live Anthropic API. That is what timed out CI's
 * default 5000ms test timeout; it passed locally only because the key
 * happened to be absent there. Reproduced directly: with the real key
 * exported locally, the old test timed out at 5000ms too — same failure,
 * same cause. No test in this file may spend API credit, ever, in any
 * environment — that is the property being fixed here.
 */
describe("rate limiter (unit — no HTTP, no network)", () => {
  afterEach(() => {
    resetRateLimitStoreForTests();
  });

  it("allows requests under the ceiling and rejects the one that exceeds it", () => {
    const ip = "203.0.113.7";
    let last: { allowed: boolean; retryAfterSeconds: number } | undefined;

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS + 1; i++) {
      last = checkRateLimit(ip);
    }

    expect(last?.allowed).toBe(false);
    expect(last?.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("does not rate-limit a different IP still under its own ceiling", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      checkRateLimit("203.0.113.7"); // exhaust a different IP's bucket
    }

    const result = checkRateLimit("198.51.100.20");
    expect(result.allowed).toBe(true);
  });
});

describe("evaluate route — 429 path returns before the client is touched", () => {
  afterEach(() => {
    resetRateLimitStoreForTests();
    vi.unstubAllGlobals();
  });

  it("rejects an already-exhausted IP without ever calling fetch", async () => {
    const ip = "203.0.113.55";
    // Exhaust the bucket directly against the limiter module — pure
    // function calls, no HTTP, no handler, no possibility of network I/O
    // in this setup step regardless of environment.
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      checkRateLimit(ip);
    }

    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("../app/api/evaluate/route");
    const req = new NextRequest("http://localhost/api/evaluate", {
      method: "POST",
      headers: { "x-forwarded-for": ip, "content-type": "application/json" },
      body: JSON.stringify({
        framework: "nielsen",
        taskScenario: "",
        audience: "public",
        images: [],
        conceptText: "test",
      }),
    });

    // This is the ONLY call this test sends through POST, and the bucket
    // is already exhausted, so it is guaranteed to land on the 429 branch
    // — there is no "prior allowed call" ambiguity to reason about.
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();

    const body = await res.json();
    expect(body.error).toMatch(/too many requests/i);

    // Proves the 429 branch returns before the Anthropic client is ever
    // touched, in any environment — with or without a real key present.
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
