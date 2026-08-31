import type { ReportSection } from "@/lib/types";
import { deriveCompleteness } from "@/lib/report-status";
import { GradeCard } from "@/components/grade-card";
import { SectionCard } from "@/components/section-card";

export interface ExportMeta {
  generatedAt: string;
  audienceLabel: string;
  frameworkLabels: string;
  taskScenario: string;
  conceptText: string;
  /** Base64 data URLs — already self-contained, so they travel with the file. */
  screenshotUrls: string[];
  logoDataUri: string | null;
  markDataUri: string | null;
}

/**
 * The client-facing document.
 *
 * It renders the SAME GradeCard and SectionCard components the operator
 * saw on screen — not a second implementation of them. That is the whole
 * point of the export: a partial audit cannot be laundered into a clean
 * one on the way out, because there is no separate code path in which the
 * laundering could happen. SectionCard is simply handed no `onRetry`, so
 * its retry control does not appear in a document going to a client.
 */
export function ExportDocument({
  sections,
  meta,
}: {
  sections: ReportSection[];
  meta: ExportMeta;
}) {
  const { isComplete, completedCount, totalCount, incomplete, withheldReason } =
    deriveCompleteness(sections);

  const rendered = sections.filter((s) => s.status !== "pending");

  return (
    <div className="doc">
      <header className="doc-head">
        <div className="doc-lockup">
          {meta.logoDataUri && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.logoDataUri} alt="ACP" className="doc-logo" />
          )}
          <div>
            <div className="font-mono doc-kicker">UX Evaluation</div>
            <div className="font-display doc-title">AuditLens Report</div>
          </div>
        </div>
        <div className="font-mono doc-date">{meta.generatedAt}</div>
      </header>

      {/*
        The partial-audit declaration. First thing in the document, above
        the grade, above the findings — before a reader can form any
        impression of completeness. Text and borders only, so it survives a
        browser printing this file to PDF with background graphics off.
      */}
      {!isComplete && (
        <section className="doc-partial" role="note">
          <div className="font-mono doc-partial-flag">⚠️ Partial audit</div>
          <p className="doc-partial-lede">
            This report is incomplete. {completedCount} of {totalCount} framework
            {totalCount !== 1 ? "s" : ""} finished, and no overall grade has been issued.
          </p>
          <p className="doc-partial-body">{withheldReason}</p>
          <ul className="doc-partial-list">
            {incomplete.map((s) => (
              <li key={s.id}>
                <strong>{s.label}</strong> —{" "}
                {s.status === "failed"
                  ? "did not complete"
                  : s.status === "truncated"
                    ? "was cut off before finishing"
                    : "did not run"}
                {s.detail ? `. ${s.detail}` : "."}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="doc-brief">
        <h2 className="font-mono doc-section-kicker">Audit brief</h2>
        <dl className="doc-brief-grid">
          <div>
            <dt className="font-mono">Material</dt>
            <dd>
              {meta.screenshotUrls.length > 0
                ? `${meta.screenshotUrls.length} screen${
                    meta.screenshotUrls.length !== 1 ? "s" : ""
                  }${meta.conceptText.trim() ? " + written concept" : ""}`
                : "Written concept — no visuals"}
            </dd>
          </div>
          <div>
            <dt className="font-mono">Audience</dt>
            <dd>{meta.audienceLabel}</dd>
          </div>
          <div>
            <dt className="font-mono">Frameworks</dt>
            <dd>{meta.frameworkLabels}</dd>
          </div>
        </dl>

        {/*
          Task sits below the grid, full width, on purpose. A real task
          scenario is often several sentences describing a whole journey,
          and inside a three-column meta grid it wrapped into a narrow
          ribbon or ran past the fold. The client has to be able to read
          what was actually audited.
        */}
        {meta.taskScenario.trim() && (
          <div className="doc-task">
            <div className="font-mono doc-task-kicker">Task scenario</div>
            <p>{meta.taskScenario}</p>
          </div>
        )}

        {meta.conceptText.trim() && (
          <div className="doc-concept">
            <div className="font-mono doc-concept-kicker">
              {meta.screenshotUrls.length > 0
                ? "Concept description"
                : "Concept description · no visuals"}
            </div>
            <p>{meta.conceptText}</p>
          </div>
        )}

        {meta.screenshotUrls.length > 0 && (
          <div className="doc-shots">
            {meta.screenshotUrls.map((url, i) => (
              <figure key={i}>
                <img src={url} alt={`Screenshot ${i + 1}`} />
                <figcaption className="font-mono">Screenshot {i + 1}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <GradeCard sections={sections} />

      {/* Anchor contents. The app answers the same navigation need with a
          tab bar, but tabs are app furniture — a document a client scrolls
          and prints needs anchors, not state. Statuses are repeated here
          so the contents cannot read as a clean list of finished work. */}
      {rendered.length > 1 && (
        <nav className="doc-toc" aria-label="Contents">
          <h2 className="font-mono doc-section-kicker">Contents</h2>
          <ol>
            {rendered.map((s) => (
              <li key={s.id}>
                <a href={`#section-${s.id}`}>{s.label}</a>
                {s.status !== "complete" && (
                  <span className="doc-toc-status">
                    {s.status === "failed" ? "did not complete" : "cut off"}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {rendered.map((s) => (
        <div key={s.id} id={`section-${s.id}`}>
          <SectionCard section={s} />
        </div>
      ))}

      <footer className="doc-foot">
        {meta.markDataUri && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.markDataUri} alt="" className="doc-foot-mark" />
        )}
        <span className="font-mono">
          Generated by AuditLens v2.0 · {meta.generatedAt} ·{" "}
          {isComplete
            ? "Complete audit — all sections finished"
            : `Partial audit — ${completedCount}/${totalCount} frameworks, grade withheld`}
        </span>
      </footer>
    </div>
  );
}
