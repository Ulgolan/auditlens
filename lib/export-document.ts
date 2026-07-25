import type { ReportSection } from "./types";
import { deriveCompleteness } from "./report-status";

/**
 * Builds the client-ready report as ONE self-contained .html file.
 *
 * Why a file rather than a print stylesheet: browsers drop background
 * colours from printed pages unless the operator ticks "Background
 * graphics", which would have quietly erased the amber declaration that
 * says an audit is partial — the single thing this tool exists to never
 * do. A standalone document controls its own rendering, and its
 * declarations are carried by text and borders so they survive the client
 * printing it to PDF afterwards with backgrounds off.
 *
 * Everything is inlined: the page's own compiled stylesheet, the woff2
 * fonts behind it, the logo, the motif, and the screenshots. The file
 * opens identically on a machine that has never seen this app.
 */

const assetCache = new Map<string, string>();

async function toDataUri(url: string): Promise<string | null> {
  const cached = assetCache.get(url);
  if (cached) return cached;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("unreadable"));
      reader.onerror = () => reject(new Error("unreadable"));
      reader.readAsDataURL(blob);
    });
    assetCache.set(url, dataUri);
    return dataUri;
  } catch {
    return null;
  }
}

/**
 * Serialise every same-origin stylesheet the page has loaded. This is what
 * makes the export pixel-faithful rather than a re-creation: the exported
 * document is styled by the exact rules that styled the screen.
 */
function collectPageCss(): string {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        chunks.push(rule.cssText);
      }
    } catch {
      // Cross-origin sheet — unreadable by design. Nothing of ours lives
      // in one, so skipping it costs nothing.
    }
  }
  return chunks.join("\n");
}

/**
 * Rewrite every same-origin url() in the collected CSS to a data URI —
 * chiefly the next/font woff2 files, which would otherwise resolve against
 * file:// and silently fall back to a system face.
 */
