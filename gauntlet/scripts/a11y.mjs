// gauntlet:a11y — axe on each in-scope surface x viewport, plus a distinct
// list of every text node under the WCAG contrast ratio (4.5:1, or 3:1 for
// >=24px or bold >=19px — axe's own color-contrast rule already implements
// this exact threshold, so its violations are extracted directly rather
// than re-derived).
//
// Only "report" and "export" are scanned — "tabbar" is the same DOM as
// "report" (see gauntlet/scripts/lib.mjs), so a third scan would just
// duplicate "report"'s results under a different name.
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, VIEWPORTS, ensureDir, withServer } from "./lib.mjs";

const SURFACE_PAGES = [
  { id: "report", path: "/?fixture=gauntlet" },
  { id: "export", path: "/?fixture=gauntlet&view=export" },
];

async function main() {
  ensureDir(OUT_DIR);
  const runs = [];
  const contrastFailures = [];

  await withServer(async (baseUrl) => {
    const browser = await chromium.launch();
    try {
      for (const surface of SURFACE_PAGES) {
        for (const viewport of VIEWPORTS) {
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
          });
          const page = await context.newPage();
          await page.goto(baseUrl + surface.path, { waitUntil: "networkidle" });
          await page.waitForSelector("text=OVERALL ASSESSMENT", { timeout: 5000 }).catch(() => {});
          await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
          await page.waitForTimeout(300);

          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze();

          const runId = `${surface.id}__${viewport.name}`;
          runs.push({
            id: runId,
            url: surface.path,
            viewport: viewport.name,
            violationCount: results.violations.length,
            passCount: results.passes.length,
            incompleteCount: results.incomplete.length,
            violations: results.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              helpUrl: v.helpUrl,
              nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })),
            })),
          });

          const contrastViolation = results.violations.find((v) => v.id === "color-contrast");
          if (contrastViolation) {
            for (const node of contrastViolation.nodes) {
              for (const check of [...(node.any || []), ...(node.all || [])]) {
                if (check.id !== "color-contrast") continue;
                contrastFailures.push({
                  run: runId,
                  target: node.target.join(" "),
                  requiredRatio: check.data?.expectedContrastRatio ?? null,
                  actualRatio: check.data?.contrastRatio ?? null,
                  fontSize: check.data?.fontSize ?? null,
                  fontWeight: check.data?.fontWeight ?? null,
                  foreground: check.data?.fgColor ?? null,
                  background: check.data?.bgColor ?? null,
                });
              }
            }
          }

          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  });

  fs.writeFileSync(
    path.join(OUT_DIR, "a11y.json"),
    JSON.stringify({ runs, contrastFailures }, null, 2)
  );

  const totalViolations = runs.reduce((sum, r) => sum + r.violationCount, 0);
  console.log(
    `gauntlet:a11y — ${runs.length} runs, ${totalViolations} total axe violations, ${contrastFailures.length} contrast failures below WCAG threshold.`
  );
}

main().catch((err) => {
  console.error("gauntlet:a11y failed:", err);
  process.exit(1);
});
