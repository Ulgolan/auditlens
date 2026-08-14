import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * v1's silent-truncation bug: the stream ended, no `stop_reason` was ever
 * checked, and a cut-off report rendered identically to a complete one.
 * The fix lives in app/page.tsx's runSection — it is a closure inside a
 * client component, not an exported pure function, so it cannot be
 * imported and unit-tested directly without restructuring app code (out
 * of scope for this lap). This test instead pins the source shape of the
 * fix itself, so a regression that silently drops the stop_reason check
 * fails CI even though the logic can't be called in isolation.
 */
describe("response-assembly path (app/page.tsx runSection)", () => {
  const source = readFileSync(path.join(__dirname, "../app/page.tsx"), "utf-8");

  it("captures stop_reason off the message_delta event", () => {
    expect(source).toContain('parsed.type === "message_delta"');
    expect(source).toContain("parsed.delta?.stop_reason");
  });

  it("marks max_tokens as truncated, not complete", () => {
    const maxTokensBranch = source.match(
      /stopReason === "max_tokens"\)\s*\{\s*status = "([a-z]+)"/
    );
    expect(maxTokensBranch?.[1]).toBe("truncated");
  });

  it("treats a missing stop_reason (dropped stream) as truncated, never as a silent success", () => {
    const nullBranch = source.match(
      /stopReason === null\)\s*\{[\s\S]{0,200}?status = "([a-z]+)"/
    );
    expect(nullBranch?.[1]).toBe("truncated");
  });

  it("only reaches complete through the explicit end_turn branch", () => {
    // Guards against a future fallback/default branch quietly marking an
    // unrecognised or absent stop_reason as complete.
    const completeAssignments = source.match(/status = "complete"/g) || [];
    expect(completeAssignments).toHaveLength(1);

    const endTurnGate = source.match(
      /stopReason === "end_turn"\)\s*\{\s*status = "complete"/
    );
    expect(endTurnGate).not.toBeNull();
  });
});
