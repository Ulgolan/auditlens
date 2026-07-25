"use client";

import { useState, useRef, useEffect } from "react";
import type { Screenshot, EvalPhase, ReportSection, SectionStatus } from "@/lib/types";
import { FRAMEWORKS, AUDIENCES, OVERALL_ID } from "@/lib/types";
import { ContextPanel } from "@/components/context-panel";
import { DropZone } from "@/components/drop-zone";
import { FrameworkToggles } from "@/components/framework-toggles";
import { AudienceSelector } from "@/components/audience-selector";
import { GradeCard } from "@/components/grade-card";
import { SectionCard } from "@/components/section-card";
import { SectionTabs } from "@/components/section-tabs";
import { OverallPanel } from "@/components/overall-panel";
import { FrameworkProgress } from "@/components/framework-progress";

interface ProcessedImage {
  data: string;
  mediaType: string;
}

/**
 * Assemble the report text handed to the final Overall pass.
 * Incomplete sections are labelled explicitly so the model synthesises
 * from what actually exists rather than inferring the gaps.
 */
function assembleForOverall(sections: ReportSection[]): string {
  return sections
    .map((s) => {
      if (s.status === "complete") return s.text;
      if (s.status === "truncated") {
        return `${s.text}\n\n[SECTION INCOMPLETE — the ${s.label} evaluation was cut off before it finished. Do not infer what the rest would have said.]`;
      }
      return `## ${s.label}\n\n[SECTION MISSING — the ${s.label} evaluation did not produce a result.]`;
    })
    .join("\n\n");
}

