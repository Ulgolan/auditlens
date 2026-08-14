import { describe, expect, it } from "vitest";

describe("audit API route module", () => {
  it("loads and exports a POST handler", async () => {
    const mod = await import("../app/api/evaluate/route");
    expect(typeof mod.POST).toBe("function");
  });
});
