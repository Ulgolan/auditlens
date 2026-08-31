# GAUNTLET REPORT — Run 2, AuditLens

*Under IGNITION KEY v1.2, as amended by tribunal 2026-08-31 (contingent-lane
authority Commander-ratified "free"). Foreman: Opus (Claude Code). Builders +
critics: Sonnet, fresh spawn each cycle, post-intro pricing. Bar = rulebook
(option A, v1.2). Reference = `gauntlet/baseline/` (DESIGN GATE 31.08 approved
state); option B retired for AuditLens 2.0.*

## Header

- **Branch:** `gauntlet/run-2`, created from `origin/main` at `b25f35016c9b19cf5f164ebef62c088dde95bf52`.
- **HEAD at branch time:** `b25f35016c9b19cf5f164ebef62c088dde95bf52` (identical to `origin/main`).
- **Wall-clock start (cycle 1):** _recorded at cycle 1_.

### Pre-flight (all seven)

**1. Reference exists.** `gauntlet/baseline/` (40 PNGs — the DESIGN GATE 31.08
approved render, re-seeded under the Commander-ratified ruling of 2026-08-31),
plus the tokens in `app/globals.css`, plus this key's rulebook. Option B
(Claude Design reference frames) is **retired**, not parked —
`gauntlet/README.md` Reference section, `PIPELINE.md` station 6, `FREEZE.md`.
There is no `gauntlet/reference/` folder and none is planned. **PASS.**

**2. FREEZE.md present, unchanged since the setup-2 merge.**
`git log 7f004af..origin/main -- FREEZE.md` → empty. Last commit touching it is
`1b7db9a gauntlet: FREEZE.md — Gauntlet run 2`, which precedes the setup-2 merge
`7f004af`. Working tree clean for that path. Quoted IN line, verbatim:

> "IN: idle input screen (cold and armed), report screen, tab bar
> (all states), export document. Ivory Loom only. Run Audit CTA
> armed-state text → text-navy (Commander ruling 2026-08-31);
> cold-state disabled pill unchanged (WCAG 1.4.3 exempts inactive
> controls — quote the clause in the report when claiming it)."

**PASS.**

**3. Branch + SHAs recorded.** `git branch --show-current` → `gauntlet/run-2`.
`git rev-parse HEAD` = `git rev-parse origin/main` =
`b25f35016c9b19cf5f164ebef62c088dde95bf52`, which is the key's stated authoring
SHA (`b25f3501`).

