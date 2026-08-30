// gauntlet:styles — computed style dump for the in-scope surfaces, checked
// against the token values resolved from app/globals.css.
//
// Only four of the eight dumped categories have a token registry to check
// against in this codebase: color, background-color, border-color, and
// font-family (app/globals.css primitives + the @theme inline aliases, and
// the four next/font stacks). font-size, font-weight, line-height, and the
// four margins/paddings are dumped for reference but NOT flagged — there is
// no spacing/type-scale token layer in this app today (already noted in
// LEDGER.md's 2026-08-06 estate walk, finding #3). Comparison runs once per
// surface at desktop (1280x800): colour/font-family tokens do not vary by
// viewport in this app, so a second pass at mobile would just duplicate the
// same verdicts — layout at mobile is gauntlet:layout's job, not this one's.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, ensureDir, withServer } from "./lib.mjs";

const SURFACE_PAGES = [
  { id: "report", path: "/?fixture=gauntlet" },
  { id: "export", path: "/?fixture=gauntlet&view=export" },
];

// Every `--color-*` alias under @theme inline in app/globals.css, by its
// Tailwind utility suffix (--color-text-primary -> "text-primary", etc.).
const SEMANTIC_COLOR_NAMES = [
  "ground",
  "card",
  "field",
  "overlay",
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "border",
  "border-strong",
  "line",
  "navy",
  "navy-dim",
  "ivory",
  "peri",
  "accent",
  "accent-dim",
  "critical",
  "critical-dim",
  "minor",
  "minor-dim",
  "pass",
  "pass-dim",
];

// Opacity-modified token utilities actually used in components (grep
// confirmed: context-panel.tsx, section-tabs.tsx). Tailwind v4 renders a
// `/NN` opacity modifier as a `color-mix(in oklab, ...)`, which Chromium's
// getComputedStyle reports in oklab syntax — not the plain rgb() a bare
// `var(--token)` probe would produce. Probing the actual utility class
// (rather than reconstructing the color-mix formula by hand) guarantees
// this list can never drift out of sync with what Tailwind really emits.
const OPACITY_COLOR_CLASSES = [
  { className: "border-border/50", property: "borderColor" },
  { className: "border-ivory/50", property: "borderColor" },
  { className: "bg-ground/95", property: "backgroundColor" },
];

// Legal even though no --token resolves to them directly.
const ALWAYS_LEGAL_COLORS = new Set([
  "rgba(0, 0, 0, 0)", // transparent background — the overwhelming default
  "rgb(255, 255, 255)", // --card / --field, but also the plain browser default
]);

async function collectTokens(page) {
  return page.evaluate(
    ({ semanticColorNames, opacityClasses }) => {
      const probe = document.createElement("div");
      probe.style.position = "fixed";
      probe.style.left = "-9999px";
      probe.style.top = "-9999px";
      document.body.appendChild(probe);

      const colors = new Set();

      // Inline `var(--X)` against the PLAIN primitive/semantic name (not
      // the Tailwind-prefixed `--color-X`). `@theme inline` in globals.css
      // means Tailwind inlines each theme value's already-resolved literal
      // straight into the utilities it generates at build time, rather
      // than also emitting a separate `--color-X` runtime custom property
      // to point at it — so `--color-X` does not exist to query at all for
      // almost every X (confirmed empirically: only `--color-text-primary`
      // happened to survive, everything else read as ""). The plain `--X`
      // name is the one guaranteed to exist on :root, independent of
      // Tailwind's build, and reading it back through an actual `color`/
      // `background-color`/`border-color` assignment (rather than just
      // getPropertyValue's raw text) is what normalises a color-mix()
      // token like --navy-dim into a concrete computed rgb().
      for (const name of semanticColorNames) {
        probe.removeAttribute("style");
        probe.style.position = "fixed";
        probe.style.left = "-9999px";
        probe.style.top = "-9999px";
        probe.style.color = `var(--${name})`;
        probe.style.backgroundColor = `var(--${name})`;
        probe.style.borderColor = `var(--${name})`;
        const cs = getComputedStyle(probe);
        colors.add(cs.color);
        colors.add(cs.backgroundColor);
        colors.add(cs.borderTopColor);
      }

      // These three DO need className probing rather than var(): Tailwind
      // v4 renders a `/NN` opacity modifier as `color-mix(in oklab, ...)`,
      // which has no plain var() equivalent to reconstruct by hand. Safe
      // here specifically because each className is copied from a literal
      // string that already exists in real component source (grep-
      // confirmed — see the comment above OPACITY_COLOR_CLASSES), so
      // Tailwind's build is guaranteed to have compiled it regardless of
      // this script.
      for (const { className } of opacityClasses) {
        probe.removeAttribute("style");
        probe.className = className;
        const cs = getComputedStyle(probe);
        colors.add(cs.color);
        colors.add(cs.backgroundColor);
        colors.add(cs.borderTopColor);
        probe.className = "";
      }

      // The four font stacks as the app actually invokes them: the
      // hand-authored .font-display / .font-mono / .font-voice classes in
      // globals.css (which win the cascade over Tailwind's own
      // auto-generated font-display/font-mono/font-voice utilities of the
      // same name, since they're declared later in the same stylesheet),
      // plus the plain body default for --font-body.
      const fonts = new Set();
      probe.className = "";
      fonts.add(getComputedStyle(probe).fontFamily); // body default (--font-body)
      for (const cls of ["font-display", "font-mono", "font-voice"]) {
        probe.className = cls;
        fonts.add(getComputedStyle(probe).fontFamily);
      }

      probe.remove();
      return { colors: Array.from(colors), fonts: Array.from(fonts) };
    },
    { semanticColorNames: SEMANTIC_COLOR_NAMES, opacityClasses: OPACITY_COLOR_CLASSES }
  );
}

