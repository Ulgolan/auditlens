"use client";

// ═══════════════════════════════════════════════════════
// GRADE CARD
// ═══════════════════════════════════════════════════════

interface GradeCardProps {
  report: string;
}

export function GradeCard({ report }: GradeCardProps) {
  if (!report) return null;

  // Parse grade from report
  const gradeMatch =
    report.match(/(?:Overall|Letter)\s*Grade[:\s]*\*?\*?\s*([A-F][+\-]?)/i) ||
    report.match(/Grade[:\s]*\*?\*?\s*([A-F][+\-]?)\b/i) ||
    report.match(/\*\*([A-F][+\-]?)\*\*/);
  const grade = gradeMatch ? gradeMatch[1] : "—";

  // Count severity badges
  const criticalCount = (report.match(/🔴/g) || []).length;
  const minorCount = (report.match(/⚠️/g) || []).length;
  const passCount = (report.match(/✅/g) || []).length;

  const gradeColor = grade.startsWith("A")
    ? "text-pass"
    : grade.startsWith("B")
    ? "text-blue-400"
    : grade.startsWith("C")
    ? "text-minor"
    : "text-critical";

  return (
    <div className="flex gap-5 px-6 py-5 bg-white/[0.02] border border-border rounded-2xl mb-6 items-center flex-wrap animate-[fadeIn_0.4s_ease]">
      <div className="text-center min-w-[80px]">
        <div className={`text-5xl font-extrabold leading-none font-display ${gradeColor}`}>
          {grade}
        </div>
        <div className="text-[10px] text-text-tertiary mt-1 font-semibold tracking-wider">
          OVERALL
        </div>
      </div>

      <div className="w-px h-[60px] bg-border" />

      <div className="flex gap-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-critical">{criticalCount}</div>
          <div className="text-[10px] text-text-tertiary font-medium">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-minor">{minorCount}</div>
          <div className="text-[10px] text-text-tertiary font-medium">Minor</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-pass">{passCount}</div>
          <div className="text-[10px] text-text-tertiary font-medium">Pass</div>
        </div>
      </div>
    </div>
  );
}
