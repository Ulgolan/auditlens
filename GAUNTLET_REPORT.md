# GAUNTLET REPORT — Run 1, AuditLens

*Foreman: Opus (Claude Code). Builders + critics: Sonnet, fresh spawn each cycle.
Under IGNITION KEY v1.1 (31 Aug 2026), GAUNTLET_KEY v0.2, FREEZE.md (run 1).
Bar = rulebook (option A). Reference frames parked for run 2.*

## Header

- **Branch:** `gauntlet/run-1`, created from `main` at `57fcb1a`.
- **Preview URL:** https://auditlens-git-gauntlet-run-1-popescu-alexandrus-projects.vercel.app
- **Wall-clock start (cycle 1):** 2026-08-31 13:06 local.

### Pre-flight (all seven)

**1. Reference exists.** For run 1 the reference is the rulebook (the critic rows
in the ignition key) **plus the tokens in `app/globals.css`**. Stated explicitly:
there is no Claude Design reference frame this run — `FREEZE.md` parks it:
> "PARKED: option B (Claude Design reference frames per surface, pixel-diff vs reference) — return ticket for run 2."

**2. FREEZE.md present and unchanged since merge `57fcb1a`.**
`git log 57fcb1a..HEAD -- FREEZE.md` → empty; last commit touching it is `6189811 FREEZE.md — Gauntlet run 1`, which precedes the merge. Working tree clean for that path. Quoted line:
> "IN: report screen, tab bar (all states), export document. Ivory Loom only."

**3. Branch.** `git branch --show-current` → `gauntlet/run-1`. `git rev-parse HEAD` = `git rev-parse main` = `57fcb1aa7de84fc569b22f313e530222ba77a9ed`. PASS.

**4. Caps** written into this header before cycle 1 — see CAPS below. PASS.

**5. Gate Zero.** PASS as of PR #3 (limiter, spend cap, push protection) per `LEDGER.md` 2026-08-30. This run is visual + string changes only. **Confirmed: no file under `app/api/`, `lib/prompts.ts`, or `lib/ai-config.ts` will be touched.** The 9 vocab hits inside those files are listed under *Parked (gauntlet)* and are out of scope by FREEZE.md:
> "OUT: engine (lib/, app/api/), prompts, retry-on-transport (2.1), IA_CANON strings beyond banned-synonym fixes, any new feature."

**6. ROUTING PROOF.** A trivial sub-agent was spawned and asked to report its own
model name. It returned: **"Claude Sonnet 5"**. Sonnet spawning works — builders
and critics run on Sonnet, foreman on Opus, as the key intends. No 30-Opus-spawn
condition.

**7. SERVER GROUND TRUTH.** Quoted from `gauntlet/README.md`:
> "Every instrument runs against a real `next start` production build on a dedicated port (4173) — not `next dev`, which shows a dev-tools badge that would show up in every screenshot and skew every style/layout reading."

and:
> "Visiting the app with `?fixture=gauntlet` in the URL loads it straight into state instead of running a real audit; adding `&view=export` on top additionally renders the export document in the page"

Confirmed in `gauntlet/scripts/lib.mjs`: `PORT = 4173`, `spawn("npx", ["next", "start", "-p", "4173"])`, surfaces `/?fixture=gauntlet` (report, tabbar) and `/?fixture=gauntlet&view=export` (export). One manual `npm run gauntlet:shots` was run before cycle 0 and **succeeded** — 24 PNGs written, 39.4s wall-clock (after the one-time `npx playwright install chromium`).

### CAPS (written before cycle 1)

