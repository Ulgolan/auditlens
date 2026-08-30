// Shared helpers for every gauntlet:* instrument script. Plain Node ESM,
// no TypeScript — these are standalone infrastructure, not app code (see
// eslint.config.mjs's gauntlet/** ignore and gauntlet/README.md).
import { spawn, execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
export const OUT_DIR = path.join(ROOT, "gauntlet", "out");
export const SHOTS_DIR = path.join(OUT_DIR, "shots");
export const BASELINE_DIR = path.join(ROOT, "gauntlet", "baseline");
export const MASKS_DIR = path.join(ROOT, "gauntlet", "masks");
export const LHCI_DIR = path.join(OUT_DIR, "lhci");

// A dedicated port, distinct from the operator's own `npm run dev` on 3000.
export const PORT = 4173;
export const BASE_URL = `http://localhost:${PORT}`;

export const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
];

// Physics, per the ignition key: top; scrolled to the tab-bar anchor;
// prefers-reduced-motion; JavaScript disabled.
export const STATES = ["top", "scrolled", "reduced-motion", "js-disabled"];

// Three in-scope surfaces (FREEZE.md). "report" is a full-page capture of
// the whole report screen; "tabbar" is a full VIEWPORT (not full-page)
// capture of the same URL, so the "scrolled" state is the one that
// actually brings the sticky tab bar into frame — that is what makes it a
// distinct surface from "report" rather than a duplicate of it. "export"
// is the export document, captured via the gauntlet fixture's in-page
// render path (see gauntlet/README.md — the real export has no URL).
export const SURFACES = [
  { id: "report", path: "/?fixture=gauntlet", fullPage: true },
  { id: "tabbar", path: "/?fixture=gauntlet", fullPage: false },
  { id: "export", path: "/?fixture=gauntlet&view=export", fullPage: true },
];

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function shotName(surfaceId, viewportName, state) {
  return `${surfaceId}__${viewportName}__${state}.png`;
}

export function allShotNames() {
  const names = [];
  for (const surface of SURFACES) {
    for (const viewport of VIEWPORTS) {
      for (const state of STATES) {
        names.push(shotName(surface.id, viewport.name, state));
      }
    }
  }
  return names;
}

async function isServerUp() {
  try {
    const res = await fetch(BASE_URL, { method: "GET" });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function startServer() {
  const proc = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let settled = false;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("next start did not report ready within 60s"));
      }
    }, 60_000);

    proc.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      if (!settled && /ready in/i.test(text)) {
        settled = true;
        clearTimeout(timeout);
        resolve();
      }
    });
    proc.stderr.on("data", () => {});
    proc.on("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(new Error(`next start exited early (code ${code})`));
      }
    });
  });

  // The log line lands slightly before the port is reliably accept()-ing.
  await sleep(300);

  return async function stop() {
    proc.kill("SIGTERM");
    await sleep(200);
  };
}

/**
 * Run `fn(baseUrl)` against a running production server on BASE_URL.
 * Reuses one already up (e.g. one gauntlet:all itself started) instead of
 * building/starting a second one — that is what lets gauntlet:all run its
 * seven instruments against a single build instead of seven.
 */
export async function withServer(fn) {
  const alreadyUp = await isServerUp();
  let stop = null;

  if (!alreadyUp) {
    console.log(`[gauntlet] no server on ${BASE_URL} — building...`);
    execSync("npx next build", { cwd: ROOT, stdio: "inherit" });
    console.log(`[gauntlet] starting production server on ${BASE_URL}...`);
    stop = await startServer();
  } else {
    console.log(`[gauntlet] reusing server already running on ${BASE_URL}`);
  }

  try {
    return await fn(BASE_URL);
  } finally {
    if (stop) await stop();
  }
}

/** Media/JS state that must be set BEFORE navigation. */
export async function applyStatePreNav(page, state) {
  if (state === "reduced-motion") {
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
}

/** State that depends on the page already having loaded (scroll position). */
export async function applyStatePostNav(page, state) {
  if (state === "scrolled") {
    await page.evaluate(() => {
      document
        .getElementById("gauntlet-tabbar-anchor")
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    await page.waitForTimeout(150);
  }
}

/**
 * Navigate and wait for a stable paint: fonts loaded, and — when JS is
 * enabled — the fixture's own content actually mounted (it loads inside a
 * useEffect, so first paint is the plain idle screen). With JS disabled
 * this never resolves, on purpose: that IS the js-disabled state, and the
 * capture that results (the idle screen) is the honest answer for a fully
 * client-rendered app.
 */
export async function gotoAndSettle(page, url, { jsEnabled }) {
  await page.goto(url, { waitUntil: "networkidle" });

  if (jsEnabled) {
    await page
      .waitForSelector("text=OVERALL ASSESSMENT", { timeout: 5000 })
      .catch(() => {});
  }

  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  // The report/input panel mounts with a 300ms fadeIn (globals.css). Waiting
  // less than that made "top"-state shots land mid-animation on some runs —
  // a real, timing-dependent source of nonzero self-diff. 500ms clears it
  // with margin instead of masking a region that would otherwise be legible.
  await page.waitForTimeout(500);
}
