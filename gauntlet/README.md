# Gauntlet — instruments

Plain-language guide. If you only read one section, read "How to read SUMMARY.md".

## What this is

The gauntlet is a set of scripts that measure the app instead of describing it — a
screenshot, a computed CSS value, an accessibility scan, a performance score, a grep
hit. They don't fix anything and don't grade anything; they produce numbers and files
under `gauntlet/out/` for a human (or a later "gauntlet" phase with builder/critic
agents) to judge against.

They run on demand. `npm run gauntlet:all` is the one command that runs everything.

**One-time setup, on a fresh clone:** after `npm install`, also run
`npx playwright install chromium` once — Playwright's browser isn't part of the
regular npm install, and nothing else here installs it for you.

## How to read SUMMARY.md

Run `npm run gauntlet:all`, then open `gauntlet/out/SUMMARY.md`. It's one table:

| Instrument | Files produced | Headline number |
|---|---|---|

Each row's "headline number" is the one thing to look at first. If you want the full
detail behind a number, open the JSON file named in that row — it's always readable
JSON, never anything you need to run code to interpret.

A second table below it shows how long each instrument took, in seconds, and the
total wall-clock for the whole run.

## The seven instruments

- **shots** — screenshots. Three surfaces (`report`, `tabbar`, `export`), two
  viewports (mobile 390×844, desktop 1280×800), four states (top, scrolled, reduced
  motion, JavaScript disabled) — 24 PNGs, named `<surface>__<viewport>__<state>.png`.
- **diff** — compares this run's shots against `gauntlet/baseline/` (the "before"
  picture) and reports a mismatch percentage per image, plus a visual diff image.
- **styles** — dumps computed colour/background/border/font/spacing values for every
  element on the report screen and export document, and flags any colour or font
  that doesn't trace back to a token in `app/globals.css`.
- **a11y** — runs an accessibility scanner (axe) and separately lists every piece of
  text that doesn't meet the required contrast ratio against its background.
- **layout** — flags content that spills sideways off the page, and pieces of text
  that visually overlap each other.
- **vocab** — greps the banned-word list in `IA_CANON.md` against the app's own
  labels, buttons, and prompt copy. Lists hits; does not fix them.
- **perf** — runs Lighthouse (performance/accessibility/best-practices/SEO scores)
  on both surfaces, both viewports.

## How to set the baseline

The baseline is "what main looked like when this was written" — the picture every
future run gets compared against. `gauntlet:diff` seeds it automatically the first
time it runs with nothing in `gauntlet/baseline/` yet. To reset it deliberately later
(e.g. after a change is intentionally approved), delete the relevant PNGs from
`gauntlet/baseline/` and run `gauntlet:shots` then `gauntlet:diff` again — it'll copy
the new shots in as the new baseline.

## How to add a mask region

If a shot is legitimately, harmlessly non-deterministic in one spot (e.g. a
timestamp), you can tell `gauntlet:diff` to ignore that rectangle. Create a JSON file
at `gauntlet/masks/<same-name-as-the-shot>.json` (e.g.
`gauntlet/masks/report__mobile__top.json`) containing a list of rectangles:

```json
[{ "x": 10, "y": 20, "width": 100, "height": 24 }]
```

Every pixel inside each rectangle is painted the same solid colour on both images
before comparing, so nothing inside it can ever register as a mismatch. No masks are
needed today — cycle-0 came out at 0.00% on every image once the report screen's
fade-in animation was given time to finish before capturing (see `lib.mjs`).

## The offline fixture

`gauntlet:shots`, `styles`, `a11y`, and `layout` all need the report screen and the
export document to render without a live Anthropic API call, and without any real
client screenshots. `gauntlet/fixtures/report-fixture.json` is a stored, synthetic,
already-complete audit (fake screenshots, fake concept, fake findings) for exactly
that. Visiting the app with `?fixture=gauntlet` in the URL loads it straight into
state instead of running a real audit; adding `&view=export` on top additionally
renders the export document in the page (instead of triggering the file download it
does in production) so it can be screenshotted directly — the export has no URL of
its own otherwise, since it is a browser download.

Both are gated purely on that query parameter, in `app/page.tsx`. With the parameter
absent, the app behaves exactly as it does in production — verified locally before
this was committed.

## A few things worth knowing before trusting a "0"

- **styles**: only checks colour and font-family against `app/globals.css`'s tokens.
  Font size, weight, line-height, and spacing are dumped for reference but not
  checked — there's no token layer for those yet.
- **layout**: only flags overflow when the computed `overflow-x` is `visible` (the
  real default). An element that deliberately scrolls or deliberately clips isn't a
  bug. Text under 2×2px (the standard screen-reader-only pattern) is never counted
  as an overlap.
- **vocab**: lexical, not semantic. It finds the literal banned word inside a quoted
  string or JSX text; it can't tell "the model is instructed not to say this" from
  "this is actually being said to the user." Read the hits.
- **a11y** / **perf**: only scan `report` and `export` — `tabbar` renders the exact
  same DOM as `report` (just captured differently for `shots`), so a third scan
  would just repeat the first.
- Every instrument runs against a real `next start` production build on a dedicated
  port (4173) — not `next dev`, which shows a dev-tools badge that would show up in
  every screenshot and skew every style/layout reading.

## Cycle-0 findings (not fixed — read-only session)

- **vocab**: 13 hits, not 0. All match (or extend) `LEDGER.md`'s 2026-07-31
  GAP-LIST 2.0, which was never executed.
- **a11y**: `--text-tertiary` measures ~4.0:1 on white at the small sizes it's
  actually used at (short of the 4.5:1 the comment in `globals.css` claims), and the
  accent CTA button (vermilion/ivory, 13.6px) measures 3.06:1.
- **layout**: the header's button group doesn't wrap on a 390px report screen, and
  the export document (evidently never tuned for mobile) overflows its headings and
  header lockup at 390px.
- **styles**: 0 unlisted colour/font values across 1609 elements.
