"use client";

import type { ReportSection } from "@/lib/types";
import type { SectionStatus } from "@/lib/types";

interface SectionTabsProps {
  sections: ReportSection[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Per-framework tab bar. Sticky, so the operator can move between
 * frameworks from anywhere in a long report instead of scrolling.
 *
 * Each tab carries its section's status. This is not decoration: the
 * whole point of focusing one section at a time is that the other three
 * are off-screen, so a truncated section that only declared itself
 * inside its own card would be invisible from every other tab. The dot
 * is how the honesty layer survives tabbing — it reads from the same
 * `status` the banner does, so it cannot drift out of step, and it
 * updates live when a retry changes the status underneath it.
 */
export function SectionTabs({ sections, activeId, onSelect }: SectionTabsProps) {
  if (sections.length === 0) return null;

  return (
    <div className="sticky top-0 z-30 -mx-6 px-6 py-3 mb-5 bg-ground/95 backdrop-blur-md border-b border-border">
      <div
        className="flex gap-2 flex-wrap"
        role="tablist"
        aria-label="Framework sections"
      >
        {sections.map((s) => {
          const isActive = s.id === activeId;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(s.id)}
              className={`font-mono flex items-center gap-2 rounded-pill border px-4 py-[0.6em] text-[0.85rem] font-medium uppercase tracking-[0.1em] transition-colors cursor-pointer ${
                isActive
                  ? "bg-navy border-navy text-ivory"
                  : "bg-card border-border text-text-primary hover:border-border-strong"
              }`}
            >
              <StatusDot status={s.status} onNavy={isActive} />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The dot is never the only carrier — the section's own banner states the
 * problem in words, and the tab keeps a title attribute for the same
 * reason. Colour here is a locator, not the message.
 */
function StatusDot({ status, onNavy }: { status: SectionStatus; onNavy: boolean }) {
  if (status === "complete") return null;

  if (status === "streaming") {
    return (
      <span
        aria-label="evaluating"
        title="Evaluating"
        className={`h-2 w-2 rounded-full border-2 ${
          onNavy ? "border-ivory" : "border-navy"
        }`}
        style={{ animation: "pulse 1.2s ease-in-out infinite" }}
      />
    );
  }

  if (status === "truncated") {
    return (
      <span
        aria-label="incomplete — cut off"
        title="Incomplete — this section was cut off"
        className="h-2.5 w-2.5 rounded-[2px] border-2 border-minor bg-minor"
      />
    );
  }

  if (status === "failed") {
    return (
      <span
        aria-label="did not complete"
        title="This section did not complete"
        className="h-2.5 w-2.5 rounded-[2px] border-2 border-critical bg-critical"
      />
    );
  }

  // pending
  return (
    <span
      aria-label="queued"
      title="Queued"
      className={`h-2 w-2 rounded-full border ${
        onNavy ? "border-ivory/50" : "border-border-strong"
      }`}
    />
  );
}
