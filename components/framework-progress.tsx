"use client";

import type { ReportSection, SectionStatus } from "@/lib/types";
import { IconPass, IconMinor, IconCritical } from "@/components/icons";

interface FrameworkProgressProps {
  sections: ReportSection[];
  /** True while screenshots are still being compressed, before any call. */
  preparing?: boolean;
}

const STATUS_LABEL: Record<SectionStatus, string> = {
  pending: "Queued",
  streaming: "Evaluating...",
  complete: "Complete",
  truncated: "Cut off",
  failed: "Failed",
};

function StatusIcon({ status }: { status: SectionStatus }) {
  if (status === "streaming") {
    return (
      <div
        className="w-3.5 h-3.5 rounded-full border-2 border-border border-t-navy shrink-0"
        style={{ animation: "spin 0.8s linear infinite" }}
      />
    );
  }

  if (status === "complete") return <IconPass className="w-3.5 h-3.5 shrink-0" />;
  if (status === "truncated") return <IconMinor className="w-3.5 h-3.5 shrink-0" />;
  if (status === "failed") return <IconCritical className="w-3.5 h-3.5 shrink-0" />;

  return <div className="w-3.5 h-3.5 rounded-full border border-border-strong shrink-0" />;
}

/**
 * Live per-framework progress. Replaces v1's three hardcoded phases,
 * which said "Running evaluation frameworks..." for the entire audit
 * and told the operator nothing about which one, or how far in.
 */
export function FrameworkProgress({ sections, preparing }: FrameworkProgressProps) {
  const done = sections.filter((s) => s.status !== "pending" && s.status !== "streaming");

  return (
    <div className="px-5 py-4 bg-card border border-border rounded-xl mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[0.82rem] font-medium uppercase tracking-[0.16em] text-text-primary">
          {preparing ? "Processing screenshots" : "Running audit"}
        </div>
        <div className="font-mono text-[0.82rem] text-text-tertiary">
          {done.length}/{sections.length}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {sections.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5 text-[16px]">
            <StatusIcon status={s.status} />
            <span
              className={
                s.status === "streaming"
                  ? "font-semibold text-text-primary"
                  : s.status === "pending"
                  ? "text-text-tertiary"
                  : "text-text-secondary"
              }
            >
              {s.label}
            </span>
            {/* The status word is never the only carrier of severity — the icon
                carries hue, the word carries meaning, and the word stays navy
                so it is legible at 11px on white. */}
            <span
              className={`ml-auto font-mono text-[0.8rem] uppercase tracking-[0.08em] ${
                s.status === "truncated" || s.status === "failed"
                  ? "font-medium text-text-primary"
                  : "text-text-tertiary"
              }`}
            >
              {STATUS_LABEL[s.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