async function inlineCssAssets(css: string): Promise<string> {
  const urls = new Set<string>();
  const pattern = /url\((['"]?)(\/[^)'"]+)\1\)/g;

  for (const match of css.matchAll(pattern)) urls.add(match[2]);

  const resolved = new Map<string, string>();
  await Promise.all(
    Array.from(urls).map(async (u) => {
      const dataUri = await toDataUri(u);
      if (dataUri) resolved.set(u, dataUri);
    })
  );

  return css.replace(pattern, (whole, _quote, path: string) => {
    const dataUri = resolved.get(path);
    return dataUri ? `url("${dataUri}")` : whole;
  });
}

/** Layout, page setup and print rules that exist only in the document. */
const DOCUMENT_CSS = `
  html { background: var(--ground); }
  body {
    margin: 0;
    padding: 40px 20px 64px;
    background: var(--ground);
    color: var(--text-primary);
    font-family: var(--font-archivo), Archivo, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .doc {
    max-width: 860px;
    margin: 0 auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: 44px 48px 36px;
  }
  .doc-head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 24px; padding-bottom: 22px; margin-bottom: 26px;
    border-bottom: 1px solid var(--border);
  }
  .doc-lockup { display: flex; align-items: center; gap: 12px; }
  .doc-logo { height: 38px; width: auto; display: block; }
  .doc-kicker {
    font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.16em;
    color: var(--text-tertiary);
  }
  .doc-title {
    font-size: 1.25rem; font-weight: 800; font-stretch: 125%;
    letter-spacing: -0.02em; color: var(--text-primary); line-height: 1.1;
  }
  .doc-date {
    font-size: 0.66rem; letter-spacing: 0.08em; color: var(--text-tertiary);
    white-space: nowrap; padding-top: 4px;
  }

  /* The partial-audit declaration. Borders and text only — no fill is
     load-bearing, so stripping backgrounds for print cannot mute it. */
  .doc-partial {
    border: 2px solid var(--minor);
    border-left-width: 8px;
    border-radius: 14px;
    padding: 18px 22px;
    margin-bottom: 28px;
    background: var(--minor-dim);
  }
  .doc-partial-flag {
    font-size: 0.72rem; font-weight: 500; text-transform: uppercase;
    letter-spacing: 0.16em; color: var(--text-primary); margin-bottom: 8px;
  }
  .doc-partial-lede {
    margin: 0 0 8px; font-size: 1rem; font-weight: 700; line-height: 1.4;
    color: var(--text-primary);
  }
  .doc-partial-body {
    margin: 0 0 10px; font-size: 0.82rem; line-height: 1.6;
    color: var(--text-secondary);
  }
  .doc-partial-list {
    margin: 0; padding-left: 18px; font-size: 0.82rem; line-height: 1.7;
    color: var(--text-secondary);
  }
  .doc-partial-list strong { color: var(--text-primary); }

  .doc-brief { margin-bottom: 30px; }
  .doc-section-kicker {
    font-size: 0.66rem; font-weight: 500; text-transform: uppercase;
    letter-spacing: 0.16em; color: var(--text-primary);
    margin: 0 0 12px; padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }
  .doc-brief-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 14px 26px; margin: 0;
  }
  .doc-brief-grid dt {
    font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--text-tertiary); margin-bottom: 3px;
  }
  .doc-brief-grid dd {
    margin: 0; font-size: 0.86rem; line-height: 1.45; color: var(--text-primary);
  }
  .doc-concept {
    margin-top: 18px; padding: 14px 16px;
    border: 1px solid var(--border); border-radius: 12px;
  }
  .doc-concept-kicker {
    font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.16em;
    color: var(--text-tertiary); margin-bottom: 7px;
  }
  .doc-concept p {
    margin: 0; font-size: 0.84rem; line-height: 1.6;
    color: var(--text-secondary); white-space: pre-wrap;
  }
  .doc-shots {
    display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px;
  }
  .doc-shots figure { margin: 0; }
  .doc-shots img {
    height: 140px; width: auto; display: block; border-radius: 8px;
    border: 1px solid var(--border);
  }
  .doc-shots figcaption {
    font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--text-tertiary); margin-top: 5px;
  }

  .doc-foot {
    display: flex; align-items: center; gap: 10px;
    margin-top: 30px; padding-top: 18px;
    border-top: 1px solid var(--border);
    font-size: 0.62rem; letter-spacing: 0.06em; color: var(--text-tertiary);
  }
  .doc-foot-mark { height: 16px; width: 16px; flex: none; }

  @media print {
    @page { margin: 14mm; }
    html, body { background: #FFFFFF; }
    body { padding: 0; }
    .doc {
      max-width: none; border: none; border-radius: 0; padding: 0;
    }
    /* Best-effort: keep the fills if the browser will allow it. The
       declarations do not depend on this succeeding. */
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .doc-partial { break-inside: avoid; break-after: avoid; }
    .doc-brief { break-inside: avoid; }
    .doc-shots img { height: 110px; }
  }
`;

export interface ExportInput {
  sections: ReportSection[];
  screenshotUrls: string[];
  conceptText: string;
  taskScenario: string;
  audienceLabel: string;
  frameworkLabels: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatStamp(d: Date): string {
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Build the document and hand it to the browser as a download.
 * Returns the filename written.
 */
export async function downloadReport(input: ExportInput): Promise<string> {
  const [{ renderToStaticMarkup }, pageCss, logoDataUri, markDataUri] =
    await Promise.all([
      import("react-dom/server"),
      inlineCssAssets(collectPageCss()),
      toDataUri("/pop-logo-color.png"),
      toDataUri("/motifs/north-star.svg"),
    ]);

  const { ExportDocument } = await import("@/components/export-document");
  const { createElement } = await import("react");

  const now = new Date();
  const { isComplete, completedCount, totalCount } = deriveCompleteness(
    input.sections
  );

  const body = renderToStaticMarkup(
    createElement(ExportDocument, {
      sections: input.sections,
      meta: {
        generatedAt: formatStamp(now),
        audienceLabel: input.audienceLabel,
        frameworkLabels: input.frameworkLabels,
        taskScenario: input.taskScenario,
        conceptText: input.conceptText,
        screenshotUrls: input.screenshotUrls,
        logoDataUri,
        markDataUri,
      },
    })
  );

  // The title travels into the browser tab and into the header of anything
  // printed from this file, so it carries the partial status too.
  const title = isComplete
    ? "AuditLens Report — UX Audit"
    : `AuditLens Report — PARTIAL (${completedCount} of ${totalCount} frameworks)`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${markDataUri ? `<link rel="icon" href="${markDataUri}">` : ""}
<style>
${pageCss}
${DOCUMENT_CSS}
</style>
</head>
<body>
${body}
</body>
</html>`;

  const stamp = now.toISOString().slice(0, 10);
  const filename = isComplete
    ? `auditlens-report-${stamp}.html`
    : `auditlens-report-PARTIAL-${stamp}.html`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick — Safari needs the URL to survive the click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return filename;
}
