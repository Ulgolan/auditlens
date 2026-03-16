"use client";

import { useState, useRef, useEffect } from "react";
import type { Screenshot, EvalPhase } from "@/lib/types";
import { FRAMEWORKS, AUDIENCES } from "@/lib/types";
import { DropZone } from "@/components/drop-zone";
import { FrameworkToggles } from "@/components/framework-toggles";
import { AudienceSelector } from "@/components/audience-selector";
import { StreamingIndicator, GradeCard } from "@/components/grade-card";
import { ReportRenderer } from "@/components/report-renderer";

export default function Home() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [taskScenario, setTaskScenario] = useState("");
  const [audience, setAudience] = useState("consumer");
  const [frameworks, setFrameworks] = useState<string[]>(
    FRAMEWORKS.filter((f) => f.default).map((f) => f.id)
  );
  const [evalPhase, setEvalPhase] = useState<EvalPhase>("idle");
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reportEndRef = useRef<HTMLDivElement>(null);

  const processScreenshot = (s: Screenshot): Promise<{ data: string; mediaType: string }> => {
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        const widthRatio = MAX_WIDTH / width;
        const heightRatio = MAX_HEIGHT / height;
        const ratio = Math.min(widthRatio, heightRatio, 1);

        const targetWidth = Math.round(width * ratio);
        const targetHeight = Math.round(height * ratio);

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Image compression failed"));
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result;
              if (typeof result !== "string") {
                reject(new Error("Failed to read compressed image"));
                return;
              }

              const base64 = result.split(",")[1] || "";
              resolve({
                data: base64,
                mediaType: "image/jpeg",
              });
            };
            reader.onerror = () => reject(new Error("Failed to read compressed image"));
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.8
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = s.dataUrl;
    });
  };

  const isEvaluating = evalPhase !== "idle" && evalPhase !== "done" && evalPhase !== "error";
  const canEvaluate = screenshots.length > 0 && frameworks.length > 0 && !isEvaluating;
  const showInput = evalPhase === "idle";
  const showReport = evalPhase !== "idle";

  // Auto-scroll during streaming
  useEffect(() => {
    if (evalPhase === "streaming" && reportEndRef.current) {
      reportEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [report, evalPhase]);

  const runEvaluation = async () => {
    if (!canEvaluate) return;

    setEvalPhase("uploading");
    setReport("");
    setError(null);

    try {
      const images = await Promise.all(screenshots.map((s) => processScreenshot(s)));

      setEvalPhase("analyzing");

      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          taskScenario,
          audience,
          frameworks,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${response.status}`);
      }

      setEvalPhase("streaming");

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                fullText += parsed.delta.text;
                setReport(fullText);
              }
            } catch {
              // Skip unparseable chunks
            }
          }
        }
      }

      setReport(fullText);
      setEvalPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setEvalPhase("error");
    }
  };

  const resetAll = () => {
    setScreenshots([]);
    setTaskScenario("");
    setReport("");
    setError(null);
    setEvalPhase("idle");
  };

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Header */}
      <header className="px-8 py-4 border-b border-border flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center text-base">
            🔎
          </div>
          <div>
            <span className="text-base font-bold tracking-tight">AuditLens</span>
            <span className="text-[11px] text-text-tertiary ml-2 font-mono">v1.0</span>
          </div>
        </div>
        {showReport && (
          <button
            onClick={resetAll}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] border border-border text-text-secondary cursor-pointer hover:bg-white/[0.06] hover:text-text-primary transition-all"
          >
            ← New Audit
          </button>
        )}
      </header>

      <main className="max-w-[860px] mx-auto px-6 py-8">
        {/* ═══ INPUT PANEL ═══ */}
        {showInput && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <div className="text-center mb-10">
              <h1 className="text-[28px] font-bold tracking-tight mb-2">
                Upload. Evaluate. Ship better.
              </h1>
              <p className="text-sm text-text-tertiary max-w-[480px] mx-auto">
                Drop your screenshots. Select your frameworks. Get a senior-grade UX audit with
                actionable fixes and metrics.
              </p>
            </div>

            {/* Screenshots */}
            <div className="mb-7">
              <label className="text-xs font-semibold text-text-tertiary tracking-wider mb-2 block">
                SCREENSHOTS
              </label>
              <DropZone
                screenshots={screenshots}
                onAdd={(s) => setScreenshots((prev) => [...prev, s])}
                onRemove={(id) => setScreenshots((prev) => prev.filter((s) => s.id !== id))}
              />
            </div>

            {/* Task Scenario */}
            <div className="mb-7">
              <label className="text-xs font-semibold text-text-tertiary tracking-wider mb-2 block">
                TASK SCENARIO{" "}
                <span className="font-normal text-white/20">· optional but recommended</span>
              </label>
              <textarea
                value={taskScenario}
                onChange={(e) => setTaskScenario(e.target.value)}
                placeholder="What is the user trying to accomplish? e.g., 'First-time user trying to send their first message' or 'Returning user checking out with items in cart'"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/[0.02] border border-border text-white/85 resize-y leading-relaxed outline-none transition-colors focus:border-accent-border"
              />
            </div>

            {/* Audience */}
            <div className="mb-7">
              <label className="text-xs font-semibold text-text-tertiary tracking-wider mb-2 block">
                AUDIENCE CONTEXT
              </label>
              <AudienceSelector selected={audience} onChange={setAudience} />
            </div>

            {/* Frameworks */}
            <div className="mb-9">
              <label className="text-xs font-semibold text-text-tertiary tracking-wider mb-2 block">
                EVALUATION FRAMEWORKS
              </label>
              <FrameworkToggles selected={frameworks} onChange={setFrameworks} />
            </div>

            {/* Run Button */}
            <button
              onClick={runEvaluation}
              disabled={!canEvaluate}
              className={`
                w-full py-3.5 px-6 rounded-xl text-[15px] font-bold tracking-tight transition-all duration-200
                ${canEvaluate
                  ? "bg-gradient-to-r from-accent/90 to-accent/70 text-surface-0 cursor-pointer shadow-[0_4px_24px_rgba(45,212,191,0.15)] hover:shadow-[0_4px_32px_rgba(45,212,191,0.25)]"
                  : "bg-white/[0.04] text-white/15 cursor-not-allowed"
                }
              `}
            >
              {canEvaluate
                ? `Run Audit · ${frameworks.length} framework${frameworks.length !== 1 ? "s" : ""}`
                : "Upload at least one screenshot to begin"}
            </button>
          </div>
        )}

        {/* ═══ REPORT PANEL ═══ */}
        {showReport && (
          <div className="animate-[fadeIn_0.3s_ease]">
            {/* Context summary */}
            <div className="flex gap-3 flex-wrap mb-5 px-4 py-3 bg-white/[0.02] rounded-xl border border-border text-xs text-text-tertiary">
              <span>📸 {screenshots.length} screen{screenshots.length !== 1 ? "s" : ""}</span>
              <span className="text-white/[0.08]">|</span>
              <span>🎯 {AUDIENCES.find((a) => a.id === audience)?.label}</span>
              <span className="text-white/[0.08]">|</span>
              <span>
                🔬{" "}
                {frameworks
                  .map((f) => FRAMEWORKS.find((fw) => fw.id === f)?.label)
                  .join(" · ")}
              </span>
              {taskScenario && (
                <>
                  <span className="text-white/[0.08]">|</span>
                  <span>
                    📝 {taskScenario.length > 60 ? taskScenario.slice(0, 60) + "..." : taskScenario}
                  </span>
                </>
              )}
            </div>

            {/* Screenshot thumbnails */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {screenshots.map((s, i) => (
                <div
                  key={s.id}
                  className="relative rounded-lg overflow-hidden border border-border/50"
                >
                  <img
                    src={s.dataUrl}
                    alt={`Screen ${i + 1}`}
                    className="h-16 w-auto block opacity-70"
                  />
                  <div className="absolute bottom-0.5 left-1 bg-black/70 rounded px-1 py-px text-[9px] font-bold text-accent">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Streaming indicator */}
            {isEvaluating && <StreamingIndicator phase={evalPhase} />}

            {/* Error */}
            {error && (
              <div className="px-5 py-4 bg-critical-dim border border-critical/20 rounded-xl mb-5">
                <div className="text-sm font-semibold text-critical mb-1">Evaluation failed</div>
                <div className="text-[13px] text-white/60">{error}</div>
                <button
                  onClick={resetAll}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] border border-border text-text-secondary cursor-pointer hover:bg-white/[0.06] transition-all"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Grade card — only after streaming done */}
            {evalPhase === "done" && report && <GradeCard report={report} />}

            {/* Report content */}
            {report && (
              <div className="px-7 py-6 bg-white/[0.015] border border-border rounded-2xl">
                <ReportRenderer content={report} />
                <div ref={reportEndRef} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
