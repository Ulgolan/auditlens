// gauntlet:perf — Lighthouse on the report screen and export document,
// desktop + mobile. Uses the `lighthouse` CLI directly (a transitive
// dependency of the sanctioned @lhci/cli package, not a fifth dependency)
// rather than `lhci collect`, which has no simple flag to control each
// run's output path individually.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, OUT_DIR, LHCI_DIR, BASE_URL, ensureDir, withServer } from "./lib.mjs";

const PAGES = [
  { id: "report", path: "/?fixture=gauntlet" },
  { id: "export", path: "/?fixture=gauntlet&view=export" },
  { id: "idle", path: "/" },
  { id: "idle-armed", path: "/?fixture=gauntlet&view=idle" },
];

const FORM_FACTORS = [
  { id: "mobile", extraArgs: [] },
  { id: "desktop", extraArgs: ["--preset=desktop"] },
];

function runLighthouse(url, outputPath, extraArgs) {
  execFileSync(
    "npx",
    [
      "lighthouse",
      url,
      "--output=json",
      `--output-path=${outputPath}`,
      "--chrome-flags=--headless=new --no-sandbox",
      "--quiet",
      ...extraArgs,
    ],
    { cwd: ROOT, stdio: "inherit" }
  );
}

async function main() {
  ensureDir(LHCI_DIR);
  const runs = [];

  await withServer(async (baseUrl) => {
    for (const pageDef of PAGES) {
      for (const formFactor of FORM_FACTORS) {
        const runId = `${pageDef.id}__${formFactor.id}`;
        const outPath = path.join(LHCI_DIR, `${runId}.json`);
        console.log(`[gauntlet:perf] running ${runId}...`);
        runLighthouse(baseUrl + pageDef.path, outPath, formFactor.extraArgs);

        const report = JSON.parse(fs.readFileSync(outPath, "utf-8"));
        const categories = report.categories || {};
        runs.push({
          id: runId,
          page: pageDef.id,
          formFactor: formFactor.id,
          scores: {
            performance: categories.performance
              ? Math.round(categories.performance.score * 100)
              : null,
            accessibility: categories.accessibility
              ? Math.round(categories.accessibility.score * 100)
              : null,
            bestPractices: categories["best-practices"]
              ? Math.round(categories["best-practices"].score * 100)
              : null,
            seo: categories.seo ? Math.round(categories.seo.score * 100) : null,
          },
          reportFile: `lhci/${runId}.json`,
        });
      }
    }
  });

  fs.writeFileSync(
    path.join(OUT_DIR, "perf.json"),
    JSON.stringify({ baseUrl: BASE_URL, runs }, null, 2)
  );

  console.log("gauntlet:perf — scores:");
  for (const run of runs) {
    console.log(
      `  ${run.id.padEnd(16)} perf=${run.scores.performance} a11y=${run.scores.accessibility} best-practices=${run.scores.bestPractices} seo=${run.scores.seo}`
    );
  }
}

main().catch((err) => {
  console.error("gauntlet:perf failed:", err);
  process.exit(1);
});
