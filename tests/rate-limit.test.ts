import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/evaluate/route";

/**
 * Gate Zero #5 — the paid /api/evaluate endpoint is metered per IP.
 * The limiter runs before the ANTHROPIC_API_KEY check, so this test needs
 * no real key: everything under the threshold 500s harmlessly (no key
 * configured in the test environment), and the request that pushes past
 * the threshold is rejected before it gets that far.
 */
describe("per-IP rate limit on the evaluate route", () => {
  it("returns 429 once a single IP exceeds the request ceiling", async () => {
    const ip = "203.0.113.7";
    const makeRequest = () =>
      new NextRequest("http://localhost/api/evaluate", {
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

    let lastResponse: Response | undefined;
    // RATE_LIMIT_MAX_REQUESTS is 40 in app/api/evaluate/route.ts — the 41st
    // call from this IP inside the window must be rejected.
    for (let i = 0; i < 41; i++) {
      lastResponse = await POST(makeRequest());
    }

    expect(lastResponse?.status).toBe(429);
    expect(lastResponse?.headers.get("Retry-After")).toBeTruthy();

    const body = await lastResponse?.json();
    expect(body.error).toMatch(/too many requests/i);
  });

  it("does not rate-limit a different IP still under its own ceiling", async () => {
    const req = new NextRequest("http://localhost/api/evaluate", {
      method: "POST",
      headers: { "x-forwarded-for": "198.51.100.20", "content-type": "application/json" },
      body: JSON.stringify({
        framework: "nielsen",
        taskScenario: "",
        audience: "public",
        images: [],
        conceptText: "test",
      }),
    });

    const res = await POST(req);
    // No ANTHROPIC_API_KEY configured in the test environment — the route
    // 500s past the limiter, which is the point: it is not 429.
    expect(res.status).not.toBe(429);
  });
});
