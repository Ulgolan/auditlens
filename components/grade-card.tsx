"use client";

import type { ReportSection } from "@/lib/types";
import { OVERALL_ID } from "@/lib/types";

interface GradeCardProps {
  sections: ReportSection[];
}

/**
 * The Overall card.
 *
 * Non-negotiable: a letter grade is only ever shown when every section
 * completed. v1 rendered a grade off a partial report, which is the
 * single most misleading thing this tool could do. If anything is
 * incomplete, the grade is withheld and the tally is shown instead.
 */
export function GradeCard({ sections }: GradeCardProps) {
  if (sections.length === 0) return null;

  const frameworkSections = sections.filter((s) => s.id !== OVERALL_ID);
  const overall = sections.find((s) => s.id === OVERALL_ID);

  const completedCount = frameworkSections.filter((s) => s.status === "complete").length;
  const totalCount = frameworkSections.length;

  const everythingComplete =
    sections.length > 0 && sections.every((s) => s.status === "complete");

  // Severity counts come from the framework sections only. The overall
  // pass restates findings, and counting it too would inflate the totals.
  const frameworkText = frameworkSections.map((s) => s.text).join("\n\n");
  const criticalCount = (frameworkText.match(/🔴/g) || []).length;
  const minorCount = (frameworkText.match(/⚠️/g) || []).length;
  const passCount = (frameworkText.match(/✅/g) || []).length;

  const gradeMatch = overall?.text
    ? overall.text.match(/(?:Overall|Letter)\s*Grade[:\s]*\*?\*?\s*([A-F][+-]?)/i) ||
      overall.text.match(/Grade[:\s]*\*?\*?\s*([A-F][+-]?)\b/i) ||
      overall.text.match(/\*\*([A-F][+-]?)\*\*/)
    : null;
  const grade = gradeMatch ? gradeMatch[1] : "—";

  const gradeColor = grade.startsWith("A")
    ? "text-pass"
    : grade.startsWith("B")
    ? "text-blue-400"
    : grade.startsWith("C")
    ? "text-minor"
    : "text-critical";

  return (
    <div className="mb-6 animate-[fadeIn_0.4s_ease]">
      <div
        className={`flex gap-5 px-6 py-5 border rounded-2xl items-center flex-wrap ${
          everythingComplete
            ? "bg-white/[0.02] border-border rounded-b-2xl"
            : "bg-white/[0.02] border-minor/25 rounded-b-none border-b-0"
        }`}
      >
        {/* Grade — or the withheld placeholder */}
        <div className="text-center min-w-[80px]">
          {everythingComplete ? (
            <>
              <div
                className={`text-5xl font-extrabold leading-none font-display ${gradeColor}`}
              >
                {grade}
              </div>
              <div className="text-[10px] text-text-tertiary mt-1 font-semibold tracking-wider">
                OVERALL
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl font-extrabold leading-none font-display text-white/15">
                —
              </div>
              <div className="text-[10px] text-minor mt-1 font-semibold tracking-wider">
                WITHHELD
              </div>
            </>
          )}
        </div>

        <div className="w-px h-[60px] bg-border" />

        <div className="flex gap-5">
          <div className="text-center">
            <div className="text-2xl font-bold text-critical">{criticalCount}</div>
            <div className="text-[10px] text-text-tertiary font-medium">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-minor">{minorCount}</div>
            <div className="text-[10px] text-text-tertiary font-medium">Minor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pass">{passCount}</div>
            <div className="text-[10px] text-text-tertiary font-medium">Pass</div>
          </div>
        </div>

        <div className="w-px h-[60px] bg-border" />

        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              everythingComplete ? "text-pass" : "text-minor"
            }`}
          >
            {completedCount}
            <span className="text-text-tertiary font-normal">/{totalCount}</span>
          </div>
          <div className="text-[10px] text-text-tertiary font-medium">Frameworks</div>
        </div>
      </div>

      {/* Why the grade is missing — stated, not implied */}
      {!everythingComplete && (
        <div className="px-6 py-3.5 bg-minor-dim border border-minor/25 border-t-0 rounded-b-2xl">
          <div className="text-[13px] font-semibold text-minor mb-1">
            No grade — this audit is incomplete
          </div>
          <div className="text-xs text-white/55 leading-relaxed">
            {completedCount} of {totalCount} framework
            {totalCount !== 1 ? "s" : ""} completed
            {overall && overall.status !== "complete"
              ? ", and the overall assessment did not finish"
              : ""}
            . Grading a partial audit would misrepresent it, so the grade is withheld.
            The severity counts above cover only what was actually evaluated. Retry the
            affected sections to complete the audit.
          </div>
        </div>
      )}
    </div>
  );
}
