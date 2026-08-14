import { describe, expect, it } from "vitest";
import { FRAMEWORKS, OVERALL_ID } from "../lib/types";
import { deriveCompleteness } from "../lib/report-status";
import { buildCompletedReportFixture } from "./fixtures/completed-report";

describe("completed report fixture", () => {
  it("contains all 4 framework sections", () => {
    const sections = buildCompletedReportFixture();
    const frameworkSections = sections.filter((s) => s.id !== OVERALL_ID);

    expect(frameworkSections).toHaveLength(4);
    expect(frameworkSections.map((s) => s.id).sort()).toEqual(
      FRAMEWORKS.map((f) => f.id).sort()
    );
  });

  it("is graded complete by the completeness engine", () => {
    const completeness = deriveCompleteness(buildCompletedReportFixture());

    expect(completeness.isComplete).toBe(true);
    expect(completeness.completedCount).toBe(4);
    expect(completeness.totalCount).toBe(4);
    expect(completeness.grade).toBe("A");
    expect(completeness.withheldReason).toBeNull();
  });
});