*Foreman note, recorded not hidden:* the **local** `main` ref was stale at
`7f004afe0cc8e9fa1e0de9f744d4a7a6da1bf856` (the setup-2 merge, PR #8) — one
merge commit behind. `origin/main` after `git fetch` is `b25f350` (PR #9,
`docs/ledger-session-close`). The branch was cut from `origin/main`, which is
what the key names by SHA. Local `main` was not fast-forwarded; no ref was
rewritten. **PASS.**

**4. CAPS** written into this header before cycle 1 — see CAPS below. **PASS.**

**5. Gate Zero PASS carry.** Confirmed against `LEDGER.md` 2026-08-30 **corrected**
table: (2) secrets/secret-scanning PASS — ruleset "main-harness" (id `20875261`)
active on `main` with required status check "harness", repo public, push
protection ON at user level; (3) wallet guard PASS — Anthropic console monthly
spend limit $30, Vercel Hobby has hard limits only; (5) rate limit PASS —
limiter at `app/api/evaluate/route.ts:51` runs before the client call at `:202`,
hermetic test asserts `fetch` is never invoked once the limit trips. Items 1, 4,
6 carry as previously ruled (RLS N/A, zero `dangerouslySetInnerHTML`,
server-side auth N/A).

**Confirmed: no file under `app/api/`, `lib/prompts.ts`, or `lib/ai-config.ts`
will be touched this run.** The 9 vocab hits inside `lib/prompts.ts` and
`app/api/evaluate/route.ts` are parked by path under FREEZE:

> "OUT: engine (lib/, app/api/), prompts (9 parked vocab hits — separate key)"

**PASS.**

**6. ROUTING PROOF.** One trivial spawn, no tools, asked to report its own model.
Returned verbatim: **"Claude Sonnet 5, model ID: claude-sonnet-5"**. Sonnet
expected, Sonnet delivered. Builders and critics run on Sonnet; foreman on Opus.
**PASS.**

**7. SERVER GROUND TRUTH.** Confirmed in `gauntlet/scripts/lib.mjs`:
`export const PORT = 4173;` and `spawn("npx", ["next", "start", "-p", String(PORT)])`
— a real `next start` production build, not `next dev`. Surface paths, verbatim
from `lib.mjs` `SURFACES`:

```
{ id: "report",     path: "/?fixture=gauntlet",                fullPage: true  }
{ id: "tabbar",     path: "/?fixture=gauntlet",                fullPage: false }
{ id: "export",     path: "/?fixture=gauntlet&view=export",    fullPage: true  }
{ id: "idle",       path: "/",                                 fullPage: true  }
{ id: "idle-armed", path: "/?fixture=gauntlet&view=idle",      fullPage: true  }
```

Idle = `/` (cold), idle-armed = `/?fixture=gauntlet&view=idle`, exactly as the
key states. **PASS.**

### CAPS (written before cycle 1)

| Cap | Value |
|---|---|
| Max lanes | 3 |
| Max cycles per lane | 4 |
| Max builder + critic spawns | 24 |
| Max wall-clock | 120 min from cycle 1 |
| `gauntlet:all` stop threshold | 240s |
| Cycle-0 capture cost (setup-2 measurement) | 213.5s local / 215s fresh clone |

The wall-clock is the **SPEND** guard and binds before cycle exhaustion by
design; cycles are the **SCOPE** guard. Any cap hit = lane CAPPED, delta
recorded, move on. Never "one more". A CAPPED lane with a reported delta is a
legitimate outcome, not a failure.

---

## BASELINE — cycle 0 (no edits)

`npm run gauntlet:all`, exit code **0**, wall-clock **212.2s** — under the 240s
stop threshold, and just under setup-2's measured 213.5s local. No stop
condition fired.

SUMMARY.md table, copied verbatim:

| Instrument | Files produced | Headline number |
|---|---|---|
| shots | gauntlet/out/shots/*.png | 40 PNGs |
| diff | gauntlet/out/diff.json, gauntlet/out/diffs/*.png | worst mismatch: 0% (report__mobile__top.png) |
| styles | gauntlet/out/styles.json | 0 unlisted colour/font values |
| a11y | gauntlet/out/a11y.json | 2 axe violations, 2 contrast failures |
| layout | gauntlet/out/layout.json | 0 horizontal overflows, 0 text overlaps |
| vocab | gauntlet/out/vocab.json | 9 banned-term hits |
| perf | gauntlet/out/lhci/*.json, gauntlet/out/perf.json | report__mobile: P96/A100, report__desktop: P100/A100, export__mobile: P96/A100, export__desktop: P100/A100, idle__mobile: P96/A100, idle__desktop: P100/A100, idle-armed__mobile: P96/A95, idle-armed__desktop: P100/A95 |

**Timing per instrument:** shots 50s · diff 5.8s · styles 4.4s · a11y 10.1s ·
layout 47.3s · vocab 0.1s · perf 86.3s · **total 212.2s**.

### DECLARED EXPECTATIONS — graded (drift = STOP)

| Expectation | Measured | Verdict |
|---|---|---|
| shots = 40 PNGs | `gauntlet/out/shots/` = 40 PNGs; SUMMARY headline "40 PNGs" | **MATCH** |
| diff = 40/40 @ 0.0000% vs `gauntlet/baseline/` | `diff.json`: `against` = `gauntlet/baseline`, `images.length` = 40, entries with `status !== "compared"` = **0**, entries with `mismatchPercent !== 0` = **0**. Sample entry: `{"name":"report__mobile__top.png","status":"compared","maskedRegions":0,"mismatchedPixels":0,"totalPixels":1441440,"mismatchPercent":0}` | **MATCH** |
| a11y idle-armed = exactly 1 color-contrast violation, 3.06:1, Run Audit CTA, both viewports | `a11y.json` `runs[]`: `idle-armed__mobile` violations = 1, `idle-armed__desktop` violations = 1; both `id: "color-contrast"`, 1 node each, target `".py-\\[1\\.15em\\]"`. `contrastFailures[]` (2 entries, one per viewport): `actualRatio` **3.06**, `requiredRatio` "4.5:1", `foreground` `#fff3f0`, `background` `#ff4d00`, `fontSize` "11.8pt (15.68px)", `fontWeight` "normal" | **MATCH** |
| a11y idle (cold) = 0 violations | `a11y.json` `runs[]`: `idle__mobile` violations = 0, `idle__desktop` violations = 0. No axe rule fires on the disabled pill — consistent with WCAG 1.4.3 exempting inactive controls, as `FREEZE.md` records | **MATCH** |
| vocab = 9 hits, all in `lib/prompts.ts` + `app/api/evaluate/route.ts`; in-scope = 0 | `vocab.json`: 9 hits total, grouped by file = `{"lib/prompts.ts": 8, "app/api/evaluate/route.ts": 1}`. Zero hits outside the two FREEZE-parked paths → **in-scope = 0** | **MATCH** |

No drift. **No STOP condition.** Cycle 0 proceeds to lanes.

Two figures are worth naming because they are *not* drift but do differ from
earlier text. The SUMMARY's "2 axe violations" is the sum across the eight
scanned runs (1 on `idle-armed__mobile` + 1 on `idle-armed__desktop`), which is
exactly the key's "exactly 1 ... both viewports" — not two violations on one
surface. And the CTA's `fontSize` reads 15.68px here where the run-1/setup-2
ledger text says 13.6px; the ratio (3.06), the colours, the target and the
required threshold are identical, and font size is not a declared expectation,
so this is recorded, not graded.

### FIRST GROUND TRUTH — recorded, not graded

No ledgered measurement exists for these three instruments on the idle surfaces;
setup-2 ran them but never receipted them. Recorded here so run 3 has ground.

| Instrument | Idle-surface reading |
|---|---|
| **styles** | `styles.json` `surfaces[]`: `idle` = 159 elements, **0** unlisted colour/font values; `idle-armed` = 161 elements, **0** unlisted. (For comparison, in-fence run-1 surfaces: `report` 440 elements / 0 unlisted, `export` 1169 / 0.) `tabbar` is not scanned by `styles` — it renders the same DOM as `report`. |
| **layout** | `layout.json` `findings[]` = 40 entries (5 surfaces × 2 viewports × 4 states), `overlapPercentTolerance` 5. Every entry reads `horizontalOverflowCount: 0, overlapCount: 0` — idle and idle-armed included, at 390 and 1280, in all four states. Instrument log confirms coverage: `"gauntlet:layout — 40 surface x viewport x state combos. 0 horizontal-overflow findings, 0 text overlaps."` |
| **perf** | `perf.json` `runs[].scores` (performance / accessibility / bestPractices / seo): `idle__mobile` 96/100/96/100 · `idle__desktop` 100/100/96/100 · `idle-armed__mobile` 96/**95**/96/100 · `idle-armed__desktop` 100/**95**/96/100. |

**Findings on the idle surfaces: none that is not already Lane 1's.** styles and
layout are clean at zero. The only sub-100 cell anywhere in perf is
`idle-armed` accessibility at 95 on both viewports, and that is Lighthouse
scoring the same single `color-contrast` failure on the Run Audit CTA that Lane 1
exists to fix — not an independent finding.

**No drift on the three run-1 surfaces** (`report` / `tabbar` / `export`): 0.0000%
pixel-diff on all 24 of their shots, 0 layout findings, 0 unlisted style values,
0 axe violations. Nothing new to report, so no STOP.

**CONSEQUENCE FOR LANES 2-3:** the key authorises contingent lanes *only* from
cycle-0 FIRST-GROUND-TRUTH findings on the idle surfaces. There are none.
**Lanes 2 and 3 are NOT OPENED** — a legitimate outcome under the key, not a
shortfall.

### Full R7 baseline (all eight runs, for every later cycle to be graded against)

| Run | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| report__mobile | 96 | 100 | 96 | 100 |
| report__desktop | 100 | 100 | 96 | 100 |
| export__mobile | 96 | 100 | 96 | 100 |
| export__desktop | 100 | 100 | 96 | 100 |
| idle__mobile | 96 | 100 | 96 | 100 |
| idle__desktop | 100 | 100 | 96 | 100 |
| idle-armed__mobile | 96 | 95 | 96 | 100 |
| idle-armed__desktop | 100 | 95 | 96 | 100 |

### Lane baseline seeded

`gauntlet/out/shots/` → `gauntlet/lane-baseline/shots/` (**40** PNGs), plus
`layout.json` and `a11y.json`. Local only, gitignored
(`git check-ignore -v` → `.gitignore:18:gauntlet/lane-baseline/`). Working tree
otherwise clean at cycle-0 close — `git status --porcelain` showed only the
untracked `GAUNTLET_REPORT_RUN2.md`. `gauntlet/baseline/` is untouched for the
whole run and serves the before/after grid.

---

## LANE 1 — Run Audit CTA armed state: `text-ivory` -> `text-navy`

Mandatory lane, Commander-ruled 2026-08-31, FREEZE-recorded. One variable.
Wall-clock start (cycle 1): **2026-08-31 22:49:44 EEST**.

### Cycle 1 — builder (Sonnet, fresh spawn)

**Change.** `app/page.tsx:757`, the `canEvaluate` (armed) branch of the CTA
ternary at 753-759:

- before: `"bg-accent text-ivory cursor-pointer hover:-translate-y-[2px]"`
- after: `"bg-accent text-navy cursor-pointer hover:-translate-y-[2px]"`

The cold branch at `app/page.tsx:758`
(`"border border-border text-text-tertiary cursor-not-allowed"`) is untouched,
as FREEZE requires. No copy changed. Commit `1031a922d12994e0ed19e4df19e2fd8ce04d8651`,
`app/page.tsx` only.

**No new hue/hex.** `--navy: #080b83` is defined at `app/globals.css:23` and
exposed as the Tailwind v4 theme token `--color-navy: var(--navy)` at
`app/globals.css:100`, which is what generates the `.text-navy` utility. The
class is already in service at `components/grade-card.tsx:22`,
`components/audience-selector.tsx:22`, `components/framework-toggles.tsx:47,53`
and `components/context-panel.tsx:87`. A new token would have been a FAIL under
FREEZE, not a fix; this is an existing one.

**Pre-commit verify (C4), each command's own exit code, stderr unsuppressed:**

| Command | Exit | Output |
|---|---|---|
| `npm run lint` | 0 | 0 errors; 3 pre-existing `<img>` -> `next/image` warnings (`context-panel.tsx:63`, `drop-zone.tsx:100`, `export-document.tsx:138`) — run-1 backlog, unrelated, untouched |
| `npm run test` | 0 | 6 files, 13 tests passed |
| `npm run format:check` | 0 | "All matched files use Prettier code style!" |

### The declaration, and its correction

The builder's first declaration named **2** shots to move
(`idle-armed__{mobile,desktop}__top.png`) and carried an explicit self-named gap:
it had not checked whether `idle-armed` has `scrolled` / `reduced-motion`
variants. It does — the set is 5 surfaces x 2 viewports x 4 states, so
`idle-armed` has 8 shots. The foreman sent it back to close the gap **from
pixels**, per C2: a corrected declaration is a legitimate closure only with
traced pixel evidence naming the mechanism. No code change was permitted or
made; the commit stands.

**Traced pixel evidence returned, two mechanisms, both named:**

1. **`js-disabled` renders COLD.** `gauntlet/baseline/idle-armed__mobile__js-disabled.png`
   and `idle-armed__desktop__js-disabled.png` show the disabled outline pill
   reading "ADD A SCREENSHOT OR DESCRIBE THE CONCEPT TO BEGIN" — not the armed
   orange CTA. Mechanism: the `?fixture=gauntlet&view=idle` override is applied
   client-side, so with JavaScript disabled it never fires. These two shots
   therefore do **not** move.
2. **`scrolled` degenerates to `top` on this surface, and both render ARMED.**
   `applyStatePostNav` (`gauntlet/scripts/lib.mjs:191-198`) calls
   `document.getElementById("gauntlet-tabbar-anchor")?.scrollIntoView(...)`.
   That anchor exists only inside the report panel (`app/page.tsx:827`, rendered
   when `showReport` is true) and is absent on the idle surfaces, so the
   optional chain makes the call a no-op and the page never scrolls. The capture
   is full-page, so `scrolled` and `top` are pixel-identical on any surface
   lacking the anchor. `reduced-motion` likewise renders the same static frame:
   the emulation only affects `prefers-reduced-motion` media queries and
   animation timing, and the CTA's only animation is a hover transform that a
   static screenshot never captures. All four of these shots show the armed CTA
   and all four move.

**CORRECTED DECLARATION — EXPECTED-TO-MOVE (6 of 40):**

`idle-armed__mobile__top.png` · `idle-armed__mobile__scrolled.png` ·
`idle-armed__mobile__reduced-motion.png` · `idle-armed__desktop__top.png` ·
`idle-armed__desktop__scrolled.png` · `idle-armed__desktop__reduced-motion.png`

**DECLARED UNCHANGED (34 of 40)** — 0.0000%, no dimension change: both
`idle-armed__*__js-disabled`, all 8 `idle__*`, all 8 `report__*`, all 8
`tabbar__*`, all 8 `export__*`.

### Cycle 1 — critic (Sonnet, fresh spawn)

Fresh spawn, did not author the change. Ran `npm run gauntlet:all` (exit **0**,
wall-clock **213s** per `gauntlet/out/SUMMARY.md` — under the 240s stop
threshold, no stop condition) and
`npm run gauntlet:diff -- --against gauntlet/lane-baseline/shots` (exit **0**)
for the R9 measurement.

*Reading note: `SUMMARY.md`'s heading string is a fixed label in the script and
reads "cycle 0" on every run. The file is the cycle-1 measurement; the heading
is not a claim about which cycle produced it.*

| Rule | Verdict | Evidence (file + field) |
|---|---|---|
| **R1** vocab | **PASS** | `vocab.json` hitCount = 9, all in `lib/prompts.ts` (8) and `app/api/evaluate/route.ts` (1). Zero hits outside the two FREEZE-parked paths -> in-scope = 0. |
| **R2/R3** styles | **PASS** | `styles.json` `surfaces[]`: `unlisted` = 0 on all four scanned surfaces; elementCounts 440 / 1169 / 159 / 161, identical to cycle 0. Token predates the change: `git log -S"--navy" -- app/globals.css` and `git log -S"text-navy"` both resolve to `b040022` (the re-skin), not to `1031a92`. No new hue/hex. |
| **R4** contrast | **PASS** | `a11y.json` `contrastFailures` = `[]`. Zero failures, so no exemption claimed and none needed. |
| **R4b** axe | **PASS** | `a11y.json` `runs[0..7].violations.length` = 0 for all eight runs. |
| **R5a** overflow | **PASS** | `layout.json` `findings[]`: all 40 entries `horizontalOverflowCount` = 0, at 390 and 1280. |
| **R5b** overlap | **PASS** | `layout.json` `findings[]`: all 40 entries `overlapCount` = 0, at 390 and 1280. |
| **R5c** desktop | **PASS** | Desktop findings hold at 0/0 against the cycle-0 lane baseline's 0/0. None introduced; the C1 wording ("decrease or hold") is satisfied by hold. |
| **R7** perf | **PASS** | `perf.json` `runs[].scores`, every component >= its cycle-0 reading: report_m 96/100/96/100, report_d 100/100/96/100, export_m 96/100/96/100, export_d 100/100/96/100, idle_m 96/100/96/100, idle_d 100/100/96/100, idle-armed_m 96/**100**/96/100 (a11y 95 -> 100), idle-armed_d 100/**100**/96/100 (a11y 95 -> 100). No FAIL row; **flake protocol not invoked**, no re-run spent. |
| **R8** diff scope | **PASS** | `git diff --stat b25f3501..HEAD` -> `app/page.tsx \| 2 +-`, one file, one insertion, one deletion. `git diff b25f3501..HEAD -- package.json` -> empty (byte-identical). Zero files under `app/api/`; `lib/prompts.ts` and `lib/ai-config.ts` untouched. `git status` shows only the untracked foreman working file. |
| **R9** declaration | **PASS** | `gauntlet:diff --against gauntlet/lane-baseline/shots`, exit 0. `diff.json`: exactly **6** images nonzero, and they are exactly the declared six — `idle-armed__{mobile,desktop}__{top,scrolled,reduced-motion}` (mobile 0.0509%, desktop 0.0228%). The other **34** read `mismatchPercent: 0`, `status: "compared"`; no entry anywhere in the file carries a dimension-mismatch status. Declared-to-move restated, not graded. |

### Lane acceptance test

**(a) axe violations on `idle-armed` 1 -> 0, both viewports.** `a11y.json`
`runs[6]` (`idle-armed__mobile`) `violations.length` = 0 and `runs[7]`
(`idle-armed__desktop`) `violations.length` = 0. Cycle 0 had exactly 1
`color-contrast` violation on each. **Confirmed.**

**(b) Contrast ratio >= 4.5:1, computed, not cited.** The critic was instructed
to treat the LEDGER's 4.56:1 as a claim to check, not a fact to repeat, and to
show its arithmetic. From `styles.json`, surface `idle-armed`, element
`body > div:nth-of-type(2) > main > div > button` — identified as the CTA by its
`paddingTop`/`paddingBottom` of 18.032px, which is what the `.py-\[1\.15em\]`
target from cycle 0's a11y report computes to:

| Quantity | Value |
|---|---|
| foreground `color` | `rgb(8, 11, 131)` = **#080B83** |
| background `backgroundColor` | `rgb(255, 77, 0)` = **#FF4D00** (unchanged) |
| relative luminance, foreground | 0.01930 |
| relative luminance, background | 0.26568 |
| ratio `(0.26568 + 0.05) / (0.01930 + 0.05)` | **4.56:1** |

Independently computed 4.56:1 **agrees** with the ledger's declared 4.56:1, and
clears the 4.5:1 WCAG AA threshold for normal text. The figure is now measured,
not inherited.

**(c) Cold `idle` surface untouched.** `a11y.json` `runs[4]`/`runs[5]`
(`idle__mobile`, `idle__desktop`) both `violations.length` = 0, held from cycle
0. All 8 `idle__*` shots read `mismatchPercent: 0`, `status: "compared"`. The
disabled pill was not touched, and no WCAG 1.4.3 exemption had to be claimed for
it this run because axe raises nothing against it.

### LANE 1 OUTCOME: **DONE** — closed at cycle 1 of 4.

---

## LANES 2 and 3 — NOT OPENED

The key authorises contingent lanes only from cycle-0 FIRST-GROUND-TRUTH
findings on the idle surfaces, within FREEZE. Cycle 0 produced none: styles read
0 unlisted values on both idle surfaces, layout read 0 overflows and 0 overlaps
across all 16 idle entries, and the single sub-100 perf cell
(`idle-armed` accessibility, 95, both viewports) was Lighthouse scoring the very
`color-contrast` failure that Lane 1 exists to fix — not an independent finding.

There was nothing to author a lane from. Per the key, **an unused lane is a
legitimate outcome, not a shortfall.**

---

## RUN CLOSE

### 1. Final measurement and before/after grid

The critic's cycle-1 `gauntlet:all` **is** the final measurement: it ran on the
final tree (single commit `1031a92`, working tree otherwise clean), exit 0, 213s.
No commit has landed since, so a re-run would measure the same tree; the figures
below are that run's, not a restatement of an earlier one.

| Instrument | Cycle 0 (baseline) | Final | Delta |
|---|---|---|---|
| shots | 40 PNGs | 40 PNGs | — |
| diff vs `gauntlet/baseline/` | 40/40 @ 0.0000% | 34/40 @ 0.0000%; 6 moved by declaration (0.0509% mobile, 0.0228% desktop) | 6 intended, declared, verified |
| styles unlisted values | 0 | 0 | hold |
| axe violations | **2** (1 per idle-armed viewport) | **0** | **2 -> 0** |
| contrast failures | **2** (3.06:1, both viewports) | **0** | **2 -> 0** |
| layout overflows | 0 | 0 | hold |
| layout overlaps | 0 | 0 | hold |
| vocab hits (in-scope) | 0 (9 parked by path) | 0 (9 parked by path) | hold |
| Lighthouse a11y, `idle-armed__mobile` | **95** | **100** | **+5** |
| Lighthouse a11y, `idle-armed__desktop` | **95** | **100** | **+5** |
| Lighthouse a11y, other six runs | 100 | 100 | hold |
| Lighthouse perf / best-practices / SEO, all eight runs | 96 or 100 / 96 / 100 | identical | hold |
| Run Audit CTA armed contrast | 3.06:1 (#fff3f0 on #ff4d00) | **4.56:1** (#080B83 on #FF4D00) | **+1.50, clears AA** |
| WCAG exemptions claimed | 0 | **0** | hold |

Accessibility is now 100 on all eight Lighthouse runs and axe is at zero across
every scanned surface, at both viewports.

### 2. Caps — none hit

| Cap | Limit | Spent |
|---|---|---|
| Lanes | 3 | 1 opened, 2 not opened (no material) |
| Cycles per lane | 4 | 1 |
| Builder + critic spawns | 24 | **3** (1 routing proof, 1 builder, 1 critic) |
| Wall-clock from cycle 1 | 120 min | **25 min** (cycle 1 start 22:49:44 EEST, PR open + CI green 23:14 EEST); lane work itself closed at ~11 min, the remainder is run-close |
| `gauntlet:all` | 240s | 212.2s (cycle 0), 213s (final) |

No cap hit, no lane CAPPED, no stop condition fired at any point in the run.

### 3. LEDGER and PIPELINE

`LEDGER.md` entry appended and `PIPELINE.md` NOW/NEXT updated in the same
commit, per `PIPELINE.md`'s own rule ("The Hands updates NOW/NEXT at session
close, in the same commit as the LEDGER entry"). Station 9 (Gauntlet) evidence
extended with run 2; station 12 (Polaris audit) becomes NOW once run 2 is
certified and merged.

### 4. PR against main — STOP LINE

PR opened against `main` from `gauntlet/run-2`. CI harness
(format / lint / test / eval:smoke) must be green.

**The foreman stops here. Merge is the Commander's word, never the foreman's.**

### 5. POST-MERGE — the standing re-seed step (C8)

This is the step that, per the Commander-ratified ruling of 2026-08-31, now
lives in the run-close checklist instead of in anyone's memory. It was born from
a real failure: `gauntlet/baseline/` drifted silently after run 1's approved
fixes merged, and nobody noticed until setup-2 measured before obeying.

Execute **only** after the Commander's eye and merge word — not before, not on
the foreman's initiative:

1. Commander eye on the render -> DESIGN GATE ruling. **No eye, no re-seed.**
2. Merge to `main`.
3. Re-seed `gauntlet/baseline/` from the approved state, **as its own commit**,
   ledgered.
4. `gauntlet/run-1-final/` is provenance evidence. **Never deleted, never
   overwritten.**

Six of the forty baseline PNGs are the ones this run legitimately moved
(`idle-armed__{mobile,desktop}__{top,scrolled,reduced-motion}`); the other 34
are already byte-correct.

### 6. Tower diff-cert

Tower certification against tarballs, with receipts per C7 (each measuring
command's own exit code, stderr unsuppressed, comparanda named), happens
**before the merge word is even requested**. Tower cert satisfies FREEZE's THAW
condition. FREEZE's successor is a Commander ruling, never a foreman edit.

---

## Foreman's notes for the certifying Tower

1. **Local `main` was stale at branch time** — `7f004af`, one merge behind
   `origin/main` at `b25f350`. The branch was cut from `origin/main`, which is
   the SHA the key names. Recorded in pre-flight item 3, not hidden. Nothing was
   fast-forwarded or rewritten.

2. **The builder's first declaration was wrong, and it said so itself.** It
   declared 2 shots to move and flagged that it had not checked for
   `scrolled` / `reduced-motion` variants. Under R9 an under-declaration fails as
   hard as an over-declaration, so it was sent back to close the gap from pixels
   under C2 — traced evidence naming the mechanism, no code change permitted. It
   returned two distinct mechanisms (client-side fixture -> `js-disabled` renders
   cold; absent `#gauntlet-tabbar-anchor` + optional chaining -> `scrolled`
   collapses to `top`) and a corrected 6/34 split that the critic then measured
   as exactly right. **The correction was made before the critic saw the
   declaration, by the builder, on evidence** — recorded here because a
   declaration that had to be corrected is worth the Tower's eye even when it
   closes clean.

3. **The 4.56:1 figure is now measured, not inherited.** The critic computed it
   from `styles.json`'s own rendered `color` and `backgroundColor` values with
   shown arithmetic, having been told to treat the ledger's number as a claim to
   check. It agrees. That agreement is a confirmation, not a citation.

4. **`SUMMARY.md` always says "cycle 0"** in its heading — a fixed string in the
   script, not a claim about which cycle wrote it. Worth knowing before reading
   the file as evidence of anything.

5. **No WCAG exemption was claimed anywhere in this run.** R4's exemption clause
   went unused because `contrastFailures` is empty, and the cold disabled pill
   needed no 1.4.3 claim because axe raises nothing against it.
