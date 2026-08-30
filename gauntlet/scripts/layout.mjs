// gauntlet:layout — horizontal overflow and overlapping text bounding
// boxes, per surface x viewport x state (the same 24-combo matrix as
// gauntlet:shots).
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  OUT_DIR,
  VIEWPORTS,
  STATES,
  SURFACES,
  ensureDir,
  withServer,
  applyStatePreNav,
  applyStatePostNav,
  gotoAndSettle,
} from "./lib.mjs";

// Overlap tolerance: ignore trivial sub-pixel/antialiasing overlaps between
// unrelated text boxes so the list stays to real, visually meaningful cases.
const OVERLAP_PERCENT_TOLERANCE = 5;

async function collectLayoutIssues(page) {
  return page.evaluate((tolerance) => {
    function cssPath(el) {
      const parts = [];
      let node = el;
      while (node && node.nodeType === 1 && node.tagName !== "BODY") {
        let selector = node.tagName.toLowerCase();
        const siblings = node.parentElement
          ? Array.from(node.parentElement.children).filter(
              (c) => c.tagName === node.tagName
            )
          : [];
        if (siblings.length > 1)
          selector += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        parts.unshift(selector);
        node = node.parentElement;
      }
      return "body > " + parts.join(" > ");
    }

    const results = { horizontalOverflow: [], overlaps: [] };

    const doc = document.documentElement;
    if (doc.scrollWidth > doc.clientWidth) {
      results.horizontalOverflow.push({
        selector: "html",
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        overflowPx: doc.scrollWidth - doc.clientWidth,
      });
    }

    const all = Array.from(document.body.querySelectorAll("*"));

    for (const el of all) {
      const cs = getComputedStyle(el);
      // Only "visible" (the default) lets overflowing content actually
      // spill into view uncontrolled — that is the only case worth
      // flagging. "auto"/"scroll" is a deliberate scroll container, and
      // "hidden"/"clip" deliberately clips (e.g. the standard sr-only
      // pattern: a 1px box whose text content would scrollWidth far past
      // it, but is never visible because it clips).
      if (cs.overflowX !== "visible") continue;
      if (el.scrollWidth > el.clientWidth + 1) {
        results.horizontalOverflow.push({
          selector: cssPath(el),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          overflowPx: el.scrollWidth - el.clientWidth,
        });
      }
    }

    function isTextLeaf(el) {
      if (el.children.length > 0) return false;
      return !!el.textContent?.trim();
    }

    const textLeaves = all
      .filter(isTextLeaf)
      .map((el) => ({ el, rect: el.getBoundingClientRect(), selector: cssPath(el) }))
      // >1px, not >0px: screen-reader-only text (the common sr-only pattern —
      // 1x1px, clipped) is invisible by design and reports a real but
      // meaningless bounding box; it should never register as an overlap.
      .filter((t) => t.rect.width > 1 && t.rect.height > 1);

    function intersects(a, b) {
      return !(
        a.right <= b.left ||
        a.left >= b.right ||
        a.bottom <= b.top ||
        a.top >= b.bottom
      );
    }
    function overlapArea(a, b) {
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return Math.max(0, w) * Math.max(0, h);
    }

    for (let i = 0; i < textLeaves.length; i++) {
      for (let j = i + 1; j < textLeaves.length; j++) {
        const a = textLeaves[i];
        const b = textLeaves[j];
        // Ancestor/descendant containment is normal nesting, not an overlap bug.
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        if (!intersects(a.rect, b.rect)) continue;

        const area = overlapArea(a.rect, b.rect);
        const minArea = Math.min(
          a.rect.width * a.rect.height,
          b.rect.width * b.rect.height
        );
        const overlapPercent = minArea > 0 ? (area / minArea) * 100 : 0;
        if (overlapPercent > tolerance) {
          results.overlaps.push({
            a: a.selector,
            b: b.selector,
            overlapPercent: Number(overlapPercent.toFixed(1)),
          });
        }
      }
    }

    // A wide descendant pushes every ancestor's scrollWidth out too, so the
    // same real cause otherwise gets reported once per ancestor level. Keep
    // only the deepest (most specific) overflowing element per chain — the
    // actual source — and drop the ancestors it drags along with it.
    results.horizontalOverflow = results.horizontalOverflow.filter((entry) => {
      const prefix = entry.selector + " > ";
      return !results.horizontalOverflow.some((other) =>
        other.selector.startsWith(prefix)
      );
    });

    return results;
  }, OVERLAP_PERCENT_TOLERANCE);
}

async function main() {
  ensureDir(OUT_DIR);
  const findings = [];

  await withServer(async (baseUrl) => {
    const browser = await chromium.launch();
    try {
      for (const surface of SURFACES) {
        for (const viewport of VIEWPORTS) {
          for (const state of STATES) {
            const jsEnabled = state !== "js-disabled";
            const context = await browser.newContext({
              viewport: { width: viewport.width, height: viewport.height },
              javaScriptEnabled: jsEnabled,
            });
            const page = await context.newPage();

            await applyStatePreNav(page, state);
            await gotoAndSettle(page, baseUrl + surface.path, { jsEnabled });
            await applyStatePostNav(page, state);

            const issues = await collectLayoutIssues(page);
            findings.push({
              surface: surface.id,
              viewport: viewport.name,
              state,
              horizontalOverflowCount: issues.horizontalOverflow.length,
              overlapCount: issues.overlaps.length,
              horizontalOverflow: issues.horizontalOverflow,
              overlaps: issues.overlaps,
            });

            await context.close();
          }
        }
      }
    } finally {
      await browser.close();
    }
  });

  fs.writeFileSync(
    path.join(OUT_DIR, "layout.json"),
    JSON.stringify(
      { overlapPercentTolerance: OVERLAP_PERCENT_TOLERANCE, findings },
      null,
      2
    )
  );

  const totalOverflow = findings.reduce((s, f) => s + f.horizontalOverflowCount, 0);
  const totalOverlap = findings.reduce((s, f) => s + f.overlapCount, 0);
  console.log(
    `gauntlet:layout — ${findings.length} surface x viewport x state combos. ${totalOverflow} horizontal-overflow findings, ${totalOverlap} text overlaps.`
  );
}

main().catch((err) => {
  console.error("gauntlet:layout failed:", err);
  process.exit(1);
});
