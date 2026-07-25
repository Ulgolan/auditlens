"use client";

import type { ReportSection } from "@/lib/types";
import { ReportRenderer } from "@/components/report-renderer";

interface SectionCardProps {
  section: ReportSection;
}

/**
 * Renders one framework section.
 *
 * A section that did not complete says so, in its own card, above its
 * own content. The operator should never have to compare the report
 * against the framework list to work out that something is missing.
 */
export function SectionCard({ section }: SectionCardProps) {
  const { status, detail, label, text } = section;

  const isIncomplete = status === "truncated" || status === "failed";

  return (
    <div
      className={`px-7 py-6 mb-4 rounded-2xl border ${
        status === "failed"
          ? "bg-critical-dim/40 border-critical/25"
          : status === "truncated"
          ? "bg-minor-dim/40 border-minor/25"
          : "bg-white/[0.015] border-border"
      }`}
    >
      {/* Declaration banner — only when the section is not trustworthy */}
      {isIncomplete && (
        <div
          className={`flex gap-3 px-4 py-3 mb-5 rounded-xl border ${
            status === "failed"
              ? "bg-critical-dim border-critical/20"
              : "bg-minor-dim border-minor/20"
          }`}
        >
          <span className="text-base leading-none mt-px">
            {status === "failed" ? "🔴" : "⚠️"}
          </span>
          <div>
            <div
              className={`text-[13px] font-semibold mb-0.5 ${
                status === "failed" ? "text-critical" : "text-minor"
              }`}
            >
              {status === "failed"
                ? `${label} did not complete`
                : `${label} is incomplete — this section was cut off`}
            </div>
            {detail && <div className="text-xs text-white/50 leading-relaxed">{detail}</div>}
            <div className="text-xs text-white/40 leading-relaxed mt-1">
              Treat the findings below as partial. Nothing here should be read as a
              full evaluation.
            </div>
          </div>
        </div>
      )}

      {text ? (
        <ReportRenderer content={text} />
      ) : (
        <div className="text-[13px] text-text-tertiary italic">
          No content was produced for this section.
        </div>
      )}

      {status === "streaming" && (
        <div className="flex items-center gap-2 mt-4 text-xs text-accent">
          <div
            className="w-3 h-3 rounded-full border-2 border-accent/30 border-t-accent"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
          Evaluating {label}...
        </div>
      )}
    </div>
  );
}
