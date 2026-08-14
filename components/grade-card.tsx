"use client";

import type { ReportSection } from "@/lib/types";
import type { GradeBand } from "@/lib/report-status";
import { deriveCompleteness } from "@/lib/report-status";

interface GradeCardProps {
  sections: ReportSection[];
}

/**
 * Grade band styling.
 *
 * The letter always sits inside a filled chip rather than being coloured
 * text, because two of the four brand bands (yellow, peri) cannot carry
 * legible text on white at any size. Filling the chip and choosing the ink
 * per band keeps every grade readable and keeps the palette to primitives.
 */
const BAND: Record<GradeBand, { fill: string; ink: string }> = {
  a: { fill: "bg-navy border-2 border-navy", ink: "text-ivory" },
  b: { fill: "bg-peri border-2 border-peri", ink: "text-ivory" },
  c: { fill: "bg-minor border-2 border-minor", ink: "text-navy" },
  d: { fill: "bg-critical border-2 border-critical", ink: "text-ivory" },
};

/**
 * The Overall card.
 *
 * Non-negotiable: a letter grade is only ever shown when every section
 * completed. v1 rendered a grade off a partial report, which is the
 * single most misleading thing this tool could do. The withholding is not
 * enforced here — it is enforced in deriveCompleteness, which hands this
 * component `grade: null` whenever anything is short, so there is no
 * grade available to render even by mistake.
 */
export function GradeCard({ sections }: GradeCardProps) {
  if (sections.length === 0) return null;

  const {
    completedCount,
    totalCount,
    isComplete,
    criticalCount,
    minorCount,
    passCount,
    grade,
    gradeBand,
    withheldReason,
  } = deriveCompleteness(sections);

  const band = gradeBand ? BAND[gradeBand] : null;

  return (
    <div className="mb-6 animate-[fadeIn_0.4s_ease]">
      <div
        className={`flex gap-6 px-6 py-5 border bg-card items-center flex-wrap rounded-card ${
          isComplete
            ? "border-border"
            : "border-minor border-l-[4px] rounded-b-none border-b-0"
        }`}
      >
        {/* Grade — or the withheld placeholder */}
        <div className="text-center min-w-[110px]">
          {grade && band ? (
            <>
              <div
                className={`grade-chip font-display flex h-[92px] w-[92px] items-center justify-center rounded-card text-6xl font-extrabold leading-none ${band.fill} ${band.ink}`}
              >
                {grade}
              </div>
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-text-tertiary mt-2">
                Overall
              </div>
            </>
          ) : (
            <>
              <div className="font-display flex h-[92px] w-[92px] items-center justify-center rounded-card border-2 border-dashed border-border-strong text-6xl font-extrabold leading-none text-text-tertiary">
                —
              </div>
              <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-text-primary mt-2 font-medium">
                Withheld
              </div>
            </>
          )}
        </div>

        <div className="w-px h-[60px] bg-border" />

        {/* Severity tallies. The numeral stays navy and a grid-locked swatch
            carries the hue — the same rule the severity banners follow. */}
        <div className="flex gap-6">
          <Tally label="Critical" count={criticalCount} swatch="bg-critical" />
          <Tally label="Minor" count={minorCount} swatch="bg-minor" />
          <Tally label="Pass" count={passCount} swatch="bg-pass" />
        </div>

        <div className="w-px h-[60px] bg-border" />

        <div className="text-center">
          <div className="text-3xl font-bold text-text-primary">
            {completedCount}
            <span className="text-text-tertiary font-normal">/{totalCount}</span>
          </div>
          <div className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-text-tertiary mt-1">
            Frameworks
          </div>
        </div>
      </div>

      {/* Why the grade is missing — stated, not implied */}
      {!isComplete && (
        <div className="px-6 py-3.5 bg-minor-dim border border-minor border-l-[4px] border-t-0 rounded-b-card">
          <div className="text-[16px] font-bold text-text-primary mb-1">
            No grade — this audit is incomplete
          </div>
          <div className="text-[15px] text-text-secondary leading-relaxed">
            {withheldReason} Retry the affected sections to complete the audit.
          </div>
        </div>
      )}
    </div>
  );
}

function Tally({
  label,
  count,
  swatch,
}: {
  label: string;
  count: number;
  swatch: string;
}) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-text-primary leading-none">{count}</div>
      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        {/* Border as well as fill: a browser printing with background
            graphics off drops the fill, and the swatch would vanish. */}
        <span className={`h-2 w-2 rounded-[2px] border-2 ${swatch}`} aria-hidden="true" />
        <span className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-text-tertiary">
          {label}
        </span>
      </div>
    </div>
  );
}
