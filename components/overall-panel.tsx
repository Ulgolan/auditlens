"use client";

import type { ReportSection } from "@/lib/types";
import { describeSection } from "@/lib/report-status";
import { SectionCard } from "@/components/section-card";

interface OverallPanelProps {
  section: ReportSection;
  open: boolean;
  onToggle: () => void;
  onRetry?: () => void;
  busy?: boolean;
}

/**
 * The Overall Assessment, directly under the grade card.
 *
 * Expanded by default — it is the first thing read, and collapsing it by
 * default would bury the synthesis behind a click. Collapsing exists so
 * it can be pushed out of the way once read, not so it can start hidden.
 *
 * The header states the section's status even when collapsed. A folded
 * panel must not be able to hide the fact that the overall pass did not
 * finish.
 */
export function OverallPanel({
  section,
  open,
  onToggle,
  onRetry,
  busy,
}: OverallPanelProps) {
  const declaration = describeSection(section);

  return (
    <div className="mb-5">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="font-mono w-full flex items-center gap-3 px-5 py-3.5 rounded-card bg-navy text-ivory text-[0.9rem] font-medium uppercase tracking-[0.16em] cursor-pointer transition-opacity hover:opacity-90"
        style={
          open ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : undefined
        }
      >
        <span
          aria-hidden="true"
          className="text-[1.1rem] leading-none transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ›
        </span>
        Overall Assessment
        {declaration && (
          <span className="ml-auto flex items-center gap-2 normal-case tracking-[0.06em] text-[0.78rem]">
            <span
              className={`h-2 w-2 rounded-[2px] ${
                section.status === "failed" ? "bg-critical" : "bg-minor"
              }`}
              aria-hidden="true"
            />
            {section.status === "failed" ? "Did not complete" : "Cut off"}
          </span>
        )}
        {section.status === "streaming" && (
          <span className="ml-auto normal-case tracking-[0.06em] text-[0.78rem]">
            Evaluating…
          </span>
        )}
      </button>

      {open && (
        <div className="border border-t-0 border-border rounded-b-card overflow-hidden">
          <SectionCard section={section} onRetry={onRetry} busy={busy} flush />
        </div>
      )}
    </div>
  );
}