export default function Home() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [conceptText, setConceptText] = useState("");
  const [taskScenario, setTaskScenario] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[0].id);
  const [frameworks, setFrameworks] = useState<string[]>(
    FRAMEWORKS.filter((f) => f.default).map((f) => f.id)
  );
  const [evalPhase, setEvalPhase] = useState<EvalPhase>("idle");
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  /** Which framework tab is in focus. Empty until a run starts. */
  const [activeTab, setActiveTab] = useState<string>("");
  const [overallOpen, setOverallOpen] = useState(true);
  const reportEndRef = useRef<HTMLDivElement>(null);
  const sectionAnchorRef = useRef<HTMLDivElement>(null);

  /**
   * Screenshots are compressed once per audit and kept here so a
   * per-section retry can reuse them instead of recompressing.
   */
  const imagesRef = useRef<ProcessedImage[] | null>(null);

  /** Mirror of `sections` so retry can read the latest state synchronously. */
  const sectionsRef = useRef<ReportSection[]>([]);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const processScreenshot = (s: Screenshot): Promise<ProcessedImage> => {
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const width = img.width;
        const height = img.height;

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
              resolve({ data: base64, mediaType: "image/jpeg" });
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

  const isEvaluating = evalPhase === "processing" || evalPhase === "running";

  /**
   * Material can be screenshots, a written concept, or both. There is no
   * mode switch anywhere in this app on purpose — the mode is whatever
   * the operator actually supplied, so the UI and the route can never
   * disagree about which one is running.
   */
  const concept = conceptText.trim();
  const hasVisuals = screenshots.length > 0;
  const hasMaterial = hasVisuals || concept.length > 0;
  const canEvaluate = hasMaterial && frameworks.length > 0 && !isEvaluating;
  const showInput = evalPhase === "idle";
  const showReport = evalPhase !== "idle";

  /**
   * While a run is in flight, follow whichever section is streaming.
   *
   * Replaces v2.0's scroll-to-bottom: with one section on screen at a
   * time there is no bottom to chase, and an operator watching a run
   * wants the tab to move with the work rather than having to click
   * along behind it. Once the run stops, the tab stays where the
   * operator last put it.
   */
  useEffect(() => {
    if (evalPhase !== "running") return;
    const streaming = sections.find(
      (s) => s.status === "streaming" && s.id !== OVERALL_ID
    );
    if (streaming && streaming.id !== activeTab) setActiveTab(streaming.id);
  }, [sections, evalPhase, activeTab]);

  /**
   * Run a single section and stream it into state.
   *
   * The critical difference from v1: this reads `stop_reason` off the
   * message_delta event. v1 parsed that event and dropped it on the
   * floor, which is why a truncated report looked identical to a
   * complete one.
   */
  const runSection = async (
    index: number,
    section: ReportSection,
    images: ProcessedImage[],
    priorReport?: string
  ): Promise<ReportSection> => {
    const { id, label } = section;

    const patch = (p: Partial<ReportSection>) =>
      setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...p } : s)));

    patch({ status: "streaming", text: "", detail: undefined });

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: id === OVERALL_ID ? [] : images,
          conceptText: id === OVERALL_ID ? "" : concept,
          // The overall pass gets handed the assembled report and no
          // material, so it cannot work the mode out for itself.
          visualsPresent: images.length > 0,
          taskScenario,
          audience,
          framework: id,
          priorReport,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let stopReason: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (
              parsed.type === "content_block_delta" &&
              parsed.delta?.type === "text_delta"
            ) {
              fullText += parsed.delta.text;
              patch({ text: fullText });
            }

            // THE fix for v1's silent truncation: this event carries
            // why generation stopped. Capture it.
            if (parsed.type === "message_delta" && parsed.delta?.stop_reason) {
              stopReason = parsed.delta.stop_reason;
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }

      let status: SectionStatus;
      let detail: string | undefined;

      if (stopReason === "end_turn") {
        status = "complete";
      } else if (stopReason === "max_tokens") {
        status = "truncated";
        detail = "The model hit its output limit before finishing this section.";
      } else if (stopReason === "refusal") {
        status = "failed";
        detail = "The model declined to produce this section.";
      } else if (stopReason === null) {
        // Stream ended with no completion signal. In v1 this silently
        // passed as success.
        status = "truncated";
        detail =
          "The stream ended without a completion signal — the connection dropped or the request timed out.";
      } else {
        status = "truncated";
        detail = `The model stopped unexpectedly (${stopReason}).`;
      }

      if (status !== "failed" && fullText.trim().length === 0) {
        status = "failed";
        detail = "The model returned no content for this section.";
      }

      patch({ text: fullText, status, detail });
      return { id, label, text: fullText, status, detail };
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      patch({ status: "failed", detail });
      return { id, label, text: "", status: "failed", detail };
    }
  };

  const runEvaluation = async () => {
    if (!canEvaluate) return;

    setEvalPhase("processing");
    setError(null);

    const initial: ReportSection[] = frameworks.map((id) => ({
      id,
      label: FRAMEWORKS.find((f) => f.id === id)?.label ?? id,
      text: "",
      status: "pending" as SectionStatus,
    }));
    initial.push({
      id: OVERALL_ID,
      label: "Overall Assessment",
      text: "",
      status: "pending",
    });
    setSections(initial);
    setActiveTab(initial[0]?.id ?? "");
    setOverallOpen(true);

    try {
      const images = await Promise.all(screenshots.map((s) => processScreenshot(s)));
      imagesRef.current = images;

      setEvalPhase("running");

      // Frameworks run sequentially. Each gets its own request, its own
      // duration budget, and its own completion status.
      const completed: ReportSection[] = [];
      for (let i = 0; i < initial.length - 1; i++) {
        completed.push(await runSection(i, initial[i], images));
      }

      // Final pass synthesises from whatever actually completed.
      const overallIndex = initial.length - 1;
      await runSection(
        overallIndex,
        initial[overallIndex],
        images,
        assembleForOverall(completed)
      );

      setEvalPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setEvalPhase("error");
    }
  };

  /**
   * Re-run one section, then recompute the Overall pass.
   *
   * The recompute is not optional. A retried section that succeeds
   * changes what the audit says; leaving the old Overall in place would
   * either strand a withheld grade over a now-complete audit, or show a
   * letter grade derived from text that no longer exists. Either one is
   * the same class of dishonesty this phase exists to remove.
   */
  const retrySection = async (id: string) => {
    // Concept-only audits store an empty array here, not null — the
    // difference between "no images in this audit" and "material is gone"
    // is what makes retry work in text mode.
    const images = imagesRef.current;
    if (!images) {
      setError("The audit material is no longer available for retry. Start a new audit.");
      setEvalPhase("error");
      return;
    }

    const current = sectionsRef.current;
    const index = current.findIndex((s) => s.id === id);
    const overallIndex = current.findIndex((s) => s.id === OVERALL_ID);
    if (index < 0) return;

    setError(null);
    setEvalPhase("running");

    try {
      if (id === OVERALL_ID) {
        const frameworkResults = current.filter((s) => s.id !== OVERALL_ID);
        await runSection(
          index,
          current[index],
          images,
          assembleForOverall(frameworkResults)
        );
      } else {
        // Invalidate the Overall immediately — the grade it produced is
        // now stale, and it should visibly go away rather than linger.
        if (overallIndex >= 0) {
          setSections((prev) =>
            prev.map((s, i) =>
              i === overallIndex
                ? { ...s, status: "pending", text: "", detail: undefined }
                : s
            )
          );
        }

        const retried = await runSection(index, current[index], images);

        if (overallIndex >= 0) {
          const frameworkResults = current
            .filter((s) => s.id !== OVERALL_ID)
            .map((s) => (s.id === id ? retried : s));
          await runSection(
            overallIndex,
            current[overallIndex],
            images,
            assembleForOverall(frameworkResults)
          );
        }
      }

      setEvalPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setEvalPhase("error");
    }
  };

  /**
   * Export the report as a self-contained client document.
   *
   * Nothing is filtered or tidied on the way out — the document renders the
   * same components, off the same sections, through the same completeness
   * module. A partial audit exports as visibly partial, or this button is
   * the biggest liability in the tool.
   */
  const exportReport = async () => {
    setExporting(true);
    setError(null);
    try {
      const { downloadReport } = await import("@/lib/export-document");
      await downloadReport({
        sections,
        screenshotUrls: screenshots.map((s) => s.dataUrl),
        conceptText,
        taskScenario,
        audienceLabel: AUDIENCES.find((a) => a.id === audience)?.label ?? audience,
        frameworkLabels: frameworks
          .map((id) => FRAMEWORKS.find((f) => f.id === id)?.label ?? id)
          .join(" · "),
      });
    } catch (err) {
      setError(
        `The report could not be exported: ${
          err instanceof Error ? err.message : "unknown error"
        }`
      );
    } finally {
      setExporting(false);
    }
  };

  const canExport = sections.some((s) => s.text.trim().length > 0) && !isEvaluating;

  const overallSection = sections.find((s) => s.id === OVERALL_ID);
  // Queued frameworks stay out of the tab bar until they have started —
  // a tab that opens onto nothing is worse than no tab.
  const visibleFrameworkSections = sections.filter(
    (s) => s.id !== OVERALL_ID && s.status !== "pending"
  );
  const activeSection =
    visibleFrameworkSections.find((s) => s.id === activeTab) ??
    visibleFrameworkSections[0];

  /** Tabs double as anchors: selecting one brings the section into view. */
  const selectTab = (id: string) => {
    setActiveTab(id);
    sectionAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetAll = () => {
    setScreenshots([]);
    setConceptText("");
    setTaskScenario("");
    setSections([]);
    setError(null);
    setEvalPhase("idle");
    imagesRef.current = null;
  };

  return (
    <div className="min-h-screen bg-ground">
      {/* Header — north-star as the product mark, lockup per the brand kit. */}
      <header className="px-6 py-4 border-b border-border bg-card">
        <div className="max-w-[960px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-[11px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/motifs/north-star.svg" alt="" className="h-7 w-7 flex-none" />
          <div className="leading-[1.1]">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-text-tertiary">
              UX Evaluation
            </div>
            <div className="font-display text-[0.95rem] font-extrabold text-text-primary">
              AuditLens
              <span className="font-mono text-[0.6rem] font-normal text-text-tertiary ml-2 tracking-[0.08em]">
                v2.0
              </span>
            </div>
          </div>
        </div>
        {showReport && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={exportReport}
              disabled={!canExport || exporting}
              className={`font-mono rounded-pill px-4 py-[0.7em] text-[0.68rem] font-medium uppercase tracking-[0.1em] transition-transform duration-150 ${
                canExport && !exporting
                  ? "bg-accent text-ivory cursor-pointer hover:-translate-y-[2px]"
                  : "border border-border text-text-tertiary cursor-not-allowed"
              }`}
            >
              {exporting ? "Preparing…" : "Export report ↓"}
            </button>
            <button
              onClick={resetAll}
              className="font-mono rounded-pill border border-border-strong px-4 py-[0.7em] text-[0.68rem] font-medium uppercase tracking-[0.1em] text-text-primary cursor-pointer transition-transform duration-150 hover:-translate-y-[2px]"
            >
              ← New audit
            </button>
          </div>
        )}
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-6 py-8">
        {/* ═══ INPUT PANEL ═══ */}
        {showInput && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <div className="text-center mb-10">
              <h1 className="font-display text-[30px] font-extrabold text-text-primary mb-2">
                Show it or describe it. Then ship better.
              </h1>
              <p className="font-voice text-[1.02rem] leading-[1.45] text-text-secondary max-w-[520px] mx-auto">
                Drop screenshots, write out the concept, or both. Select your frameworks. Get a
                senior-grade UX audit with actionable fixes and metrics.
              </p>
            </div>

            {/* Screenshots */}
            <div className="mb-5">
              <label className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.16em] text-text-primary mb-2 block">
                SCREENSHOTS{" "}
                <span className="font-normal normal-case tracking-normal text-text-tertiary">
                  · optional if you describe the concept below
                </span>
              </label>
              <DropZone
                screenshots={screenshots}
                onAdd={(s) => setScreenshots((prev) => [...prev, s])}
                onRemove={(id) => setScreenshots((prev) => prev.filter((s) => s.id !== id))}
              />
            </div>

            {/* Concept description */}
            <div className="mb-7">
              <label className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.16em] text-text-primary mb-2 block">
                CONCEPT DESCRIPTION{" "}
                <span className="font-normal normal-case tracking-normal text-text-tertiary">
                  {hasVisuals
                    ? "· optional — explains what happens between screens"
                    : "· audit an idea with no visuals yet"}
                </span>
              </label>
              <textarea
                value={conceptText}
                onChange={(e) => setConceptText(e.target.value)}
                placeholder={
                  "Describe the idea or flow in prose. The more concrete, the sharper the audit.\n\ne.g. 'A returning customer opens the app and lands on a saved-orders list. Tapping an order opens a detail view with a Reorder button. Reorder skips straight to payment using the stored card, showing a confirmation sheet with the total and a 5-second undo window before the order is placed.'"
                }
                rows={7}
                className="w-full px-4 py-3 rounded-xl text-sm bg-field border border-border text-text-primary resize-y leading-relaxed outline-none transition-colors focus:border-navy"
              />
              {!hasVisuals && concept.length > 0 && (
                <div className="mt-2 px-3.5 py-2.5 rounded-lg bg-minor-dim border-l-[3px] border border-minor text-[11px] text-text-secondary leading-relaxed">
                  <span className="font-semibold text-text-primary">Concept mode.</span> With no
                  visuals, anything measured — contrast, target sizes, text size, focus rings,
                  visual hierarchy — cannot be assessed, and the report will say so rather than
                  guess. Accessibility narrows to what the description itself commits to.
                </div>
              )}
            </div>

            {/* Task Scenario */}
            <div className="mb-7">
              <label className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.16em] text-text-primary mb-2 block">
                TASK SCENARIO{" "}
                <span className="font-normal normal-case tracking-normal text-text-tertiary">· optional but recommended</span>
              </label>
              <textarea
                value={taskScenario}
                onChange={(e) => setTaskScenario(e.target.value)}
                placeholder="What is the user trying to accomplish? e.g., 'First-time user trying to send their first message' or 'Returning user checking out with items in cart'"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm bg-field border border-border text-text-primary resize-y leading-relaxed outline-none transition-colors focus:border-navy"
              />
            </div>

            {/* Audience */}
            <div className="mb-7">
              <label className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.16em] text-text-primary mb-2 block">
                AUDIENCE CONTEXT
              </label>
              <AudienceSelector selected={audience} onChange={setAudience} />
            </div>

            {/* Frameworks */}
            <div className="mb-9">
              <label className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.16em] text-text-primary mb-2 block">
                EVALUATION FRAMEWORKS
              </label>
              <FrameworkToggles selected={frameworks} onChange={setFrameworks} />
            </div>

            {/* Run Button */}
            <button
              onClick={runEvaluation}
              disabled={!canEvaluate}
              className={`
                font-mono w-full py-[1.15em] px-6 rounded-pill text-[0.78rem] font-medium uppercase tracking-[0.12em] transition-transform duration-150
                ${canEvaluate
                  ? "bg-accent text-ivory cursor-pointer hover:-translate-y-[2px]"
                  : "border border-border text-text-tertiary cursor-not-allowed"
                }
              `}
            >
              {canEvaluate
                ? `Run Audit · ${frameworks.length} framework${frameworks.length !== 1 ? "s" : ""}`
                : !hasMaterial
                ? "Add a screenshot or describe the concept to begin"
                : "Select at least one framework to begin"}
            </button>
          </div>
        )}

        {/* ═══ REPORT PANEL ═══ */}
        {showReport && (
          <div className="animate-[fadeIn_0.3s_ease]">
            {/* Request + material, pinned for the whole run */}
            <ContextPanel
              screenshots={screenshots}
              conceptText={conceptText}
              taskScenario={taskScenario}
              audience={audience}
              frameworks={frameworks}
            />

            {/* Per-framework progress */}
            {(isEvaluating || sections.some((s) => s.status === "streaming")) && (
              <FrameworkProgress
                sections={sections}
                preparing={evalPhase === "processing"}
              />
            )}

            {/* Error */}
            {error && (
              <div className="px-5 py-4 bg-critical-dim border border-critical border-l-[3px] rounded-xl mb-5">
                <div className="text-sm font-bold text-critical mb-1">Evaluation failed</div>
                <div className="text-[13px] text-text-secondary">{error}</div>
                <button
                  onClick={resetAll}
                  className="font-mono mt-3 rounded-pill border border-border-strong px-4 py-[0.6em] text-[0.66rem] font-medium uppercase tracking-[0.1em] text-text-primary cursor-pointer transition-transform duration-150 hover:-translate-y-[2px]"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Grade card — suppressed unless every section completed */}
            {evalPhase === "done" && <GradeCard sections={sections} />}

            {/* Overall, directly under the grade, open by default */}
            {overallSection && overallSection.status !== "pending" && (
              <OverallPanel
                section={overallSection}
                open={overallOpen}
                onToggle={() => setOverallOpen((v) => !v)}
                onRetry={() => retrySection(overallSection.id)}
                busy={isEvaluating}
              />
            )}

            {/* One framework at a time, reached by the sticky tab bar */}
            <div ref={sectionAnchorRef} className="scroll-mt-24" />
            <SectionTabs
              sections={visibleFrameworkSections}
              activeId={activeSection?.id ?? ""}
              onSelect={selectTab}
            />
            {activeSection && (
              <SectionCard
                key={activeSection.id}
                section={activeSection}
                onRetry={() => retrySection(activeSection.id)}
                busy={isEvaluating}
              />
            )}
            <div ref={reportEndRef} />
          </div>
        )}
      </main>
    </div>
  );
}
