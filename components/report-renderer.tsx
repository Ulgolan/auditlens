"use client";

import React from "react";
import { IconPass, IconMinor, IconCritical } from "@/components/icons";

interface ReportRendererProps {
  content: string;
}

export function ReportRenderer({ content }: ReportRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    // Body size drives the measure: the column is capped in ch, so raising
    // the type raises the line length in pixels while the character count
    // stays put. 19px here, up from 14px in v2.0 — the Commander's scale
    // ruling — with the shell widened to match so nothing gets squeezed.
    <div className="text-[19px] leading-[1.7] text-text-secondary">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith("# "))
          return (
            <h1
              key={i}
              className="font-display text-[28px] font-extrabold text-text-primary mt-8 mb-3 border-b border-border pb-2"
            >
              {cleanMarkdown(trimmed.slice(2))}
            </h1>
          );

        if (trimmed.startsWith("## "))
          return (
            <h2
              key={i}
              className="font-display text-[21px] font-bold text-text-primary mt-7 mb-2.5"
            >
              {cleanMarkdown(trimmed.slice(3))}
            </h2>
          );

        if (trimmed.startsWith("### "))
          return (
            <h3 key={i} className="text-[19px] font-semibold text-text-primary mt-6 mb-2">
              {cleanMarkdown(trimmed.slice(4))}
            </h3>
          );

        if (trimmed.startsWith("#### "))
          return (
            <h4
              key={i}
              className="text-[17px] font-semibold text-text-secondary mt-4 mb-1.5"
            >
              {cleanMarkdown(trimmed.slice(5))}
            </h4>
          );

        // Blockquotes (recommendations)
        if (trimmed.startsWith("> "))
          return (
            <div
              key={i}
              className="font-voice border-l-[3px] border-navy pl-4 my-2 text-text-secondary text-[17px]"
            >
              {formatInline(trimmed.slice(2))}
            </div>
          );

        // Unordered list items
        if (trimmed.startsWith("- ") || trimmed.startsWith("* "))
          return (
            <div key={i} className="pl-5 my-0.5 relative">
              <span className="absolute left-1.5 text-text-tertiary">·</span>
              {formatInline(trimmed.replace(/^[-*] /, ""))}
            </div>
          );

        // Ordered list items
        if (/^\d+\.\s/.test(trimmed))
          return (
            <div key={i} className="pl-5 my-0.5">
              {formatInline(trimmed)}
            </div>
          );

        // Empty lines
        if (trimmed === "") return <div key={i} className="h-2" />;

        // Horizontal rules
        if (trimmed === "---" || trimmed === "***")
          return <hr key={i} className="border-t border-border my-5" />;

        // Regular paragraphs
        return (
          <p key={i} className="my-1">
            {formatInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function cleanMarkdown(text: string): string {
  return text.replace(/\*\*/g, "");
}

function formatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(
          ...renderWithSeverityBadges(remaining.slice(0, boldMatch.index), `s${keyIdx++}`)
        );
      }
      parts.push(
        <strong key={keyIdx++} className="text-text-primary font-bold">
          {renderWithSeverityBadges(boldMatch[1], `s${keyIdx++}`)}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(...renderWithSeverityBadges(remaining, `s${keyIdx++}`));
      break;
    }
  }

  return parts;
}

function highlightBadges(text: string): string {
  return text.replace(/\(P\)/g, "⟨P⟩").replace(/\(B\)/g, "⟨B⟩").replace(/\(A\)/g, "⟨A⟩");
}

type Severity = "pass" | "minor" | "critical";

const SEVERITY_TOKEN = /\[PASS\]|\[MINOR\]|\[CRITICAL\]|✅|⚠️|🔴/g;
const SEVERITY_ICON: Record<Severity, typeof IconPass> = {
  pass: IconPass,
  minor: IconMinor,
  critical: IconCritical,
};
const SEVERITY_LABEL: Record<Severity, string> = {
  pass: "Pass",
  minor: "Minor",
  critical: "Critical",
};

function severityOf(token: string): Severity {
  if (token === "[PASS]" || token === "✅") return "pass";
  if (token === "[MINOR]" || token === "⚠️") return "minor";
  return "critical";
}

// Renders the [PASS]/[MINOR]/[CRITICAL] contract tokens as the severity
// icon set instead of leaking raw bracket text into the report prose. The
// legacy emoji are matched too, purely so a request already in flight
// when this shipped still renders correctly — see lib/report-status.ts.
function renderWithSeverityBadges(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = new RegExp(SEVERITY_TOKEN);
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-t${i++}`}>
          {highlightBadges(text.slice(lastIndex, match.index))}
        </span>
      );
    }
    const kind = severityOf(match[0]);
    const Icon = SEVERITY_ICON[kind];
    nodes.push(
      <span
        key={`${keyPrefix}-b${i++}`}
        className="inline-flex items-center align-text-bottom mx-0.5"
      >
        <Icon className="w-4 h-4 inline-block" />
        <span className="sr-only">{SEVERITY_LABEL[kind]}</span>
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <span key={`${keyPrefix}-t${i++}`}>{highlightBadges(text.slice(lastIndex))}</span>
    );
  }

  return nodes;
}
