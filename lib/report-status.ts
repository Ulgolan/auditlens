import type { ReportSection } from "./types";
import { OVERALL_ID } from "./types";

/**
 * The single source of truth for "is this audit trustworthy, and what may
 * we say about it".
 *
 * Everything that renders an audit — the on-screen grade card, the section
 * cards, and the exported client document — derives its statuses from here
 * and nowhere else. This exists because the export is the one surface a
 * client actually reads, and a second implementation of "is it complete"
 * living next to it is exactly how a partial audit would eventually be
 * laundered into a clean one. The app and the document cannot disagree,
 * because there is only one answer to disagree about.
 *
 * The load-bearing design choice: `grade` is `null` unless every section
 * completed. A consumer that wants to print a grade on a partial audit
 * cannot — it is never handed one.
 */

export type GradeBand = "a" | "b" | "c" | "d";

export interface SectionDeclaration {
  /** Headline shown above the section's own content. */
  headline: string;
  /** Machine-supplied reason, when there is one. */
  detail?: string;
  /** The standing caution that follows every incomplete section. */
  caution: string;
}

export interface AuditCompleteness {
  frameworkSections: ReportSection[];
  overall?: ReportSection;
  completedCount: number;
  totalCount: number;
  /** True only when every section — frameworks AND the overall pass — completed. */
  isComplete: boolean;
  /** Sections that did not complete, in report order. */
  incomplete: ReportSection[];
  criticalCount: number;
  minorCount: number;
  passCount: number;
  /** The letter grade. `null` whenever the audit is not complete. */
  grade: string | null;
  gradeBand: GradeBand | null;
  /** Why the grade is withheld, as a full sentence. `null` when complete. */
  withheldReason: string | null;
}

export function deriveCompleteness(sections: ReportSection[]): AuditCompleteness {
  const frameworkSections = sections.filter((s) => s.id !== OVERALL_ID);
  const overall = sections.find((s) => s.id === OVERALL_ID);

  const completedCount = frameworkSections.filter((s) => s.status === "complete").length;
  const totalCount = frameworkSections.length;

  const isComplete =
    sections.length > 0 && sections.every((s) => s.status === "complete");

  const incomplete = sections.filter((s) => s.status !== "complete");

  // Severity counts come from the framework sections only. The overall pass
  // restates findings, and counting it too would inflate the totals.
  const frameworkText = frameworkSections.map((s) => s.text).join("\n\n");
  const criticalCount = (frameworkText.match(/🔴/g) || []).length;
  const minorCount = (frameworkText.match(/⚠️/g) || []).length;
  const passCount = (frameworkText.match(/✅/g) || []).length;

  const parsedGrade = parseGrade(overall?.text);

  // The invariant, in one line: no completion, no grade. Not a dimmed
  // grade, not a provisional grade — none.
  const grade = isComplete ? parsedGrade : null;

  return {
    frameworkSections,
    overall,
    completedCount,
    totalCount,
    isComplete,
    incomplete,
    criticalCount,
    minorCount,
    passCount,
    grade,
    gradeBand: grade ? bandOf(grade) : null,
    withheldReason: isComplete
      ? null
      : buildWithheldReason(completedCount, totalCount, overall),
  };
}

function parseGrade(text?: string): string | null {
  if (!text) return null;
  const match =
    text.match(/(?:Overall|Letter)\s*Grade[:\s]*\*?\*?\s*([A-F][+-]?)/i) ||
    text.match(/Grade[:\s]*\*?\*?\s*([A-F][+-]?)\b/i) ||
    text.match(/\*\*([A-F][+-]?)\*\*/);
  return match ? match[1] : null;
}

function bandOf(grade: string): GradeBand {
  if (grade.startsWith("A")) return "a";
  if (grade.startsWith("B")) return "b";
  if (grade.startsWith("C")) return "c";
  return "d";
}

function buildWithheldReason(
  completedCount: number,
  totalCount: number,
  overall?: ReportSection
): string {
  const overallFailed = overall !== undefined && overall.status !== "complete";
  return (
    `${completedCount} of ${totalCount} framework${totalCount !== 1 ? "s" : ""} completed` +
    (overallFailed ? ", and the overall assessment did not finish" : "") +
    ". Grading a partial audit would misrepresent it, so the grade is withheld. " +
    "The severity counts cover only what was actually evaluated."
  );
}

/**
 * The wording an incomplete section declares itself with. Shared so the
 * exported document says the same thing, in the same words, as the screen.
 */
export function describeSection(section: ReportSection): SectionDeclaration | null {
  if (section.status === "complete") return null;
  if (section.status === "pending" || section.status === "streaming") return null;

  return {
    headline:
      section.status === "failed"
        ? `${section.label} did not complete`
        : `${section.label} is incomplete — this section was cut off`,
    detail: section.detail,
    caution:
      "Treat the findings below as partial. Nothing here should be read as a full evaluation.",
  };
}
