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

- **shots** — screenshots. Five surfaces (`report`, `tabbar`, `export`, `idle`,
  `idle-armed`), two viewports (mobile 390×844, desktop 1280×800), four states (top,
  scrolled, reduced motion, JavaScript disabled) — 40 PNGs, named
  `<surface>__<viewport>__<state>.png`.
- **diff** — compares this run's shots against `gauntlet/baseline/` (the "before"
  picture) and reports a mismatch percentage per image, plus a visual diff image. See
  "How to set the baseline" for the default comparison, and "`--against`" for
  comparing against a different directory.
- **styles** — dumps computed colour/background/border/font/spacing values for every
  element on the report screen, export document, and both idle screens, and flags
  any colour or font that doesn't trace back to a token in `app/globals.css`.
- **a11y** — runs an accessibility scanner (axe) and separately lists every piece of
  text that doesn't meet the required contrast ratio against its background.
- **layout** — flags content that spills sideways off the page, and pieces of text
  that visually overlap each other.
- **vocab** — greps the banned-word list in `IA_CANON.md` against the app's own
  labels, buttons, and prompt copy. Lists hits; does not fix them.
- **perf** — runs Lighthouse (performance/accessibility/best-practices/SEO scores)
  on all four in-scope pages, both viewports.

## The two idle surfaces

Run 1 only scanned `report`, `tabbar`, and `export` — every one of those requires a
completed audit to exist, so the screen an operator actually lands on first (before
any material is loaded) was never scanned by anything. That screen turned out to
matter: it's where the Run Audit button lives, and the button has two states the
report screen never shows.

- **`idle`** — the cold screen, no fixture at all (`/`). No material loaded, no
  framework selected, the Run Audit button disabled. WCAG 1.4.3 exempts inactive
  controls from the contrast requirement, so this screen scanning clean is expected,
  not a pass being claimed on a technicality.
- **`idle-armed`** — the same screen with the gauntlet fixture's concept text and
  frameworks loaded (`/?fixture=gauntlet&view=idle`), but no report mounted. This is
  the one place the Run Audit button renders *enabled* — `bg-accent text-ivory`,
  3.06:1, the known contrast failure that `report` and `export` structurally cannot
  expose because the button doesn't exist on either of those screens.

Two surfaces, not one, because "loads" and "is usable" are different claims and the
button only fails contrast in the second state.

## How to set the baseline

The baseline is "what main looked like when this was written" — the picture every
future run gets compared against. `gauntlet:diff` seeds it automatically the first
time it runs with nothing in `gauntlet/baseline/` yet. To reset it deliberately later
(e.g. after a change is intentionally approved), delete the relevant PNGs from
`gauntlet/baseline/` and run `gauntlet:shots` then `gauntlet:diff` again — it'll copy
the new shots in as the new baseline. See "Reference" below for when re-seeding
requires a Commander ruling rather than being a routine operator step.

### `--against`

`gauntlet:diff --against <dir>` compares `gauntlet/out/shots/` against `<dir>` instead
of `gauntlet/baseline/` — e.g. a lane baseline mid-run, without an out-of-repo
throwaway script. An empty or missing `<dir>` always exits 1 naming it; only the
default `gauntlet/baseline/` path auto-seeds when empty.

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

## Logs

`npm run gauntlet:all` no longer prints each instrument's full output to your
terminal — the console shows one line per step (seconds elapsed, log file path), plus
the `next build` step before it. The full output lives in `gauntlet/out/logs/`: one
`<step>.log` per instrument (`shots.log`, `diff.log`, `styles.log`, `a11y.log`,
`layout.log`, `vocab.log`, `perf.log`) plus `build.log` for the production build. A
failing step still fails the run and still tells you which log to open.

## Reference

Run 1 used the rulebook bar (option A) — critic rows checked against the ignition
key plus `app/globals.css`'s tokens. Option B (Claude Design reference frames per
surface, pixel-diffed against a designed reference) was parked at gauntlet setup and
never run; **it is retired for AuditLens 2.0**, not merely postponed — there is no
`gauntlet/reference/` folder and there will not be one. `gauntlet/baseline/` is the
reference now: the render approved at DESIGN GATE 31.08 is canon. Re-seeding it isn't
a routine operator step — it happens only after a Commander DESIGN GATE ruling
approves the new render, exactly as it did for run 2's setup (see `LEDGER.md`,
2026-08-31).

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
- **a11y** / **perf**: scan `report`, `export`, `idle`, and `idle-armed` — never
  `tabbar`, which renders the exact same DOM as `report` (just captured differently
  for `shots`), so a fifth scan would just repeat the first.
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
