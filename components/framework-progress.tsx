"use client";

import type { ReportSection, SectionStatus } from "@/lib/types";

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
        className="w-3.5 h-3.5 rounded-full border-2 border-accent/30 border-t-accent shrink-0"
        style={{ animation: "spin 0.8s linear infinite" }}
      />
    );
  }

  if (status === "complete") return <span className="text-[13px] leading-none">✅</span>;
  if (status === "truncated") return <span className="text-[13px] leading-none">⚠️</span>;
  if (status === "failed") return <span className="text-[13px] leading-none">🔴</span>;

  return <div className="w-3.5 h-3.5 rounded-full border border-white/15 shrink-0" />;
}

/**
 * Live per-framework progress. Replaces v1's three hardcoded phases,
 * which said "Running evaluation frameworks..." for the entire audit
 * and told the operator nothing about which one, or how far in.
 */
export function FrameworkProgress({ sections, preparing }: FrameworkProgressProps) {
  const done = sections.filter((s) => s.status !== "pending" && s.status !== "streaming");

  return (
    <div className="px-5 py-4 bg-accent-dim border border-accent-border/40 rounded-xl mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold text-accent tracking-wider">
          {preparing ? "PROCESSING SCREENSHOTS" : "RUNNING AUDIT"}
        </div>
        <div className="text-[11px] text-white/35 font-mono">
          {done.length}/{sections.length}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {sections.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5 text-[13px]">
            <StatusIcon status={s.status} />
            <span
              className={
                s.status === "streaming"
                  ? "font-semibold text-accent"
                  : s.status === "pending"
                  ? "text-white/25"
                  : "text-white/60"
              }
            >
              {s.label}
            </span>
            <span
              className={`ml-auto text-[11px] ${
                s.status === "truncated"
                  ? "text-minor"
                  : s.status === "failed"
                  ? "text-critical"
                  : "text-white/25"
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
