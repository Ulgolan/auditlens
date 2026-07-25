"use client";

import { useState } from "react";
import type { Screenshot } from "@/lib/types";
import { AUDIENCES, FRAMEWORKS } from "@/lib/types";

interface ContextPanelProps {
  screenshots: Screenshot[];
  conceptText: string;
  taskScenario: string;
  audience: string;
  frameworks: string[];
}

/**
 * The operator's standing reminder of what this audit was actually asked.
 *
 * It is sticky, and it is present for the whole run — during streaming and
 * on the finished report alike. v2.0 rendered this once at the top and let
 * it scroll away, so by the time a report was long enough to need judging,
 * the thing being judged and the question being asked were both off-screen.
 * Reading a finding without the material next to it is how an audit gets
 * misread, and this tool's whole claim is that its output can be trusted at
 * a glance.
 */
export function ContextPanel({
  screenshots,
  conceptText,
  taskScenario,
  audience,
  frameworks,
}: ContextPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const concept = conceptText.trim();
  const hasVisuals = screenshots.length > 0;
  const audienceLabel = AUDIENCES.find((a) => a.id === audience)?.label ?? audience;
  const frameworkLabels = frameworks
    .map((f) => FRAMEWORKS.find((fw) => fw.id === f)?.label ?? f)
    .join(" · ");

  // Long concepts collapse so the panel can stay pinned without eating the
  // viewport. The operator decides when they need the full text.
  const CLAMP = 260;
  const isLong = concept.length > CLAMP;
  const conceptShown = expanded || !isLong ? concept : concept.slice(0, CLAMP) + "…";

  return (
    <div className="sticky top-0 z-20 -mx-6 px-6 pt-3 pb-3 mb-5 bg-surface-0/95 backdrop-blur-md border-b border-border">
      {/* Material */}
      <div className="mb-2.5">
        {hasVisuals && (
          <div className="flex gap-2 flex-wrap mb-2">
            {screenshots.map((s, i) => (
              <div
                key={s.id}
                className="relative rounded-lg overflow-hidden border border-border/50"
              >
                <img
                  src={s.dataUrl}
                  alt={`Screen ${i + 1}`}
                  className="h-14 w-auto block opacity-70"
                />
                <div className="absolute bottom-0.5 left-1 bg-black/70 rounded px-1 py-px text-[9px] font-bold text-accent">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {concept && (
          <div className="px-3.5 py-2.5 rounded-lg bg-white/[0.02] border border-border">
            <div className="text-[10px] font-semibold text-text-tertiary tracking-wider mb-1.5">
              {hasVisuals ? "CONCEPT DESCRIPTION" : "CONCEPT DESCRIPTION · NO VISUALS"}
            </div>
            <div className="text-[12px] text-white/65 leading-relaxed whitespace-pre-wrap">
              {conceptShown}
            </div>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 text-[11px] font-semibold text-accent/80 hover:text-accent cursor-pointer transition-colors"
              >
                {expanded ? "Show less" : "Show full description"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* The request */}
      <div className="flex gap-2.5 flex-wrap items-center text-[11px] text-text-tertiary">
        <span>
          {hasVisuals
            ? `📸 ${screenshots.length} screen${screenshots.length !== 1 ? "s" : ""}`
            : "📝 Concept only"}
        </span>
        <span className="text-white/[0.08]">|</span>
        <span>🎯 {audienceLabel}</span>
        <span className="text-white/[0.08]">|</span>
        <span>🔬 {frameworkLabels}</span>
      </div>

      {taskScenario && (
        <div className="mt-2 text-[11px] text-white/50 leading-relaxed">
          <span className="font-semibold text-text-tertiary">Task · </span>
          {taskScenario}
        </div>
      )}
    </div>
  );
}
