import { describe, expect, it } from "vitest";
import { deriveCompleteness } from "../lib/report-status";
import { buildCompletedReportFixture } from "./fixtures/completed-report";

describe("grade withholding on a partial audit", () => {
  it("never issues a grade when a framework section is truncated", () => {
    const sections = buildCompletedReportFixture();
    sections[0] = { ...sections[0], status: "truncated", detail: "Cut off." };

    const completeness = deriveCompleteness(sections);

    expect(completeness.isComplete).toBe(false);
    expect(completeness.grade).toBeNull();
    expect(completeness.gradeBand).toBeNull();
    expect(completeness.withheldReason).toContain(
      "Grading a partial audit would misrepresent it"
    );
  });
});