| Cap | Value |
|---|---|
| Max cycles per lane | 5 |
| Max lanes | 3 |
| Max builder + critic spawns | 30 |
| Max wall-clock | 150 min from cycle 1 |
| Cycle-0 capture cost | 123.7s (key's figure: 124.9s) |

Any cap hit = lane CAPPED, delta recorded, move on. Never "one more".
A CAPPED lane with a reported delta is a legitimate run-1 outcome, not a failure.

---

## BASELINE — cycle 0 (no edits)

`npm run gauntlet:all`, wall-clock **123.7s**. SUMMARY table copied verbatim:

| Instrument | Files produced | Headline number |
|---|---|---|
| shots | gauntlet/out/shots/*.png | 24 PNGs |
| diff | gauntlet/out/diff.json, gauntlet/out/diffs/*.png | worst mismatch: 0% (report__mobile__top.png) |
| styles | gauntlet/out/styles.json | 0 unlisted colour/font values |
| a11y | gauntlet/out/a11y.json | 4 axe violations, 48 contrast failures |
| layout | gauntlet/out/layout.json | 42 horizontal overflows, 3 text overlaps |
| vocab | gauntlet/out/vocab.json | 13 banned-term hits |
| perf | gauntlet/out/lhci/*.json, gauntlet/out/perf.json | report__mobile: P96/A96, report__desktop: P100/A96, export__mobile: P96/A96, export__desktop: P100/A96 |

**Timing per instrument:** shots 30.6s · diff 4.2s · styles 2.4s · a11y 5.3s · layout 28.6s · vocab 0.1s · perf 44.2s · **total 123.7s**.

**LANE BASELINE seeded:** `gauntlet/out/shots/` → `gauntlet/lane-baseline/shots/`
(24 PNGs), plus `layout.json` and `a11y.json`. Gitignored, local only.
`gauntlet/baseline/` (the committed original) is untouched for the whole run and
serves only the before/after grid below.

**Drift check against the key's expected cycle-0 numbers:**

| Expected | Observed | Match |
|---|---|---|
| 13 vocab | 13 | ✅ |
| 48 contrast | 48 | ✅ |
| 4 axe | 4 | ✅ |
| 42 overflow | 42 | ✅ |
| 3 overlap | 3 | ✅ |
| 0 unlisted | 0 | ✅ |
| LH ≥ 96 | 96/96/96/100 mobile · 100/96/96/100 desktop (both surfaces) | ✅ |

**No drift. Cleared to spawn.**

---

## LANE 1 — VOCABULARY · **DONE** in 1 cycle

**Baseline:** 13 hits in `gauntlet/out/vocab.json` (4 in-scope, 9 parked).
**Manifest:** `components/context-panel.tsx`, `components/drop-zone.tsx`, `components/export-document.tsx`.

**Builder c1** — commit `f1d087f` *"gauntlet/lane-1 c1: replace banned "Screen N" numbering with canonical "Screenshot N" in 4 authored strings"*. Four anchors, each hit once: ``Screen ${i + 1}`` → ``Screenshot ${i + 1}`` in the two thumbnail `alt` attributes, the export `<img>` `alt`, and the export `<figcaption>`. Canon: `Screenshot` is the canonical term; "screen … never as an alt text, figcaption, counter, or model-facing numbering instruction."

Builder's declared EXPECTED-TO-MOVE (passed to the critic verbatim): the 6 non-`js-disabled` `export__*` shots (the figcaption is rendered text); the other 18 declared unchanged (alt text is not rendered pixels).

### Critic table — LANE 1 / CYCLE 1 (verbatim)

LANE: 1 — VOCABULARY
CYCLE: 1

| Row | Verdict | Evidence |
|---|---|---|
| R1 | PASS | vocab.json hitCount=9, all 9 hits fall in `lib/prompts.ts` (8 hits: lines 25,29,31,156,190,317,319,320) or `app/api/evaluate/route.ts` (1 hit: line 169) — both out-of-scope. In-scope hits (components/, lib/export-document.ts, app/page.tsx) = 0. |
| R8 | PASS | `git diff --stat 57fcb1a HEAD` = "components/context-panel.tsx \| 2 +-, components/drop-zone.tsx \| 2 +-, components/export-document.tsx \| 4 ++--" — 3 files, all under components/, subset of {components/**, lib/export-document.ts, app/page.tsx}. |
| R7 | PASS | perf.json scores vs baseline (perf/a11y/best-practices/seo): report__mobile 96/96/96/100 = baseline 96/96/96/100; report__desktop 100/96/96/100 = baseline 100/96/96/100; export__mobile 96/96/96/100 = baseline 96/96/96/100; export__desktop 100/96/96/100 = baseline 100/96/96/100. No score below baseline in any of the 16 values. |
| R2/R3 | PASS | styles.json: surface "report" unlisted=[] (0), surface "export" unlisted=[] (0). Total unlisted colour/font values across both surfaces = 0. |
| R9 | PASS | diff.json mismatchPercent for all 18 declared-unchanged shots = 0: report__mobile__top 0, report__mobile__scrolled 0, report__mobile__reduced-motion 0, report__mobile__js-disabled 0, report__desktop__top 0, report__desktop__scrolled 0, report__desktop__reduced-motion 0, report__desktop__js-disabled 0, tabbar__mobile__top 0, tabbar__mobile__scrolled 0, tabbar__mobile__reduced-motion 0, tabbar__mobile__js-disabled 0, tabbar__desktop__top 0, tabbar__desktop__scrolled 0, tabbar__desktop__reduced-motion 0, tabbar__desktop__js-disabled 0, export__mobile__js-disabled 0, export__desktop__js-disabled 0. |

SUMMARY: Zero FAIL rows in Lane 1; the only nonzero residual in this lane's instrument set is the declared-expected-to-move export diff (export__mobile__* = 0.0025%, export__desktop__* = 0.0017%), which R9 does not grade.
PARKED (out of scope, listed not counted): app/api/evaluate/route.ts:169 "screen"; lib/prompts.ts:25 "issue"; lib/prompts.ts:29 "problem"; lib/prompts.ts:31 "criticism"; lib/prompts.ts:156 "screen"; lib/prompts.ts:190 "problem"; lib/prompts.ts:317 "issue"; lib/prompts.ts:319 "issue"; lib/prompts.ts:320 "problem".

**Verdict: DONE.** 13 → 9 hits; 4/4 in-scope hits closed; 9 parked by FREEZE.md.

---

## LANE 2 — CONTRAST & A11Y · **DONE** in 1 cycle

**Baseline:** 48 contrast failures, 4 axe violations in `gauntlet/out/a11y.json`.
**Manifest:** `app/globals.css`, `lib/export-document.ts`, `components/**`, `app/page.tsx`.

**Builder c1** — commit `c239cb4` *"gauntlet/lane-2 c1: darken text-tertiary alpha and fix Export/Discard CTA text colour for AA contrast"*.

Ground truth the builder quoted before editing, the 48 failures grouped:

| count | foreground | background | fontSize | actualRatio |
|---|---|---|---|---|
| 33 | `#7779bb` | `#ffffff` | 8.6pt (11.52px) | 4 |
| 8 | `#7779bb` | `#ffffff` | 9.0pt (12px) | 4 |
| 2 | `#7779bb` | `#ffffff` | 9.4pt (12.48px) | 4 |
| 1 | `#7779bb` | `#ffffff` | 9.8pt (13.12px) | 4 |
| 2 | `#7773b4` | `#fff3f0` | 10.5pt (14px) | 3.94 |
| 2 | `#fff3f0` | `#ff4d00` | 10.2pt (13.6px) | 3.06 |

**Root-cause finding (answers the key's "resolve the 4 axe violations if markup-level"):** all 4 axe violations are `color-contrast`, `serious` — the *same* root cause as the 48 contrast failures, not separate markup defects. No labels/roles/alt work existed to do. Nothing parked for "needs a component".

**Token changes, ratios measured with the WCAG 2.x relative-luminance formula, alpha composited over its real ground:**

| Rule | Before | After | Before ratio | After ratio |
|---|---|---|---|---|
| `--text-tertiary` (`app/globals.css`) | `rgba(8,11,131,0.55)` | `rgba(8,11,131,0.62)` | 4.02 on white / 3.93 on ivory | 5.03 on white / **4.89 on ivory (binding)** |
| Export report button text (`app/page.tsx`) | `text-ivory` on `bg-accent` | `text-text-primary` on `bg-accent` | 3.06 | **4.86** |
| Discard-and-start-over button text (`app/page.tsx`) | `text-ivory` on `bg-accent` | `text-text-primary` on `bg-accent` | 3.06 | **4.86** |

No new hue, no new primitive, no raw hex in a component. `--text-tertiary` is a darker step on the existing navy-alpha ramp; `lib/export-document.ts` needed no edit because it consumes the same CSS variable.

**The false comment is fixed.** `globals.css` previously claimed 0.55 "clears 4.5:1"; axe measured the rendered result at 4.0:1. The comment now states what axe actually measures, tagged `gauntlet run-1, ratio 4.89` (the binding worst case, on ivory).

**EXEMPTIONS: none claimed.** Zero items were exempted, so zero WCAG quotes were required. Every one of the 48 was fixed, not excused.

### Critic table — LANE 2 / CYCLE 1 (verbatim)

LANE: 2 — CONTRAST & A11Y
CYCLE: 1

| Row | Verdict | Evidence |
|---|---|---|
| R4 | PASS | a11y.json `"contrastFailures": []` — 0 items, 0 exemptions claimed, 0 needed. |
| R4b | PASS | a11y.json `runs[].violations` — all four runs report `"violationCount": 0"`, `"violations": []`; total 0 across report__mobile, report__desktop, export__mobile, export__desktop. |
| R2/R3 | PASS | styles.json `surfaces[].unlisted` — report: `[]`, export: `[]`. 0 unlisted colour/font values. |
| R9-LANE2 | PASS | layout.json vs lane-baseline/layout.json: current horizontalOverflow total = 42, overlap total = 3; baseline horizontalOverflow total = 42, overlap total = 3. Both files hold 24 findings entries, and the full findings arrays are byte-identical (JSON deep-equal true) — counts unchanged and individual findings unchanged. |
| R7 | PASS | perf.json vs baseline: report mobile 96/100/96/100, report desktop 100/100/96/100, export mobile 96/100/96/100, export desktop 100/100/96/100 — matches baseline (96/96/96/100, 100/96/96/100, 96/96/96/100, 100/96/96/100) on perf/best-practices/seo, and a11y is 100 everywhere vs baseline 96, so no score is below baseline. |
| R8 | PASS | `git diff --stat 57fcb1a HEAD` — this lane's commit touched only `app/globals.css` and `app/page.tsx` (per the R8 scope reading), both within the allowed set {app/globals.css, lib/export-document.ts, components/**, app/page.tsx}. |

SUMMARY: No FAIL rows; the only carryover is the pre-existing layout gap of 42 horizontal overflows and 3 text overlaps, unchanged from lane baseline (0 delta).

**Verdict: DONE.** 48 → 0 contrast failures, 4 → 0 axe violations, Lighthouse a11y 96 → **100** on all four surface/viewport pairs.

### Lane 2 pixel-diff vs LANE BASELINE — reported, not thresholded

Per the key, colour changes move pixels everywhere by design, so this is for the Commander's eye, not a row:

| Shot | Δ | Shot | Δ |
|---|---|---|---|
| export__* (all 8) | 0.0000% | report__mobile__js-disabled | 0.0000% |
| report__mobile__{top, scrolled, reduced-motion} | 0.0107% | report__desktop__js-disabled | 0.0000% |
| report__desktop__{top, scrolled, reduced-motion} | 0.0064% | tabbar__*__js-disabled | 0.0000% |
| tabbar__mobile__{top, reduced-motion} | 0.0489% | tabbar__*__scrolled (desktop/mobile) | 0.0000%/0.0000% |
| tabbar__desktop__{top, reduced-motion} | 0.0176% | | |

**Foreman's note on how to read those zeros:** the `--text-tertiary` alpha move (0.55 → 0.62) is a real, instrument-verified colour change — a11y went 48 → 0 measuring the exact computed value — but it lands *below `pixelmatch`'s 0.1 per-pixel colour-distance threshold*, so it does not register as a diff. The nonzero shots are the two CTA text swaps (ivory → navy), a much larger per-pixel delta. A 0.0000% here means "sub-threshold", not "nothing changed".

---

## LANE 3 — LAYOUT (390 px) · **DONE** in 2 cycles

**Baseline:** 42 horizontal overflows, 3 text overlaps in `gauntlet/out/layout.json`.
**Manifest:** `app/page.tsx`, `components/**`, `lib/export-document.ts`, `app/globals.css`.

**Builder c1** — commit `e52110b` *"gauntlet/lane-3 c1: wrap header buttons, stack export lockup, un-bleed tab bar, wrap headings/tallies — 0 overflow, 0 overlap"*.

Ground truth the builder quoted before editing — all 42 overflows and all 3 overlaps:

| Shot group | Findings |
|---|---|
| `report__mobile__{top,scrolled,reduced-motion}` (×3 each) | `html` 409/390/**19px** · `header > div` 385/342/**43px** · `main > div` 366/342/**24px** |
| `report__desktop__{top,scrolled,reduced-motion}` (×1 each) | `main > div` 1016/992/**24px** — *a desktop overflow, in scope: R5a demands 0 at 1280 too* |
| `tabbar__mobile__*`, `tabbar__desktop__*` | identical to the report rows above |
| `export__mobile__{top,scrolled,reduced-motion}` (×6 each) | `html` 421/390/**31px** · header lockup 212/167/**45px** · card 259/250/**9px** · three `h2` 213/170/**43px**, 197/170/**27px**, 185/170/**15px** |
| overlaps (×1 per export mobile state) | export header lockup × date block, **13.2%** |

All `js-disabled` states were 0/0 at baseline and are 0/0 now.

**Changes, and the reason for each:**

| File | Change | Why |
|---|---|---|
| `app/page.tsx` | header row gets `flex-wrap gap-y-2.5` (existing `gap-2.5` token) | The button group drops below the lockup at 390px instead of forcing the row wider than `clientWidth`. Root cause of the 43px header overflow and most of `html`'s 19px. |
| `components/section-tabs.tsx` | removed the sticky tab bar's `-mx-6 px-6` bleed | The pair exactly cancelled `main`'s own `px-6` — a pure box-model expansion with no visual effect, whose only real effect was tripping `main > div`'s scrollWidth at **both** 390 and 1280. |
| `components/report-renderer.tsx` | `overflow-wrap: break-word` on h1–h4 | Engages only where a heading would otherwise overflow (the export document's narrower column). |
| `lib/export-document.ts` | `.doc-head` gets `flex-wrap`; `.doc-title` gets `overflow-wrap: break-word` | The date stacks below the lockup instead of overlapping it — this closes the 13.2% overlap. |
| `components/grade-card.tsx` | severity-tally row gets `flex-wrap` | Never triggers in the app report view; engages under the export document's tighter padding. Grade badge glyph untouched. |

No `overflow: hidden`. No new breakpoint. No new spacing value. No colour or copy touched — lanes 1 and 2 stayed closed.

### Critic table — LANE 3 / CYCLE 1 (verbatim)

LANE: 3 — LAYOUT (390 px)
CYCLE: 1

| Row | Verdict | Evidence |
|---|---|---|
| R5a | PASS | layout.json: horizontalOverflowCount sums to 0 at mobile(390) and 0 at desktop(1280) across all 24 findings. |
| R5b | PASS | layout.json: overlapCount sums to 0 across all 24 findings (mobile and desktop). |
| R5c | PASS | Current 1280 findings: 0 overflow, 0 overlap (all 12 desktop entries show horizontalOverflowCount:0, overlapCount:0). Lane baseline 1280 findings: 6 overflow (report__desktop__top/scrolled/reduced-motion each 1, tabbar__desktop__top/scrolled/reduced-motion each 1), 0 overlap. No new finding introduced; count only decreased (6→0). Desktop pixel-diff vs lane baseline (reported, not graded here): report__desktop__{top,scrolled,reduced-motion} 0.0017%, report__desktop__js-disabled 0.0000%, tabbar__desktop__scrolled 0.0047%, tabbar__desktop__{top,reduced-motion,js-disabled} 0.0000%, export__desktop__all 0.0000%. |
| R9 | FAIL | 5 of 16 declared-unchanged shots measured non-zero: report__desktop__top 0.0017%, report__desktop__scrolled 0.0017%, report__desktop__reduced-motion 0.0017%, tabbar__desktop__scrolled 0.0047%, tabbar__mobile__scrolled 0.3749%. |
| R2/R3 | PASS | styles.json: "unlisted":[] for both surfaces (report unlisted: 0, export unlisted: 0). |
| R7 | PASS | perf.json vs baseline 96/96/96/100 · 100/96/96/100 · 96/96/96/100 · 100/96/96/100 (report mobile/desktop, export mobile/desktop): actual scores are report__mobile 96/100/96/100, report__desktop 100/100/96/100, export__mobile 96/100/96/100, export__desktop 100/100/96/100 — every component ≥ its baseline value. |
| R8 | PASS | `git diff --stat HEAD~1 HEAD`: app/page.tsx, components/grade-card.tsx, components/report-renderer.tsx, components/section-tabs.tsx, lib/export-document.ts — all ⊆ {app/page.tsx, components/**, lib/export-document.ts, app/globals.css}. |
| R1 (carryover) | PASS | vocab.json hitCount 9, all 9 hits are in lib/prompts.ts or app/api/evaluate/route.ts (both excluded paths); in-scope hit count = 0. |
| R4/R4b (carryover) | PASS | a11y.json: violationCount 0 for all 4 runs (report__mobile, report__desktop, export__mobile, export__desktop); contrastFailures: []. |

SUMMARY: Largest remaining gap is R9 — tabbar__mobile__scrolled, declared unchanged, measured at 0.3749% pixel-diff against the lane baseline.

**Builder c2** — the R9 FAIL row was handed to a fresh builder verbatim as its entire DO list, with the instruction that R9 grades a *declaration* and there are exactly two honest closures: **(a)** the movement is an unintended side effect, find and remove it; or **(b)** the movement is the unavoidable footprint of a fix R5a made mandatory, in which case the previous declaration was wrong and the correct output is an accurate one. The builder was told that "it was necessary" without naming the pixels would not be accepted.

The builder pixel-diffed all 24 shots and inspected the differing regions, and returned **(b) for all five, with the pixels named**:

- `report__desktop__{top,scrolled,reduced-motion}` — 48 differing pixels each. Two clusters: sub-pixel glyph-edge antialiasing, and a genuine ~1px band at **x=120–143 and x=1136–1159 — each exactly 24px wide**, where the pixel goes from a blended border colour `[215,206,222]` to pure `--ivory` `[255,243,240]`. **24px is exactly the `-mx-6 px-6` pair `e52110b` removed from `section-tabs.tsx`** to satisfy R5a at 1280. Removing a negative-margin/padding cancellation is not bit-exact: the tab bar's `border-b` resolves its far edges at a fractionally different sub-pixel position, exposing a sliver of ground that was previously blended into the border.
- `tabbar__desktop__scrolled` — 48 differing pixels, **identical to the above, offset in y by exactly 1160px** (the scroll to the tab-bar anchor within the 800px viewport capture). Same border footprint.
- `tabbar__mobile__scrolled` — the 0.3749% outlier. Sub-pixel diffs at y≈272 (under the "ACCESSIBILITY" chip, directly beneath the sticky tab bar) and y≈467–476 (card border / heading glyph edges). Same `section-tabs.tsx` box-model change; it reads two orders of magnitude larger because at 390px the removed 24px pair is a much larger fraction of viewport width, and the anchor scroll puts the changed element and everything below it in frame.

**NO CODE CHANGE, no commit** — the closure was an accurate declaration, not an edit. Instruments were re-run anyway and reproduced the cycle-1 figures exactly.

### Critic table — LANE 3 / CYCLE 2 (verbatim)

LANE: 3 — LAYOUT (390 px)
CYCLE: 2

| Row | Verdict | Evidence |
|---|---|---|
| R5a | PASS | layout.json: horizontalOverflowCount sums to 0 at viewport=mobile(390) and 0 at viewport=desktop(1280), across all 8 findings per viewport (report/tabbar × top/scrolled/reduced-motion/js-disabled). |
| R5b | PASS | layout.json: overlapCount sums to 0 at mobile(390) and 0 at desktop(1280). |
| R5c | PASS | Foreman ruling applied: no 1280 overflow/overlap in current layout.json is absent from lane baseline (current has none at all). Desktop finding count: baseline=6 (report__desktop__top/scrolled/reduced-motion + tabbar__desktop__top/scrolled/reduced-motion, each 1 horizontalOverflow, selector "body > div:nth-of-type(2) > main > div", overflowPx=24), current=0. Decreased, none introduced. Desktop pixel-diff (reported only): report__desktop__{top,scrolled,reduced-motion} 0.0017%, tabbar__desktop__scrolled 0.0047%, tabbar__desktop__{js-disabled,reduced-motion,top} 0.0000%. |
| R9 | PASS | All 11 declared-0.00% shots measured at 0.0000% with no DIMENSION CHANGE: export__desktop__{js-disabled,reduced-motion,scrolled,top}, export__mobile__js-disabled, report__desktop__js-disabled, report__mobile__js-disabled, tabbar__desktop__{js-disabled,reduced-motion,top}, tabbar__mobile__js-disabled. Declared-to-move shots (not graded, restated): export__mobile__{reduced-motion,scrolled,top} DIMENSION CHANGE 421x10740→390x10936; report__mobile__{reduced-motion,scrolled,top} DIMENSION CHANGE 409x3691→390x3696; tabbar__mobile__{reduced-motion,top} 10.1780%; tabbar__mobile__scrolled 0.3749%; report__desktop__{top,scrolled,reduced-motion} 0.0017%; tabbar__desktop__scrolled 0.0047%. |
| R2/R3 | PASS | styles.json: "unlisted": [] for surface "report" and "unlisted": [] for surface "export" — 0 unlisted colour/font values on both. |
| R7 | PASS | perf.json vs baseline (perf/a11y/best-practices/seo): report__mobile 96/100/96/100 (baseline 96/96/96/100); report__desktop 100/100/96/100 (baseline 100/96/96/100); export__mobile 96/100/96/100 (baseline 96/96/96/100); export__desktop 100/100/96/100 (baseline 100/96/96/100). No score below baseline in any of the 16 metric cells. |
| R8 | PASS | Handed R8 SCOPE READING lists 5 files. Re-run `git diff --stat 57fcb1a HEAD` shows 9 changed files: app/globals.css, app/page.tsx, components/context-panel.tsx, components/drop-zone.tsx, components/export-document.tsx, components/grade-card.tsx, components/report-renderer.tsx, components/section-tabs.tsx, lib/export-document.ts. All 9 are within {app/page.tsx, components/**, lib/export-document.ts, app/globals.css}; 0 files outside scope. |
| R1 (carryover) | PASS | vocab.json: hitCount=9, all 9 hits located in lib/prompts.ts (7) or app/api/evaluate/route.ts (2) — both excluded from this row's scope. In-scope hit count = 0, no regression possible below 0. |
| R4/R4b (carryover) | PASS | a11y.json: violationCount=0 and contrastFailures=[] across all 4 runs (report__mobile, report__desktop, export__mobile, export__desktop); incompleteCount 1/1/0/0 respectively (not violations). |

SUMMARY: Largest remaining gap is tabbar__mobile__{reduced-motion,top} at 10.1780% pixel-diff vs lane baseline — declared-to-move and not graded by R9, but the largest movement on record this cycle.

**Verdict: DONE.** 42 → 0 horizontal overflows (390 **and** 1280), 3 → 0 text overlaps.

---

## BASELINE → FINAL

| Instrument | Cycle 0 | Final | Δ |
|---|---|---|---|
| vocab hits (user-facing, in-scope) | 4 | **0** | −4 |
| vocab hits (total, incl. parked prompt copy) | 13 | 9 | −4 |
| axe violations | 4 | **0** | −4 |
| contrast failures | 48 | **0** | −48 |
| horizontal overflows @ 390 | 36 | **0** | −36 |
| horizontal overflows @ 1280 | 6 | **0** | −6 |
| text overlaps | 3 | **0** | −3 |
| unlisted colour/font values | 0 | 0 | 0 |
| Lighthouse — report mobile | 96/96/96/100 | 96/**100**/96/100 | a11y +4 |
| Lighthouse — report desktop | 100/96/96/100 | 100/**100**/96/100 | a11y +4 |
| Lighthouse — export mobile | 96/96/96/100 | 96/**100**/96/100 | a11y +4 |
| Lighthouse — export desktop | 100/96/96/100 | 100/**100**/96/100 | a11y +4 |

Every critic row across all three lanes ended PASS. No lane hit a cap.

| Lane | Cycles | Verdict |
|---|---|---|
| 1 — Vocabulary | 1 | **DONE** |
| 2 — Contrast & A11y | 1 | **DONE** |
| 3 — Layout (390 px) | 2 | **DONE** |

**CAPPED deltas: none.** All three lanes closed on quality, not on a cap.

---

## Before / after shots

**Before** = `gauntlet/baseline/` — the committed cycle-0 original, never overwritten during this run.
**After** = `gauntlet/run-1-final/` — the 24 shots as they stand at the end of run 1.

Final pixel-diff vs the committed original (`gauntlet/out/diff.json`), all 24:

| Shot | Δ vs original | Shot | Δ vs original |
|---|---|---|---|
| report__mobile__top | **size 409×3691 → 390×3696** | report__desktop__top | 0.0081% |
| report__mobile__scrolled | **size 409×3691 → 390×3696** | report__desktop__scrolled | 0.0081% |
| report__mobile__reduced-motion | **size 409×3691 → 390×3696** | report__desktop__reduced-motion | 0.0081% |
| report__mobile__js-disabled | 0.0000% | report__desktop__js-disabled | 0.0000% |
| tabbar__mobile__top | **10.1422%** | tabbar__desktop__top | 0.0176% |
| tabbar__mobile__scrolled | 0.3749% | tabbar__desktop__scrolled | 0.0047% |
| tabbar__mobile__reduced-motion | **10.1422%** | tabbar__desktop__reduced-motion | 0.0176% |
| tabbar__mobile__js-disabled | 0.0000% | tabbar__desktop__js-disabled | 0.0000% |
| export__mobile__top | **size 421×10740 → 390×10936** | export__desktop__top | 0.0017% |
| export__mobile__scrolled | **size 421×10740 → 390×10936** | export__desktop__scrolled | 0.0017% |
| export__mobile__reduced-motion | **size 421×10740 → 390×10936** | export__desktop__reduced-motion | 0.0017% |
| export__mobile__js-disabled | 0.0000% | export__desktop__js-disabled | 0.0000% |

The six **size** rows are the win itself: the mobile page no longer scrolls sideways, so the full-page capture is now exactly 390px wide instead of 409 or 421.

Read the pairs directly — the mobile ones carry the visible change:

| Lane | Before | After |
|---|---|---|
| 3 (390) | `gauntlet/baseline/report__mobile__top.png` | `gauntlet/run-1-final/report__mobile__top.png` |
| 3 (390) | `gauntlet/baseline/export__mobile__top.png` | `gauntlet/run-1-final/export__mobile__top.png` |
| 3 (390) | `gauntlet/baseline/tabbar__mobile__top.png` | `gauntlet/run-1-final/tabbar__mobile__top.png` |
| 1+2 (1280) | `gauntlet/baseline/report__desktop__top.png` | `gauntlet/run-1-final/report__desktop__top.png` |
| 1+2 (1280) | `gauntlet/baseline/export__desktop__top.png` | `gauntlet/run-1-final/export__desktop__top.png` |
| 1+2 (1280) | `gauntlet/baseline/tabbar__desktop__top.png` | `gauntlet/run-1-final/tabbar__desktop__top.png` |

---

## TASTE: Commander

Three items. None was decided by a builder; all three are yours.

**1. The Run Audit CTA still fails contrast — and was deliberately left failing.**
`app/page.tsx`, the primary CTA, `bg-accent text-ivory`, ivory on vermilion at 13.6px = **3.06:1** against a 4.5:1 requirement. It is the same failing pairing the lane fixed on two other buttons, but it is a hero element and the key forbids a builder from deciding brand feel. It does not appear in the instrument counts because `gauntlet:a11y` only scans the `report` and `export` surfaces, and the Run Audit button lives on the idle input screen. **The gauntlet reads 0 contrast failures; the app still has this one.** Options, measured:

| Option | Ratio | Note |
|---|---|---|
| Keep `text-ivory` (current) | 3.06:1 | Fails. Preserves the vermilion-block / ivory-text CTA the brand kit uses. |
| `text-text-primary` (navy-soft) | 4.86:1 | Passes. Same swap already shipped on Export report and Discard. |
| `text-navy` (solid navy) | 4.56:1 | Passes, thin margin. |
| `--abyss` primitive | 6.06:1 | Passes with room. Exists in `:root` but has no `@theme` alias today; would need one. |

**2. Two secondary CTAs already changed hue, and you have not seen them yet.**
The lane-2 builder judged Export report and Discard-and-start-over to be secondary, not hero, and shipped `text-ivory` → `text-text-primary` on both (3.06:1 → 4.86:1). That call was inside its authority, and it is the reason `report__desktop__*` moved at all. If you disagree that those two are secondary, this is the place to say so — the fix is one token per button.

**3. `tabbar__mobile__{top,reduced-motion}` moved 10.18%.**
That is the header button group wrapping to a second row at 390px. It is the intended fix and it is the largest visual change in the run. Worth your eye on `gauntlet/run-1-final/tabbar__mobile__top.png` before this thaws.

---

## Parked (gauntlet)

**Vocabulary — 9 hits, all out of scope by FREEZE.md** ("OUT: engine (lib/, app/api/), prompts"). Listed, not counted, not touched:

| File | Line | Term |
|---|---|---|
| `app/api/evaluate/route.ts` | 169 | screen |
| `lib/prompts.ts` | 25 | issue |
| `lib/prompts.ts` | 29 | problem |
| `lib/prompts.ts` | 31 | criticism |
| `lib/prompts.ts` | 156 | screen — *instructs the model NOT to say "Screen N"; contains the literal banned string by design* |
| `lib/prompts.ts` | 190 | problem |
| `lib/prompts.ts` | 317 | issue |
| `lib/prompts.ts` | 319 | issue |
| `lib/prompts.ts` | 320 | problem |

**Other parked items:**
- The Run Audit CTA contrast fix — blocked on the taste call above.
- `--abyss` is a `:root` primitive with no `@theme` alias. Only relevant if you pick that option for the CTA.
- **`gauntlet:a11y` and `gauntlet:perf` do not scan the idle input screen.** They cover `report` and `export` only, by design (`gauntlet/README.md`: *"a third scan would just repeat the first"* — true for `tabbar`, which shares the report's DOM, but the **idle input screen is a genuinely different DOM that nothing scans**). That blind spot is why item 1 above reads as 0 in the instruments. A run-2 candidate: a fourth surface for the idle state.
- Nothing else was flagged by any builder as worth a "while we're in there".

---

## Deviations from the ignition key

**1. R5c was reworded by foreman ruling, and the critics were told so explicitly.**
The key writes R5c as *"layout.json at 1280 unchanged vs lane baseline"*, while R5a demands *"horizontal overflows = 0 at 390 and 1280"* — and the lane-3 baseline had **6 non-zero desktop findings**. Both cannot hold literally: closing R5a requires changing layout.json at 1280. Ruling applied and handed to both lane-3 critics verbatim: **no desktop finding introduced; desktop findings may only decrease or stay equal.** Under the literal wording R5c would have been an unclosable FAIL; under the ruling it is a genuine PASS at 6 → 0. Desktop pixel-diff was reported per shot and not thresholded, exactly as the key specifies.

**2. Lane 3 cycle 2 closed a FAIL row with no code change.**
R9 grades a *declaration*, so an inaccurate declaration is a legitimate way to fail it and an accurate one a legitimate way to close it. The foreman required the builder to name the moved pixels and prove the movement was forced by R5a before accepting that route; it did (the 24px band matching the removed `-mx-6 px-6`, and the same footprint offset by exactly 1160px on the scrolled capture). **Flagged plainly because it is the one place in this run where a row went FAIL → PASS without the app changing.** The Commander should read that closure on its evidence, not on its verdict.

**3. A foreman-side pixel-diff instrument was used, outside the repo.**
`gauntlet:diff` compares against `gauntlet/baseline/`, the committed original, which the key forbids overwriting during the run. Measuring R9 against the *lane* baseline therefore needed a second comparison. A throwaway script (same `pixelmatch`, same 0.1 threshold as `gauntlet/scripts/diff.mjs`) was run from the scratchpad, never written into the repo. No `gauntlet/` file was modified.

**4. `gauntlet/run-1-final/` was added.**
`gauntlet/out/` is gitignored, so the report's before/after grid would have resolved to nothing on the branch. The 24 final shots are committed there as a report artifact. No instrument reads that folder.

**5. `.gitignore` gained one line** — `gauntlet/lane-baseline/` — so the lane baseline stayed local, as the key requires ("gitignored, local only").

**Not deviations, recorded for completeness:** no cap was hit; no stop condition fired; no builder proposed a new hue, hex, or dependency; no file under `app/api/`, `lib/prompts.ts`, or `lib/ai-config.ts` was touched.

---

## Instrument versions

| Instrument | Version |
|---|---|
| `@playwright/test` | ^1.62.1 |
| `@axe-core/playwright` | ^4.13.0 |
| `@lhci/cli` | ^0.15.1 |
| `pixelmatch` | ^7.2.0 |
| `pngjs` | ^7.0.0 |
| Next.js | ^15.1.0 (`next start`, production build, port 4173) |
| Node | v25.6.1 |

Gauntlet scripts unchanged from `57fcb1a` — no instrument was edited during this run.

## Actual model usage per spawn

Routing proof returned **Claude Sonnet 5**; every builder and critic ran on Sonnet, foreman on Opus. **8 spawns of a 30 cap.**

| # | Spawn | Model | Tokens | Tool uses | Duration |
|---|---|---|---|---|---|
| 1 | routing proof | Sonnet 5 | 50,520 | 0 | 1.8s |
| 2 | lane-1 builder c1 | Sonnet 5 | 77,303 | 17 | 69s |
| 3 | lane-1 critic c1 | Sonnet 5 | 64,338 | 8 | 39s |
| 4 | lane-2 builder c1 | Sonnet 5 | 98,738 | 28 | 231s |
| 5 | lane-2 critic c1 | Sonnet 5 | 67,970 | 8 | 32s |
| 6 | lane-3 builder c1 | Sonnet 5 | 142,060 | 45 | 660s |
| 7 | lane-3 critic c1 | Sonnet 5 | 69,629 | 8 | 48s |
| 8 | lane-3 builder c2 | Sonnet 5 | 112,151 | 33 | 350s |
| 9 | lane-3 critic c2 | Sonnet 5 | 69,016 | 8 | 61s |

*(9 rows, 8 of them builder+critic — the routing proof is not a builder or critic spawn and does not count against the 30.)*
Total sub-agent tokens: **751,725**. No spawn inherited Opus.

## Wall-clock

Cycle 1 started 13:06. Five full `gauntlet:all` runs at ~122s each, plus one standalone `gauntlet:shots` in pre-flight.
**Used: ~52 minutes of the 150-minute cap.** No cap approached.

---

*Report ends. Nothing here was graded by the session that built it — every verdict above is a fresh Sonnet critic's, quoted verbatim.*
