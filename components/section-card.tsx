"use client";

import type { ReportSection } from "@/lib/types";
import { describeSection } from "@/lib/report-status";
import { ReportRenderer } from "@/components/report-renderer";

interface SectionCardProps {
  section: ReportSection;
  onRetry?: () => void;
  /** True while any section is running — retry is disabled meanwhile. */
  busy?: boolean;
  /**
   * Drop the card's own border, radius and bottom margin. Used when the
   * card sits inside a container that already draws them — the Overall
   * collapsible — so the two frames don't double up.
   */
  flush?: boolean;
}

/**
 * Renders one framework section.
 *
 * A section that did not complete says so, in its own card, above its
 * own content. The operator should never have to compare the report
 * against the framework list to work out that something is missing.
 */
export function SectionCard({ section, onRetry, busy, flush }: SectionCardProps) {
  const { status, label, text } = section;

  // The wording lives in lib/report-status so the exported document
  // declares an incomplete section in exactly these words.
  const declaration = describeSection(section);

  return (
    <div
      className={`px-10 py-8 bg-card ${
        flush
          ? ""
          : `mb-4 rounded-card border ${
              status === "failed"
                ? "border-critical border-l-[4px]"
                : status === "truncated"
                ? "border-minor border-l-[4px]"
                : "border-border"
            }`
      }`}
    >
      {/* The reading column. Capped at a measure rather than filling the
          card: the shell has to be wide enough for the thumbnails, grade
          card and tab bar, but a 90ch line is a wall of text. The cap is
          in ch so it tracks the font size instead of a pixel guess. */}
      <div className="mx-auto max-w-[74ch]">
      {/* Declaration banner — only when the section is not trustworthy.
          Severity is carried by the fill, the left rule and the icon. The
          words stay navy: vermilion at 13px is 3.6:1 on white and yellow
          is worse, and this tool does not get to ship a contrast failure
          on the one element that must always be read. */}
      {declaration && (
        <div
          className={`flex gap-3 px-4 py-3 mb-5 rounded-xl border border-l-[4px] ${
            status === "failed"
              ? "bg-critical-dim border-critical"
              : "bg-minor-dim border-minor"
          }`}
        >
          <span className="text-base leading-none mt-px">
            {status === "failed" ? "🔴" : "⚠️"}
          </span>
          <div>
            <div className="text-[16px] font-bold mb-0.5 text-text-primary">
              {declaration.headline}
            </div>
            {declaration.detail && (
              <div className="text-[15px] text-text-secondary leading-relaxed">
                {declaration.detail}
              </div>
            )}
            <div className="text-[15px] text-text-secondary leading-relaxed mt-1">
              {declaration.caution}
            </div>

            {onRetry && (
              <button
                onClick={onRetry}
                disabled={busy}
                className={`font-mono mt-3 rounded-pill border px-4 py-[0.6em] text-[0.82rem] font-medium uppercase tracking-[0.1em] transition-transform duration-150 ${
                  busy
                    ? "border-border text-text-tertiary cursor-not-allowed"
                    : "border-border-strong text-text-primary cursor-pointer hover:-translate-y-[2px]"
                }`}
              >
                {busy ? "Audit running..." : `↻ Retry ${label}`}
              </button>
            )}
          </div>
        </div>
      )}

      {text ? (
        <ReportRenderer content={text} />
      ) : (
        <div className="font-voice text-[16px] text-text-tertiary">
          No content was produced for this section.
        </div>
      )}

      {status === "streaming" && (
        <div className="flex items-center gap-2 mt-4 text-[15px] text-text-secondary">
          <div
            className="w-3 h-3 rounded-full border-2 border-border border-t-navy"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
          Evaluating {label}...
        </div>
      )}
      </div>
    </div>
  );
}
