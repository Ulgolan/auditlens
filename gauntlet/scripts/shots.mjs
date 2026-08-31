// gauntlet:shots — PNGs for each in-scope surface × viewport × state.
import { chromium } from "@playwright/test";
import path from "node:path";
import {
  BASE_URL,
  SHOTS_DIR,
  VIEWPORTS,
  STATES,
  SURFACES,
  ensureDir,
  shotName,
  withServer,
  applyStatePreNav,
  applyStatePostNav,
  gotoAndSettle,
  waitSelectorForSurface,
} from "./lib.mjs";

async function main() {
  ensureDir(SHOTS_DIR);
  let count = 0;

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
            await gotoAndSettle(page, baseUrl + surface.path, {
              jsEnabled,
              waitSelector: waitSelectorForSurface(surface.id),
            });
            await applyStatePostNav(page, state);

            const name = shotName(surface.id, viewport.name, state);
            await page.screenshot({
              path: path.join(SHOTS_DIR, name),
              fullPage: surface.fullPage,
            });
            count++;
            console.log(`  ${name}`);

            await context.close();
          }
        }
      }
    } finally {
      await browser.close();
    }
  });

  console.log(`gauntlet:shots — wrote ${count} PNGs to gauntlet/out/shots/`);
}

main().catch((err) => {
  console.error("gauntlet:shots failed:", err);
  process.exit(1);
});
