import { FRAMEWORKS, OVERALL_ID, type ReportSection } from "../../lib/types";
import { FRAMEWORK_HEADINGS } from "../../lib/prompts";

/**
 * A synthetic but structurally faithful completed audit: every framework
 * section plus the overall pass, all `complete`, in the shape
 * lib/report-status.ts expects to see from a real run.
 */
export function buildCompletedReportFixture(): ReportSection[] {
  const frameworkSections: ReportSection[] = FRAMEWORKS.map((fw) => ({
    id: fw.id,
    label: fw.label,
    status: "complete",
    text: `## ${FRAMEWORK_HEADINGS[fw.id]}\n\n[PASS] Everything checked out.\n`,
  }));

  const overall: ReportSection = {
    id: OVERALL_ID,
    label: "Overall Assessment",
    status: "complete",
    text: "## OVERALL ASSESSMENT\n\n### Letter Grade\n\n**Letter Grade: A**\n",
  };

  return [...frameworkSections, overall];
}
