"use client";

import React from "react";

interface ReportRendererProps {
  content: string;
}

export function ReportRenderer({ content }: ReportRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="text-sm leading-7 text-text-secondary">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith("# "))
          return (
            <h1
              key={i}
              className="font-display text-[22px] font-extrabold text-text-primary mt-8 mb-3 border-b border-border pb-2"
            >
              {cleanMarkdown(trimmed.slice(2))}
            </h1>
          );

        if (trimmed.startsWith("## "))
          return (
            <h2 key={i} className="font-display text-[17px] font-bold text-text-primary mt-7 mb-2.5">
              {cleanMarkdown(trimmed.slice(3))}
            </h2>
          );

        if (trimmed.startsWith("### "))
          return (
            <h3 key={i} className="text-[15px] font-semibold text-text-primary mt-6 mb-2">
              {cleanMarkdown(trimmed.slice(4))}
            </h3>
          );

        if (trimmed.startsWith("#### "))
          return (
            <h4 key={i} className="text-sm font-semibold text-text-secondary mt-4 mb-1.5">
              {cleanMarkdown(trimmed.slice(5))}
            </h4>
          );

        // Blockquotes (recommendations)
        if (trimmed.startsWith("> "))
          return (
            <div
              key={i}
              className="font-voice border-l-[3px] border-navy pl-4 my-2 text-text-secondary text-[13.5px]"
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
          <span key={keyIdx++}>{highlightBadges(remaining.slice(0, boldMatch.index))}</span>
        );
      }
      parts.push(
        <strong key={keyIdx++} className="text-text-primary font-bold">
          {highlightBadges(boldMatch[1])}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(<span key={keyIdx++}>{highlightBadges(remaining)}</span>);
      break;
    }
  }

  return parts;
}

function highlightBadges(text: string): string {
  return text
    .replace(/\(P\)/g, "⟨P⟩")
    .replace(/\(B\)/g, "⟨B⟩")
    .replace(/\(A\)/g, "⟨A⟩");
}