async function dumpElements(page) {
  return page.evaluate(() => {
    function cssPath(el) {
      const parts = [];
      let node = el;
      while (node && node.nodeType === 1 && node.tagName !== "BODY") {
        let selector = node.tagName.toLowerCase();
        const siblings = node.parentElement
          ? Array.from(node.parentElement.children).filter((c) => c.tagName === node.tagName)
          : [];
        if (siblings.length > 1) {
          selector += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        }
        parts.unshift(selector);
        node = node.parentElement;
      }
      return "body > " + parts.join(" > ");
    }

    const elements = Array.from(document.body.querySelectorAll("*")).filter((el) => {
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    return elements.map((el) => {
      const cs = getComputedStyle(el);
      const borderSides = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor];
      const borderUniform = borderSides.every((c) => c === borderSides[0]);

      return {
        selector: cssPath(el),
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderColor: borderUniform ? borderSides[0] : borderSides,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        marginTop: cs.marginTop,
        marginRight: cs.marginRight,
        marginBottom: cs.marginBottom,
        marginLeft: cs.marginLeft,
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
      };
    });
  });
}

function flattenBorderColors(borderColor) {
  return Array.isArray(borderColor) ? borderColor : [borderColor];
}

async function main() {
  ensureDir(OUT_DIR);
  const surfaceResults = [];

  await withServer(async (baseUrl) => {
    const browser = await chromium.launch();
    try {
      for (const surface of SURFACE_PAGES) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await context.newPage();
        await page.goto(baseUrl + surface.path, { waitUntil: "networkidle" });
        await page.waitForSelector("text=OVERALL ASSESSMENT", { timeout: 5000 }).catch(() => {});
        await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
        await page.waitForTimeout(300);

        const tokens = await collectTokens(page);
        const legalColors = new Set([...tokens.colors, ...ALWAYS_LEGAL_COLORS]);
        const legalFonts = new Set(tokens.fonts);

        const elements = await dumpElements(page);

        const unlistedTally = new Map(); // key: `${property}::${value}` -> {property, value, count, examples: [selector]}
        const record = (property, value, selector) => {
          const key = `${property}::${value}`;
          if (!unlistedTally.has(key)) {
            unlistedTally.set(key, { property, value, count: 0, examples: [] });
          }
          const entry = unlistedTally.get(key);
          entry.count++;
          if (entry.examples.length < 5) entry.examples.push(selector);
        };

        for (const el of elements) {
          if (!legalColors.has(el.color)) record("color", el.color, el.selector);
          if (!legalColors.has(el.backgroundColor)) record("backgroundColor", el.backgroundColor, el.selector);
          for (const side of flattenBorderColors(el.borderColor)) {
            if (!legalColors.has(side)) record("borderColor", side, el.selector);
          }
          if (!legalFonts.has(el.fontFamily)) record("fontFamily", el.fontFamily, el.selector);
        }

        await context.close();

        surfaceResults.push({
          surface: surface.id,
          elementCount: elements.length,
          tokensResolved: tokens,
          unlisted: Array.from(unlistedTally.values()).sort((a, b) => b.count - a.count),
          elements,
        });
      }
    } finally {
      await browser.close();
    }
  });

  fs.writeFileSync(
    path.join(OUT_DIR, "styles.json"),
    JSON.stringify(
      {
        checkedProperties: ["color", "backgroundColor", "borderColor", "fontFamily"],
        referenceOnlyProperties: [
          "fontSize",
          "fontWeight",
          "lineHeight",
          "marginTop",
          "marginRight",
          "marginBottom",
          "marginLeft",
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
        ],
        surfaces: surfaceResults,
      },
      null,
      2
    )
  );

  const totalUnlisted = surfaceResults.reduce((sum, s) => sum + s.unlisted.length, 0);
  console.log(
    `gauntlet:styles — dumped ${surfaceResults.reduce((s, r) => s + r.elementCount, 0)} elements across ${surfaceResults.length} surfaces. ${totalUnlisted} distinct unlisted (colour/font) values.`
  );
}

main().catch((err) => {
  console.error("gauntlet:styles failed:", err);
  process.exit(1);
});
