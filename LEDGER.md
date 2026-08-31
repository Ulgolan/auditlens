## Ledger — read on open, append on close.

### 2026-07-24
First session in workspace. v1 booted on localhost:3000, install clean, 4 high-severity npm vulnerabilities noted (not fixed). FINDING: all claude.ai skills visible globally via anthropic-skills registry, incl. non-ported ones — skills census needed before any blind test.

### 2026-07-25
Full audit shipped end-to-end. Fixes: sonnet-5 model, max_tokens 16000, effort medium, maxDuration 300, Vercel preset Next.js. Portfolio graded B- (critical: ALL WORK z-index ghost — portfolio hotfix, separate repo). 2.0 gaps logged all night: silent truncation, misleading partial Overall bar, monolithic single-call architecture.

### 2026-07-25 — Phase 0+1, branch `v2` (engine rearchitecture)
POLARIS.md committed as founding brief. Seven commits, `f3188b3`..`d97a8b6`.

GROUND TRUTH (answered from files before edits):
- v1 was confirmed one call for all frameworks; framework ids entered via
  page.tsx state -> POST body -> `.includes()` checks in the prompt builder.
- v1's client accumulated one continuous string; the renderer was already
  framework-agnostic, so multi-request concatenation needed no renderer change.
- `stop_reason` DID reach the browser on the message_delta event — v1 parsed
  that event and dropped it, because the branch only matched
  content_block_delta. That single omission is the whole silent-truncation bug.
- NEW CAUSE FOUND: Sonnet 5 runs adaptive thinking when `thinking` is omitted,
  with display defaulting to omitted. v1 was silently spending part of its
  16000 max_tokens on invisible reasoning shared across all four frameworks.

ARCHITECTURE: client orchestrates, route runs one framework per call. Chosen
over a server-side loop so each call gets its own maxDuration budget rather
than four sharing one. Fluid Compute CONFIRMED ENABLED (Commander verified,
Vercel Settings -> Functions), so 300s per call holds.

RULINGS EXECUTED: a11y is now standalone (was dead whenever Nielsen was on —
the v1 condition `includes("a11y") && !includes("nielsen")` meant the default
all-four selection never produced an a11y section). Both cost wins folded in.
Per-section retry folded in at ~40 min, with mandatory Overall recompute.

ACCEPTED TRADES (Tower-approved):
1. Tab close mid-audit loses the run. Same as v1, but the exposure window is
   longer now that the audit spans several sequential requests.
2. No cross-framework referencing — the Cognitive Walkthrough can no longer
   cite a Nielsen finding. The final Overall pass sees everything and recovers
   some of it; section-to-section awareness is genuinely gone.

INCIDENT: a `brand/` directory (Phase 4 reference material, staged to the wrong
address on a Tower instruction) appeared inside auditlens/ mid-session and broke
`next build` — tsconfig includes `**/*.tsx`, so Next type-checked it and failed
on missing @dnd-kit deps. Never committed (caught before `git add -A`; switched
to explicit paths for the rest of the build). Commander relocated it to
../brand. Build verified green after. Also added *.tsbuildinfo and .DS_Store
to .gitignore.

CERTIFIED — three runs, locally, on commit `d97a8b6`, against the live API:

1. FULL AUDIT. Four frameworks + overall, all complete. Grade C+ rendered,
   4/4 frameworks, 14 critical / 22 minor / 24 pass, ~25k chars. All five
   section headings present. The a11y section produced its own output with 5
   "verify in live product" tags alongside a full Nielsen section — the exact
   combination v1 could never produce. Progress checklist verified live
   mid-run (0/5, Nielsen "Evaluating...", remainder "Queued").

2. TRUNCATION. Forced with a temporary local max_tokens=200, reverted without
   committing (working tree confirmed identical to HEAD afterward, no markers
   left). Amber banner rendered: "Nielsen's 10 is incomplete — this section
   was cut off / The model hit its output limit before finishing this
   section." Grade WITHHELD, 0/4 tally, severity counts reflecting only what
   was evaluated. This is last night's exact failure, now declared instead of
   hidden.

3. RETRY + RECOMPUTE. Retry clicked on the truncated Nielsen section with the
   32000 ceiling restored. The Overall was invalidated immediately and stayed
   gone for the whole retry (polled, 8 consecutive samples), then recomputed.
   Nielsen's banner cleared, tally advanced 0/4 -> 1/4, counts updated.
   Critically the grade REMAINED withheld, because the other three frameworks
   were still truncated — retry does not prematurely unlock a grade. The
   invariant is now proven from both directions: grade appears only at 4/4
   (run 1), and is withheld at anything less (runs 2 and 3).

STILL NOT VERIFIED: nothing on the Vercel preview URL. It builds green
(deployment status confirmed via GitHub API) but serves a Vercel login wall —
Deployment Protection is on, and authenticating into ACP's account was
declined. All certification above is local against the same commit.

NEXT HOUSEKEEPING (Tower-parked, do not action mid-phase): two Vercel projects
(`auditlens`, `auditlens-db1a`) deploy from this one repo on every push —
double build minutes and two production URLs that can drift. Also consider
whether Deployment Protection should stay on for previews, since it blocks
automated verification.

FLAGGED, NOT ACTED ON: Polaris makes text-described concepts 2.0 CORE, and the
build is still screenshot-only (`canEvaluate` requires a screenshot; the route
400s without images). Tower confirms that is the next phase.

### 2026-07-25 — Phase 2+3, branch `v2` (text-concept input + context panel)
One commit, `4c0119a`. Polaris INPUT SCOPE "2.0 CORE: screenshots + text-described
concepts" is now met — both halves ship.

PREVIOUS PHASE'S GAP CLOSED FIRST. Deployment Protection is off on the
`auditlens` project, so the preview is reachable (200) without auth. Ran a full
image audit on the certified commit `da68db7` before touching anything: grade D,
4/4 frameworks, 17 critical / 20 minor / 10 pass, thumbnails and counts all
rendering. The Phase 0+1 grade card is now verified ON PREVIEW, not just locally.
NOTE: the twin project `auditlens-db1a` still 302s to the Vercel SSO wall —
protection was lifted on one of the two projects, not both. The two-project
cleanup stays parked.

GROUND TRUTH (answered from files before edits):
- Zero-image flow had two hard guards (`canEvaluate` in page.tsx, a 400 in the
  route) and one soft problem that mattered far more: the prompts themselves
  hardcode "I've uploaded a screenshot" and "Screen 1, Screen 2", and a11y is
  built on measurements (contrast, 44x44px, sub-12px text). Removing the guards
  alone would have produced a confident, fabricated audit. The guards were ten
  minutes; the honesty layer was the phase.
- Audiences lived in TWO parallel id-keyed maps (`AUDIENCES` in types.ts for the
  UI, `AUDIENCE_LABELS` in prompts.ts for the prompt) with a silent
  `|| consumer` fallback — an audience added in one file and forgotten in the
  other audited as General Consumer and never said so. Now one list; prompt
  labels derive from it.

ARCHITECTURE — MODE IS DERIVED, NOT DECLARED. No `mode` flag. The route computes
`hasVisuals` from the payload it actually received, because a declared mode is a
second source of truth that can contradict the content it describes
(`mode:"text"` arriving with images attached) with nothing downstream able to
catch it. Falls out for free: mixed material (screenshots PLUS a written
description of what happens between them) works with no extra code, and the UI
needs no mode switch — both surfaces are always visible and the operator's
actual input decides.

ACCEPTED TRADE (the one real exception): the overall pass is handed the
assembled report and no material, so it genuinely cannot derive the mode. It
takes an explicit `visualsPresent`, defaulting to true. Declaration is used only
where there is no content present for it to contradict.

RULINGS EXECUTED — audience pass approved by Tower as proposed, all six, no
edits. Five product verticals replaced by six categories keyed on the user's
relationship to the interface (expertise, frequency, cost of error). "SaaS" was
a business model, not an audience; "Enterprise B2B" and "Developer Tool" both
just meant *trained user*. Habitual Consumer and Regulated / High-Stakes had no
home before and are the two that most change a severity rating.

CERTIFIED — three runs on commit `4c0119a`, against the live API:

1. TEXT-ONLY AUDIT, ON PREVIEW. Zero images. Banking "split a payment" concept,
   Regulated / High-Stakes, all four frameworks + overall, 4/4 complete, grade D,
   ~33.6k chars. THE HONESTY NUMBERS, which are the whole point of this phase:
   0 "Screen N" references, 0 contrast ratios, 0 pixel measurements, 0 uses of
   the words "screenshot" or "mockup" — no fabricated visual evidence anywhere.
   8 [not assessable without visuals] tags, 4 confirmed [a11y] findings, 4
   [a11y — verify once visuals exist], and 0 Gestalt tags (correctly suppressed).
   a11y opened by declaring itself a concept-stage review and listed its five
   unreachable criteria; State Stress Test declared it was auditing whether the
   concept ACCOUNTS for each state, not its visual treatment; the Overall carried
   the caveat under the grade. It also found a genuine design flaw from prose
   alone — silent redistribution of a declined share without re-consent — flagged
   independently by multiple frameworks.
2. IMAGE AUDIT, ON PREVIEW — zero regression, and no cross-contamination in
   either direction. 4/4, grade D, 19 critical / 20 minor / 15 pass, with 10
   Gestalt tags and 10 contrast ratios intact, and 0 concept-mode disclaimers
   leaking in. Concept mode does not blunt the visual audit; visual mode does not
   inherit the concept caveats.
3. TRUNCATION, BOTH MODES. Forced locally with a temporary `max_tokens=200`,
   reverted without committing (working tree confirmed byte-identical to HEAD
   afterward, no markers left). Concept mode: 4 amber "cut off" banners, 0/4,
   grade WITHHELD. Image mode: same, 4 banners, 0/4, withheld. The banner is
   mode-agnostic, as intended — it reads `stop_reason`, which knows nothing about
   material type.

VERIFIED ON PREVIEW BEYOND THE THREE RUNS: all six audience chips render and
select; the run button enables with zero images; the concept-mode warning shows
in text mode and is absent in image mode; the context panel stays pinned at
top:0 after scrolling ~3.9k px mid-stream, carrying material, audience,
frameworks and task.

OBSERVED, NOT FIXED (model wording, not structure): the a11y section opened with
"...not a WCAG conformance audit, since neither requires live product or rendered
UI to evaluate" — that clause is garbled and says the opposite of what it means
(both DO require them). The declaration still lands, but the sentence is sloppy.
Worth a prompt tweak next pass; not worth a re-run.

NOT TOUCHED, AS BRIEFED: no skin/branding, no save-query, no tabs, no framework
rewrites beyond what text-mode honesty required. `main` untouched.

### 2026-07-25 — Phase 4, branch `v2` (Ivory Loom + client export)
Three commits, `b040022`, `b4f498f`, `b6aae73`. Polaris non-negotiable 3
("client-exportable without shame") now has a mechanism behind it.

CORRECTION TO A PRIOR ENTRY: the Phase 0+1 incident entry says the brand
material was relocated to `../brand`. The actual path is `../brand-kit/`, and
that is what this phase read. Nothing was imported from it at build time —
`public/motifs/north-star.svg` and `public/pop-logo-color.png` are deliberate
copies. `public/` did not exist before this phase.

GROUND TRUTH (answered from files before edits):
- Colour was ~2/3 remappable and 1/3 not. 112 utilities resolved through the
  Tailwind v4 `@theme` block (`bg-surface-1`, `text-text-tertiary`), but 56
  were raw `white`/`black` — a ten-step `text-white/NN` opacity ramp and five
  `bg-white/[0.0NN]` card faces. Those are dark-face *lifts*; on ivory the
  logic inverts to white cards on an ivory ground, so they were replaced, not
  remapped. Plus 2 hardcoded rgba (the run button's teal glow) and one stock
  `text-blue-400` on the B-grade branch.
- Fonts were two hand-rolled `@font-face` blocks pointing at versioned
  fonts.gstatic.com URLs; `layout.tsx` loaded nothing. Replaced with the kit's
  next/font stack. RA-1 honoured: Archivo at `wdth 125`, not a second family.
- Export: no print CSS, no download, nothing. Greenfield.

EXPORT DECISION (Tower-approved path B). A print stylesheet was rejected for
a mechanical reason, not an aesthetic one: browsers drop background colours
unless the operator ticks "Background graphics", which would have silently
erased the amber partial-audit banner. That puts this phase's own pass
condition inside a print dialog checkbox. A standalone `.html` controls its
own rendering; its declarations are borders and text, so they survive the
client printing it to PDF afterwards. True PDF generation (path C) stays
parked — B is its foundation, since a faithful document is what a headless
renderer would consume.

ARCHITECTURE — THE APP AND THE DOCUMENT CANNOT DISAGREE. `lib/report-status.ts`
is the single source of completeness, severity tallies, grade and declaration
wording. Its load-bearing choice: `grade` is `null` unless every section
completed, so a consumer cannot print a grade on a partial audit — it is never
handed one. The export goes further than sharing data: it renders the SAME
`GradeCard` and `SectionCard` components via `renderToStaticMarkup`, so there
is no second rendering path in which laundering could occur. `SectionCard` is
handed no `onRetry`, which is the only difference in the client document.

A partial audit is declared four times over, deliberately redundantly: a
bordered notice above the grade naming every unfinished section and why; the
withheld grade; the footer; and the `<title>` plus filename, which read PARTIAL
and carry into the browser tab and any printed header.

COLOUR RULINGS EXECUTED. Vermilion is spent only on the primary CTA and on
critical severity — every incidental accent from the dark build (bullets,
spinners, focus rings, quote rules) is re-voiced to navy, so "critical" and
"brand accent" can never look like the same thing. Severity *words* stay navy
and hue is carried by fills, left rules, icons and grid-locked swatches:
vermilion is 3.6:1 on white at 13px and yellow is far worse, and an
accessibility tool does not get to ship a contrast failure on the one element
that must always be read. Grade bands map A navy · B peri · C yellow · D/F
vermilion inside a filled chip with per-band ink, because two of the four
cannot carry legible text at any size. No stock Tailwind colours survive.
`--text-tertiary` was raised from the kit's 0.45 to 0.55 — this app spends it
on 10-11px metadata, where 0.45 lands at ~4.0:1.

NORTH-STAR: product mark in the header, favicon, and the exported document's
footer. Grid-locked, unrotated, unrecoloured, no decorative use taken — "at
most one" permits zero. The ACP colour logo carries the lockup on the export
cover, which is where the studio's identity belongs; the app header carries
the product mark.

CERTIFIED — local, against the live API, on the working tree of `b6aae73`:

1. FULL CONCEPT AUDIT, Nielsen + a11y + overall, all complete. Grade D
   rendered in the vermilion chip, 2/2 frameworks, 6 critical / 7 minor /
   3 pass. Streaming verified live: pinned context panel, per-framework
   checklist (Evaluating/Queued), navy spinner, export button correctly
   disabled mid-run.
2. THE A11Y CLAUSE, from that same run. The reworded prompt produced: "…not a
   visual inspection or a WCAG conformance audit — a visual inspection requires
   rendered UI to look at, and conformance testing requires a live product plus
   assistive technology, and neither exists yet for this description." The
   "neither" now refers to the rendered UI and live product not existing, which
   is true. The garbled inversion is gone.
3. EXPORT, COMPLETE. 690 KB, zero external references, 23 woff2 files inlined.
   Opened OUTSIDE the app from a plain static server on :4599 — no Next
   runtime, different origin — and rendered identically, fonts included.
   Title "AuditLens Report — UX Audit"; footer "Complete audit — all sections
   finished"; no partial markers anywhere.
4. TRUNCATION + EXPORT — THE SLEEPER. Forced with a temporary local
   `max_tokens=200`, reverted without committing (working tree confirmed
   byte-identical to HEAD afterward, no markers left). All four frameworks cut
   off, grade WITHHELD, 0/4. The export was then opened in the second browser:
   ⚠ PARTIAL AUDIT above everything, all four sections named with their reason,
   withheld grade, "No grade — this audit is incomplete", per-section banners
   intact, no retry controls, filename `auditlens-report-PARTIAL-2026-07-25.html`,
   tab title "PARTIAL (0 of 4 frameworks)". Pillar 1 survives into the client
   document.
5. PRINT SIMULATION. Every background-color stripped to white — the worst case
   for a client printing to PDF. Every declaration survived on borders and text
   alone. Two things did not, and were fixed in `b6aae73`: fill-only severity
   swatches now carry a border, and the grade chip prints outlined (navy on
   white) rather than ivory-on-white.
6. FAILED STATE. Forced locally with an invalid API key, restored immediately
   after. Vermilion rules and fills, navy headlines, "Claude API error: 401",
   retry pills on all five sections, grade withheld, export correctly disabled
   because no section had content to export.

STILL NOT VERIFIED: nothing in this phase ran on the Vercel preview — all six
runs are local against the working tree. The re-skin and export are unverified
on deployed infrastructure.

CARRIED FORWARD, STILL PARKED: two Vercel projects (`auditlens`,
`auditlens-db1a`) deploying from one repo; protection lifted on only one.

NOT TOUCHED, AS BRIEFED: engine, input logic, route architecture and all other
prompts. No dark mode — the dark face is deleted, not toggled. `main` untouched.

### 2026-07-25 — SHIPPED. AuditLens 2.0, merged to `main`
Merge commit `3958808`, merging `v2` (`8d692af`) into `main` (was `ebbb2ff`).
Twenty commits across four phases, plus the merge. The merge was the ship.

WHAT 2.0 IS. A working audit tool that turns design material — screenshots,
a written concept, or both — into a client-ready UX audit in one sitting.
Four frameworks run as separate calls, each with its own duration budget
and its own completion status, followed by an Overall synthesis. The
operator reads it in Ivory Loom behind a per-framework tab bar and exports
one self-contained .html a client can open anywhere.

The four phases, in order: engine rearchitecture (silent truncation killed
at the root); text-described concepts as first-class material with an
honesty layer; the Ivory Loom re-skin plus the export; and the Commander's
two design passes — tab navigation, collapsible Overall, reading measure,
tab freedom, logo-home, and the type scale.

PILLARS — POLARIS NON-NEGOTIABLES, VERDICT AT SHIP:
1. NEVER A SILENT LIE — PASS. v1's cause is gone: the client reads
   `stop_reason` off message_delta, which v1 parsed and dropped. No grade
   is ever issued on a partial audit, and that is structural rather than
   disciplined — `deriveCompleteness` returns `grade: null` unless every
   section completed, so no consumer is ever handed one. The same module
   feeds the screen and the exported document, and the export renders the
   same components, so the two cannot disagree. Proven repeatedly under
   forced truncation, forced failure, and real transport failures.
2. ONE SITTING, END TO END — PASS. Material in, four frameworks, Overall,
   client document downloaded, without leaving the tool. Demonstrated on
   preview and again on production.
3. CLIENT-EXPORTABLE WITHOUT SHAME — PASS, with the standing caveat that
   it ships as HTML, not PDF. Self-contained: page stylesheet serialised,
   woff2 inlined, logo, motif and screenshots as data URIs, zero external
   references. Declarations ride on borders and text, verified to survive
   a background-stripped print. Path C (true PDF) stays parked.

PRODUCTION VERIFIED on `3958808`, live URL
https://auditlens-8b3pzche8-popescu-alexandrus-projects.vercel.app —
one concept audit, 3/3 frameworks complete, grade D issued in the vermilion
chip, 11 critical / 12 minor / 6 pass. Ivory ground (#FFF3F0) confirmed
computed, Archivo serving, north-star mark present, tab bar and collapsed
Overall rendering. The a11y opener came out correct once more.

SUCCESS CRITERIA — NOW ARMED, NOT YET MET. Both are post-ship clocks:
1. LIVE-FIRE: within weeks, a real target (actual prospect, or a full
   dry-run on one) goes material -> audit -> proposal-ready output in one
   sitting, and at least one live-fire run must use TEXT-ONLY input so the
   concept-audit claim is tested rather than trusted. Clock starts today.
2. TRUST BATCH: ten consecutive full four-framework audits with zero
   silent truncations — every report complete or self-declaring. Count
   starts at 0/10 today. Note the bar is *silent* truncation: a declared
   truncation or a declared failure does not break the streak, an
   undeclared one does.

PARKED, CARRIED FORWARD:
- RETRY-ON-TRANSPORT-ERROR. Three genuine transport failures were seen on
  ship day ("Failed to fetch" x2, "network error" x1) against freshly
  deployed builds. Not a regression — route.ts and prompts.ts were byte-
  identical to commits that had run clean. The honesty layer handled all
  three correctly and unprompted. `runSection` has no retry on transport
  errors; it should. Engine work, first candidate for 2.1.
- THE db1a TWIN. `auditlens` and `auditlens-db1a` both build on every push
  and both now hold a production deployment of `3958808`. Double build
  minutes, two production URLs that can drift. Removal still parked.
- PROBE DEPLOYMENT CLEANUP. Two throwaway QA branches (`v2-qa-probe`,
  `v2-qa-probe2`) were deleted local and remote, but Vercel keeps their
  deployments, which still answer 200 and serve deliberately broken builds
  (max_tokens 200). Worth deleting from the Vercel dashboard.
- PATH C, TRUE PDF. Parked at Tower ruling as post-ship. The self-contained
  document is its foundation — a headless renderer would consume exactly
  this file.
- PORTFOLIO HOTFIX. The ALL WORK z-index ghost, graded critical back on
  2026-07-25 in the v1 audit. Separate repo, never actioned here.

NOT DONE, STATED PLAINLY: the ten-audit trust batch has not begun, and no
live-fire run against a real target has happened. 2.0 is shipped, not
proven in the field.

### 2026-07-27 — Commander ruling: trust batch starts fresh at 0/10; the 25 Jul portfolio report does not count (testing run, known contrast-calibration false positives).

### 2026-07-30 — MERGED PR #1 (fix/emoji-excision): Ivory Loom icon set v1
live on main. Severity contract migrated ✅⚠️🔴 → [PASS]/[MINOR]/[CRITICAL],
parser tolerant of legacy. 🔬 retained in context-panel per Commander
override. Tower certified (raw pull + live preview), Commander eye passed.

### 2026-07-31 — IA Canon v1.0 retrofit, branch `feat/ia-canon`
Vocabulary extracted from the shipped codebase, four conflicts surfaced,
Commander ruled on all four. `IA_CANON.md` committed at repo root — see
that file for the controlled vocabulary, content types, and structure map.

GAP-LIST 2.0 — renames the rulings imply, logged not executed:
1. Screenshot/screen: rename numbering-system uses of "screen" to
   "Screenshot" — alt text in `components/drop-zone.tsx:101`,
   `components/context-panel.tsx:65`, `components/export-document.tsx:140`;
   figcaption `components/export-document.tsx:141`; counters
   `components/context-panel.tsx:102`, `components/export-document.tsx:94-95`;
   model instruction `app/api/evaluate/route.ts:146`.
2. Finding/issue: rewrite authored prompt copy in `lib/prompts.ts` —
   "issue" (lines 25, 323, 325), "problems" (lines 29, 326), "criticism"
   (line 31) → `finding`/`findings`. `lib/prompts.ts:335` ("observations")
   stays as-is — canon-exempt, not a rename.
3. "document" — no current UI-facing violation found (only code comments);
   standing ban only, nothing to rename tonight.
4. Framework register (chip label ↔ report heading) — canonized as
   designed intent, no rename.

PARKED: auditlens has no per-repo CLAUDE.md — reconcile with the
constitution's trinity claim in a future session.

### 2026-08-06 — Estate walk: quality findings

Read-only review pass. Scope: full repo tree at `~/projects/acp-command-center/auditlens/` on `main`, working tree clean, HEAD matched `origin/main` at review time. Ground truth read: root `CLAUDE.md` (no `auditlens/CLAUDE.md` exists), `POLARIS.md` (v1.1 post-Tribunal), `LEDGER.md` (full history), `IA_CANON.md` (v1.0 retrofit). Branch state confirmed: `main`, `v2`, `feat/ia-canon`, `chore/vercel-analytics` (this session's Mission 2, DONE but unmerged — `app/layout.tsx` has no `@vercel/analytics` import on this branch, consistent), `fix/emoji-excision` (remote-only, already merged). `chore/npm-audit-fix` correctly absent as a branch — Mission 1 this session STOPPED before any commit (plain `npm audit fix` left 3 of 4 highs requiring a semver-major Next.js bump, out of scope; discarded).

**Finding #1 — Missing per-repo CLAUDE.md.** Severity MINOR, backlog. No `CLAUDE.md` in `auditlens/`, breaking the constitution's trinity expectation. Already parked at `LEDGER.md:397-398`; restated per instruction, still open.

1. **Layer mixing — MINOR.** `app/page.tsx` (755 lines) carries state, canvas image compression (`processScreenshot`, 76-135), SSE stream parsing (`runSection`, 177-289), and full two-panel JSX (498-753) in one file — partly sanctioned by `IA_CANON.md:43` ("single-page app, no routing"), and unusually well-commented, which mitigates the risk. `lib/export-document.ts` embeds a ~170-line hand-authored `DOCUMENT_CSS` string (92-262) styling classes that only exist in `components/export-document.tsx`'s JSX — the class contract between the two files is enforced by nothing but developer discipline. `lib/prompts.ts`, `lib/report-status.ts`, `lib/types.ts`, and components otherwise PASS — clean separation.
2. **Sprawl — MINOR, two items.** Eleven orphan SVGs in `components/icons/*.svg` (~30KB) have zero references anywhere in code; the actually-rendered icons are hand-duplicated as React components in `components/icons/index.tsx` (930 lines) with no comment linking the two representations. `package.json:12` declares `@anthropic-ai/sdk` but it's never imported — `app/api/evaluate/route.ts:179` calls the API via raw `fetch` instead. Dead dependency shipping in every install.
3. **Magic numbers — MINOR.** `app/page.tsx:128` — `"image/jpeg", 0.8` JPEG quality is unexplained. Most other constants are named/commented well (`MAX_WIDTH`/`MAX_HEIGHT`, `CLAMP=260`, the `max_tokens` split with a rationale comment). Systemic gap: no spacing/sizing token layer, every component hardcodes arbitrary Tailwind pixel values.
4. **Drift — CRITICAL.** `README.md` is materially stale and contradicts shipped architecture: line 9 describes the dead v1 audience taxonomy (replaced 2026-07-25, see Phase 2+3 above); line 49 says "Claude Sonnet 4" (actual: `claude-sonnet-5`, `app/api/evaluate/route.ts:187`); line 82 links to a non-existent `FEATURE_MAP.md`; Quick Start references a non-existent `.env.local.example`; the Project Structure section lists 5 of ~19 source files and omits all three governance files (`IA_CANON.md`, `POLARIS.md`, `LEDGER.md`). A stranger onboarding from README alone gets a wrong audience model, a broken setup step, and a dead link. Engine architecture itself matches LEDGER rulings exactly — no drift there.
5. **The 10-month test — MINOR.** `app/page.tsx` size/mixing (see item 1), mitigated by thorough inline commentary. `lib/export-document.ts` CSS-in-string vs. `components/export-document.tsx` JSX class names must be hand-kept in sync with no compiler or lint catch. `components/report-renderer.tsx:106-197` is a hand-rolled regex markdown parser with ordering dependencies and no test coverage. Codebase overall is well-commented, a genuine mitigating asset.
6. **Single-source law — PASS, with one MINOR exception.** `AUDIENCES`/`AUDIENCE_LABELS` derivation (`lib/types.ts:73-116`, `lib/prompts.ts:13-15`) and completeness derivation (`lib/report-status.ts`) both verified single-source, no duplicates found. Color tokens sourced from `app/globals.css` with one exception: `components/icons/index.tsx` hardcodes hex values (`#080B83`, `#FF4D00`, `#FDE12D`, `#FFF3F0`) directly in SVG fills instead of referencing CSS custom properties — currently matching by coincidence of manual authorship, not by reference.
7. **GAP-LIST 2.0 verification — STILL OPEN, 0% executed.** Checked every file:line cited in the 2026-07-31 GAP-LIST against the current tree: all six screenshot/screen rename sites (`components/drop-zone.tsx:101`, `components/context-panel.tsx:65,102`, `components/export-document.tsx:94-95,140-141`, `app/api/evaluate/route.ts:146`) and all six finding/issue rewrite sites in `lib/prompts.ts` (lines 25, 29, 31, 323, 325, 326) remain exactly as cited six days ago — zero edits landed. The "document" ban and framework register items remain PASS (no violation, nothing to rename). This is the most actionable finding in this pass: the canon exists and is being violated by shipped code in the exact locations it names.
8. **Trinity — no CLAUDE.md.** Restated per instruction, see Finding #1. Severity MINOR, still open.

Noted in passing (not part of the checklist): `npm audit` still reports 4 high-severity vulnerabilities (Next.js, postcss, sharp) — first flagged 2026-07-24, still unresolved; this session's Mission 1 confirmed the only remaining fix path requires a semver-major Next.js bump and stopped rather than force it.

Branch: `review/estate-walk`. Ritual verdict pending Tower synthesis.

### 2026-08-14 — Activation Lap shipped — harness live: format + lint + flub rule (hardcoded-model tripwire) + 5 tests + smoke eval (dormant until secret) + PR-gating Action

Branch `harness/activation-lap`, PR [#2](https://github.com/Ulgolan/auditlens/pull/2), commits `1d076dc`..`e605b56`. Not merged — waits for Tower certification + Commander eye, per mandate.

- **Formatter**: Prettier, run once (17 code files reflowed, mechanical only — markdown/doctrine files excluded from scope). `format:check` script.
- **Linter**: ESLint 9 flat config, `next/core-web-vitals` + `next/typescript`. `lint` script switched from the now-deprecated `next lint` wrapper to plain `eslint .` (Next 15 itself recommends this migration; identical output, no behavior change). One stale `eslint-disable` comment auto-removed by `--fix` (not a logic change).
- **Flub rule (March 404 tripwire)**: `no-restricted-syntax` errors on any hardcoded `claude-*` literal outside `lib/ai-config.ts`. Verified firing on a throwaway test file. The one permitted app-code change this lap: model id moved from an inline literal at old `app/api/evaluate/route.ts:187` into `lib/ai-config.ts`'s `CLAUDE_MODEL` constant; the route now imports it.
- **Tests** (Vitest, 5/5 green): route module loads + exports `POST`; completed fixture carries all 4 framework sections (nielsen/cw/state/a11y) and grades complete; `app/page.tsx`'s stop_reason handling maps `max_tokens` and a missing stop_reason to `truncated` (never a silent `complete`) — a source-shape assertion, since the logic is a closure inside a client component with no exported pure function, and extracting one was out of scope; model string imported from config (tripwire redundancy); a partial audit (1/4 sections truncated) never gets a letter grade.
- **Smoke eval**: `eval/smoke.ts`, placeholder concept-mode fixture (no screenshot available in-session), calls Anthropic directly with the same model constant + prompt builders as the real route. Verified locally end-to-end against the live API: `stop_reason: end_turn`, 8233 chars, badge pattern matched.
- **Action**: `.github/workflows/harness.yml`, `pull_request` trigger, `format:check → lint → test → eval:smoke`. Ran on PR #2: **green** — format/lint/test all passed; `ANTHROPIC_API_KEY` secret is not configured on this repo, so eval:smoke skipped with a visible `::warning::` annotation, exactly as designed.

**Lint backlog (WARN, not fixed — needs a real logic change, auto-fix policy only this lap):**
1. `components/context-panel.tsx:63` — `<img>` → `next/image`
2. `components/drop-zone.tsx:100` — `<img>` → `next/image`
3. `components/export-document.tsx:138` — `<img>` → `next/image`

Noted in passing, unchanged by this lap: `npm audit` still reports 4 high-severity vulnerabilities (Next.js, postcss, sharp) — same set flagged 2026-07-24 and re-confirmed 2026-08-06, fix path still requires a semver-major Next.js bump. Out of scope — "one variable: the harness."

### 2026-08-30 — Gauntlet setup + Gate Zero, branch `gauntlet/setup` — PR #3 opened, NOT MERGED (harness red on an external blocker)

Instruments installed per the ignition key. Commits `73a3c72`..`a0176c1`, PR
[#3](https://github.com/Ulgolan/auditlens/pull/3) opened against `main`.

**Ground truth, before the first commit:** single-page app, one route — export
document has no URL at all (browser download via a hidden `<a download>`,
`lib/export-document.ts`). No Playwright/axe/Lighthouse/stylelint present.
User-facing strings live in `components/**`, `lib/types.ts` labels, and — per
`IA_CANON.md`'s own "structural prompt vocabulary" language — the authored
system-prompt copy in `lib/prompts.ts` and `app/api/evaluate/route.ts` too.
`/api/evaluate` had `maxDuration` set but zero rate limiting. `@theme inline`'s
Tailwind-prefixed color aliases (`--color-navy` etc.) are **not** separately
emitted as runtime custom properties — Tailwind inlines their resolved value
straight into the utilities it generates instead (confirmed empirically,
cost an hour of chasing false positives in `gauntlet:styles` before landing
on probing the plain primitive names). No app fixture existed (only a
test-only one, `tests/fixtures/completed-report.ts`).

**Built:** offline fixture (`?fixture=gauntlet`, `&view=export` — the export
surface renders `ExportDocument` in-page instead of triggering its real
download, since it has no URL to visit otherwise) · per-IP rate limit on
`/api/evaluate` (40 req/10 min, in-memory, `tests/rate-limit.test.ts` joins
the harness) · seven `gauntlet:*` instruments (`shots`, `diff`, `styles`,
`a11y`, `layout`, `vocab`, `perf`) + `gauntlet:all` orchestrator writing
`gauntlet/out/SUMMARY.md` · cycle-0 baseline shots committed to
`gauntlet/baseline/` · `gauntlet/README.md`, `FREEZE.md`. Also fixed a real
bug in the pre-existing `.gitignore`: its unanchored `out/` rule was silently
swallowing `gauntlet/out/` too (now scoped to `/out/`, the Next static-export
dir it actually meant).

**Instrument table (files / headline number):**
| shots | `gauntlet/out/shots/*.png` | 24 PNGs (3 surfaces × 2 viewports × 4 states) |
| diff | `gauntlet/out/diff.json` + `diffs/*.png` | 0.00% on all 24 (self-consistency, both a local run and a fresh `git clone` + `npm ci`) |
| styles | `gauntlet/out/styles.json` | 0 unlisted colour/font values / 1609 elements |
| a11y | `gauntlet/out/a11y.json` | 4 axe violations, 48 contrast failures |
| layout | `gauntlet/out/layout.json` | 42 horizontal overflows, 3 text overlaps |
| vocab | `gauntlet/out/vocab.json` | **13 hits, not 0** |
| perf | `gauntlet/out/lhci/*.json` | report mobile 96/96/96/100 · desktop 100/96/96/100 · export mobile 96/96/96/100 · desktop 100/96/96/100 |

**Cycle-0 timing:** `gauntlet:all` = **124.9s** (this session's dev env) /
**126.6s** (fresh clone, verified separately) — the number future caps get
set from. Per instrument: shots 30.9s, diff 4.2s, styles 2.5s, a11y 5.5s,
layout 28.7s, vocab 0.1s, perf 44.4s.

**Real findings this pass surfaced (not fixed — FREEZE.md, zero pixel
polish):** `--text-tertiary` measures ~4.0:1 on white at the sizes it's
actually used at, short of the 4.5:1 the inline comment in `globals.css`
claims it clears — the comment's own math looks wrong, worth a fresh look
next lap. The accent CTA button (vermilion/ivory, 13.6px) measures 3.06:1.
The header's button group doesn't wrap at 390px, and the export document
(never tuned for mobile, evidently) overflows its headings and header lockup
at the same width. `gauntlet:vocab` found 13 hits — all match or extend
`LEDGER.md`'s own 2026-07-31 GAP-LIST 2.0, still zero-executed seven weeks
later.

**GATE ZERO:**
1. RLS — N/A, no Supabase.
2. Secrets/secret-scanning — key confirmed nowhere in git history (the one
   `sk-ant` hit is README's own placeholder text) and gitignored locally.
   **Secret scanning itself cannot be turned on**: the repo is private, and
   GHAS (which secret scanning needs on a private repo) isn't offered on
   this plan — confirmed via the API (`security_and_analysis: null`,
   rulesets/branch-protection both 403 "Upgrade to GitHub Pro or make this
   repository public"). Contradicts CLAUDE.md's "ruleset requiring status
   checks" claim: branch protection is **fully off** right now — the harness
   runs on every PR but nothing blocks a merge on red. COMMANDER ACTION:
   plan upgrade or make the repo public; no in-between toggle exists.
3. Wallet guard — COMMANDER ACTION, path only: Vercel Dashboard → Team
   Settings → Billing → Spend Management.
4. Input discipline — zero `dangerouslySetInnerHTML` anywhere, confirmed by
   grep before and after this session's changes.
5. Rate limit — was missing entirely; added, tested, proven live
   (`gauntlet/proof-429.png`: 41st request from one client → HTTP 429).
6. Server-side auth — N/A, single operator, matches `IA_CANON.md`.
7. Business-data flag — confirmed zero `fs`/storage calls persisting
   uploaded material server-side.

**THE BLOCKER — harness is currently RED on `main` too, not just this PR.**
PR #3's harness failed at `Smoke eval`: `Claude API returned 400: "Your
credit balance is too low to access the Anthropic API."` Traced with
`npm run eval:smoke` locally (same request, same account) — same error,
confirming it's an **Anthropic account billing state**, unrelated to this
branch's code. It also means the ANTHROPIC_API_KEY secret got added to the
GitHub repo sometime after 2026-08-14 (that lap's harness skipped
`eval:smoke` with a warning because the secret didn't exist yet) — so this
is the first PR to actually exercise it, and it's exposed a real gap: **any
PR against this repo right now, including one that changes nothing, would
fail the harness the same way.** Also reproduced live: one concept-mode,
single-framework ("Accessibility") audit run against the Vercel preview for
this branch got the same 400 on every section — and the app's honesty layer
handled it exactly as designed (both sections declared "did not complete,"
no grade issued, nothing silently swallowed). COMMANDER ACTION: top up
Anthropic account credit. Until that happens, no PR against this repo can
go fully green, and this one stays open rather than merging on a false
"harness passed."

**GATE ZERO — CORRECTIONS (same session, after Commander action):**
2. Secrets/secret-scanning — the "branch protection fully off / needs plan
   upgrade" finding above was **wrong**: it read the legacy branch-protection
   endpoint instead of rulesets. Verified via `/rulesets`: ruleset
   "main-harness" (id `20875261`) is active on `main`, required status check
   "harness". Repo has been public since 30 Aug 12:37 UTC. Push protection is
   ON at the user level. Proof on PR #3 thread. **PASS.**
3. Wallet guard — **PASS.** Anthropic console monthly spend limit set to $30
   by Commander. Vercel Hobby has no spend toggle at all, hard limits only —
   that half of Gate Zero #3 was never an open action, just a plan
   constraint. Proof on PR #3 thread.
5. Rate limit — reconfirmed at the code level, not just live: the limiter at
   `app/api/evaluate/route.ts:51` runs before the client call at `:202`, and
   the hermetic test asserts `fetch` is never invoked once the limit trips.
   The earlier version of this test drove a real handler loop and spent
   Anthropic API credit in CI; replaced 31 Aug. **PASS.**

PR #3 merged at `57fcb1a` — harness green including the live smoke eval,
production deployed.

**What's stale for the next worker:** the harness-red state above is
resolved (Commander topped up Anthropic credit; PR #3's harness went green
and it merged). Gate Zero #2 and #3 are now PASS per the corrections above —
only Gate Zero's non-blocking findings (vocab/contrast/layout) remain listed
not fixed. Option B (Claude Design reference frames, pixel-diff vs
reference) — return ticket, still parked, untouched this lap.

>> BATON
HARNESS: 6 tests green locally (12 total incl. rate-limit) · gauntlet:all green, 124.9s · CI harness GREEN on `main` after Commander's Anthropic credit top-up · PR #3 merged 57fcb1a · Gate Zero #2 and #3 both PASS (corrected — see above), Gate Zero #5 PASS

### 2026-08-31 — Gauntlet RUN 1 (certified, merged)

Branch `gauntlet/run-1`, PR [#5](https://github.com/Ulgolan/auditlens/pull/5),
merged at `befdb6e`. Key v1.1, rulebook bar (option A). Foreman Opus, 8 Sonnet
spawns (routing proof: Sonnet 5), 4 cycles across 3 lanes, 52 min of 150,
~752k sub-agent tokens, no cap hit.

BASELINE → FINAL: contrast 48→0, axe 4→0, overflows 42→0 (390 and 1280),
overlaps 3→0, in-scope vocab 4→0 (9 prompt hits parked by FREEZE), unlisted
style values 0→0, Lighthouse a11y 96→100 on all four surfaces. Zero WCAG
exemptions claimed.

DESIGN GATE 31.08: Commander approved secondary CTAs ivory→navy text and
header wrap at 390. Run Audit CTA (idle screen, 3.06:1) out of run-1 fence,
untouched, ruling pending for run 2.

Certification notes (Tower):
1. Instruments cover in-scope surfaces only — idle input screen never
   scanned, so "0 contrast" is true of the fence, not the app; run 2 adds
   idle as a surface.
2. Key defect: R5a and R5c contradicted each other at 1280; foreman ruled
   "findings may only decrease, never introduce"; ruling correct, key
   amended.
3. Lane 3 R9 closed by corrected declaration with traced pixel evidence, no
   code change; v1.2 rule: redeclaration requires traced evidence.
4. Out-of-repo throwaway diff used to compare against lane baseline; run 2:
   `gauntlet:diff` gets `--against`.
5. Foreman context cost: instrument stdout should go to files, foreman
   reads SUMMARY.md only.

Run 2 backlog: option B reference frames (Claude Design, per surface) →
pixel-diff row live; idle screen surface; Run Audit CTA ruling; `--against`
flag; stdout redirect; 9 parked prompt vocab hits need a prompts-scope
decision (prompts are OUT of visual freeze; separate key).

### 2026-08-31 — PIPELINE.md seeded at station 12

`PIPELINE.md` created from the doctrine template (per KEY_doctrine-foundry-spine.md),
branch `docs/pipeline`. Stations 0-11 marked DONE against ledgered evidence
(commit shas / PR links per row) — with one correction to the Commander's
dictated truths: **station 6 (Studio) marked SKIPPED, not DONE.** Option B
(Claude Design reference frames per surface, pixel-diff vs reference) was
never run; it is explicitly parked as a return ticket in this ledger's
2026-08-30 entry and still sits in the 2026-08-31 run-2 backlog. Run 1 used
the rulebook bar (option A) only. Marking it DONE would have contradicted
this file's own record, so it is SKIPPED with that reason instead, per
PIPELINE.md's own rule that conditional skips carry a one-line reason.
NOW set to "12 — Polaris audit against the 2.0 brief"; NEXT set to
"gauntlet run 2 (option B reference frames, idle surface, Run Audit CTA
ruling)".

### 2026-08-31 — Gauntlet setup 2, branch `gauntlet/setup-2` — PR [#8](https://github.com/Ulgolan/auditlens/pull/8) opened

Executor: Sonnet, Claude Code. Nine commits, `aa60882`..`02a4cb5`, per Ignition
Key v1.2.

**GROUND TRUTH, answered before the first edit (key's Q1-Q8):**
1. Cold `/` makes zero `/api/evaluate` or `api.anthropic.com` requests —
   proven with a Playwright request log (14 requests, all static assets/
   fonts/scripts). Cleared to proceed.
2. `hasMaterial` goes true on concept text alone
   (`hasVisuals || concept.length > 0`, `app/page.tsx`). No `view=idle`
   branch existed; built to set only `conceptText` + `frameworks`, leave
   `evalPhase` at `"idle"`, set `gauntletView` `"app"`.
3. `#gauntlet-tabbar-anchor` lives only inside the `showReport` branch —
   absent on both idle surfaces, so `scrolled` duplicates `top` there.
   Default held (all four states, 40 shots): duplicate-state cost is
   ~20s total, nowhere near the >10s deviation trigger.
4. Confirmed exactly four surface lists: `lib.mjs` `SURFACES` (consumed
   directly by both `shots.mjs` and `layout.mjs`, so neither needed a
   separate edit), `a11y.mjs` `SURFACE_PAGES`, `styles.mjs`
   `SURFACE_PAGES`, `perf.mjs` `PAGES`.
5. **Killed part of the brief — see "BASELINE RE-SEED" below.** The
   key's assumption ("`gauntlet/baseline/report__mobile__top.png` is
   exactly 390 wide") was wrong; it measured 409.
6. `withServer`'s `next build` and `all.mjs`'s step spawns are the only
   two top-level `stdio: "inherit"` sources. `perf.mjs`'s own
   `execFileSync` call for the `lighthouse` CLI also sets
   `stdio: "inherit"`, but it inherits through whichever of the two wraps
   it — no independent third source once those two are redirected.
7. `.prettierignore` excludes `node_modules`, `.next`, `out`,
   `*.tsbuildinfo`, `package-lock.json`, `*.md` — not `gauntlet/**`.
   `format:check` already covered the scripts; confirmed, not amended.
8. `all.mjs`'s `writeSummary` reads `diff.images[].mismatchPercent` —
   confirmed the `--against` addition keeps that shape.

**BASELINE RE-SEED — a Tower self-own, ruled and Commander-ratified this
session.** The Ignition Key's PHYSICS section stated as non-negotiable:
"Before seeding anything new, `gauntlet:diff` must read 0.00% on all 24
existing baseline shots." That was written from run 1's cycle-0 report and
never re-measured against current `main`. It does not hold: `gauntlet/
baseline/` was committed once at `e9d7afb` (PR #3, pre-run-1) and never
re-seeded after run 1's approved layout/contrast fixes merged
(`befdb6e`). Measured on a clean, unmodified checkout of `main`, before
any edit this session: `gauntlet:diff` read 18/24 compared (6 size-
mismatches — the three `report__mobile__*` and three `export__mobile__*`
shots) with a worst mismatch of 10.14% on `tabbar__mobile__top.png`. This
drift is consistent with run 1's approved composite diff, measured
against the original baseline across all three lanes combined (not a
claim that it *matches* the report's own 10.18%, which was measured
lane-3-only against the lane baseline — a different denominator; the two
numbers are close because lanes 1-2 moved that shot ~0.05% on their own).

Tower ruling (Commander-ratified) on how to proceed, executed exactly as
given:
> TOWER RULING, Commander-ratified. The 24/24 0.00% precondition was the
> Tower's error — written from run-1's cycle-0 report, never re-measured
> against current main. Record that in the LEDGER entry as a Tower
> self-own. Your drift is expected and identified: it is exactly run 1's
> approved, merged diff (your 10.14% worst on tabbar__mobile__top matches
> the report's declared 10.18% on that shot; your 6 size-mismatches match
> the report's declared R9 DIMENSION CHANGEs). Proceed on this branch,
> same mission, amended order:
> 1. REORDER: build DO 5 (gauntlet:diff --against) FIRST. It is
>    instruments-only and independent — its first real use is step 2.
> 2. From clean main state, run gauntlet:shots, then
>    gauntlet:diff --against gauntlet/run-1-final. Expect 0.00% on all
>    24. Tolerance: nonzero but ≤0.05% confined to glyph antialiasing =
>    report per shot and proceed; anything above 0.05% or any size
>    mismatch = STOP, main has drifted beyond the approved state and that
>    is a new finding.
> 3. If clean: re-seed gauntlet/baseline/ — replace all 24 PNGs from the
>    fresh shots — as its own commit: "gauntlet: re-seed baseline to
>    run-1-approved main (Commander ratified 2026-08-31)". The pre-run-1
>    baseline stays retrievable at e9d7afb; say so in the LEDGER.
> 4. The zero-visual-change proof now reads: every commit AFTER the
>    re-seed must diff 0.00% (all 24, then all 40 once idle is seeded)
>    against the re-seeded baseline.
> 5. DO NOT amendment: "never overwrite the 24 baseline PNGs" is lifted
>    for step 3's commit only, exactly once, under this ruling. Every
>    other line of the key stands.
> 6. LEDGER additions: this ruling verbatim; and a standing gap for the
>    Tower's run-key: "baseline re-seed after an approved run" becomes an
>    explicit post-merge step so this never relies on memory again.
>
> TOWER AMENDMENT to the baseline ruling (post-tribunal), four points:
> 1. SEQUENCING: the re-seed commit must be captured from a tree with
>    ZERO app-file commits on the branch — instruments-only (--against)
>    may precede it; the view=idle fixture commit (DO 2) may not.
> 2. DO 4 corrected: the sha256 byte-identical proof refers to the 24
>    RE-SEEDED PNGs from here on; the pre-ruling originals are history at
>    e9d7afb.
> 3. TOLERANCE: the 0.05% band is Tower-inferred, not measured. Nonzero
>    ≤0.05% passes ONLY if the diff PNG shows scattered glyph-edge
>    pixels; any contiguous rectangle or band = STOP and report the shot,
>    regardless of percentage.
> 4. LEDGER wording: record the drift as "consistent with run 1's
>    approved composite diff" ... Do not write "matches the declared
>    number" — that grades the claim above its evidence.

Executed: `aa60882` (`--against` flag, instruments-only, precedes the
re-seed) → `gauntlet:shots` + `gauntlet:diff --against gauntlet/run-1-final`
on that tree, still zero app-file commits → **24/24 compared, 0.00% on
every shot, sha256-confirmed byte-identical to `gauntlet/run-1-final/`**
(cleaner than the ≤0.05% tolerance — exactly 0, no contiguous band to
even inspect) → `7eb0e81` re-seeds all 24 `gauntlet/baseline/` PNGs from
those shots → `ab7f8d8` (the `view=idle` fixture commit, DO 2) only after
the re-seed, per the sequencing amendment. **Standing gap logged for the
next run-key author, per the ruling's point 6: "re-seed the baseline
after an approved run" must become an explicit post-merge step in the
run-close checklist — this cannot be left to memory again.**

**Per-instrument changes:**
- `diff.mjs` — `--against <dir>` flag. Compares `gauntlet/out/shots/`
  against an arbitrary directory instead of `gauntlet/baseline/`.
  Seed-when-empty stays scoped to the default path only; an empty or
  missing `--against` dir always exits 1 naming it. `diff.json` now
  records `against`.
- `lib.mjs` — `SURFACES` grows from 3 to 5: `idle` (`/`) and
  `idle-armed` (`/?fixture=gauntlet&view=idle`). New
  `waitSelectorForSurface()` routes idle surfaces to
  `"text=EVALUATION FRAMEWORKS"` (existing markup) instead of
  `"text=OVERALL ASSESSMENT"` (which idle screens never render), so the
  post-nav wait resolves immediately instead of timing out after 5s.
  `withServer`'s `next build` now writes to `gauntlet/out/logs/
  build.log` instead of streaming to the terminal — unconditionally,
  for every `gauntlet:*` script, not just `gauntlet:all`.
- `shots.mjs`, `layout.mjs` — both already iterated `lib.mjs`'s
  `SURFACES` directly, so the new surfaces apply for free; both now pass
  `waitSelectorForSurface(surface.id)` into `gotoAndSettle`.
- `a11y.mjs`, `styles.mjs` — each had their own inline duplicate of the
  same "OVERALL ASSESSMENT" 5s-timeout wait (neither used `lib.mjs`'s
  shared `gotoAndSettle`); both fixed the same way, both gained the two
  idle `{ id, path }` pairs.
- `perf.mjs` — gained the two idle `{ id, path }` pairs. Lighthouse
  handles its own load-waiting, no wait-selector fix needed.
- `all.mjs` — each step's stdout+stderr now goes to
  `gauntlet/out/logs/<step>.log`; console prints one line per step
  (seconds + log path). A failing step still fails the run, still names
  the step, still gives the log path, before rethrowing.

**40-shot confirmation.** `gauntlet:shots` writes 40 PNGs (5 surfaces × 2
viewports × 4 states), verified on both the local dev env and a fresh
`git clone` + `npm ci` + `npx playwright install chromium`.

**Cycle-0 timing (run-2's new cap baseline):** local dev env **213.5s**,
fresh clone **215s**. Both well under the 240s stop threshold in the key
— no stop condition fired, no optimisation needed or attempted.
Per-instrument (fresh clone): shots 50s, diff 5.5s, styles 4.4s, a11y
10s, layout 47.4s, vocab 0.1s, perf 86.3s.

**`view=idle` production-inert proof.** `app/page.tsx`'s fixture effect
gained one new branch, gated on the same `?fixture=gauntlet` param as the
existing `view=export` branch — with the param absent the component is
byte-for-byte what it was before this session. Verified live in the
browser pane: `/?fixture=gauntlet&view=idle` renders the input panel with
"Run Audit · 4 frameworks" armed (`bg-accent text-ivory`, confirmed via
computed style — 3.06:1, the known defect); production `/` renders the
disabled pill with unchanged copy ("Add a screenshot or describe the
concept to begin"), `disabled: true`, confirmed via computed DOM read.

**Option B retirement — recorded with the Commander's reason.** Per
`gauntlet/README.md`'s new Reference section, `FREEZE.md`, and
`PIPELINE.md` station 6: option B (Claude Design reference frames per
surface, pixel-diffed against a designed reference) is retired for
AuditLens 2.0, not merely parked — there is no `gauntlet/reference/`
folder and none is planned. Commander's stated reason: the render
approved at DESIGN GATE 31.08 is canon, and `gauntlet/baseline/` serves
as the reference going forward. Re-seeding it is no longer a routine
operator step — it requires a Commander DESIGN GATE ruling, exactly as
this session's own re-seed did.

**VERIFY, receipts:**
- Fresh clone + `npm ci` + `npx playwright install chromium`:
  `gauntlet:all` exit 0, 40 PNGs, `SUMMARY.md` 7 rows, `logs/` has one
  file per step + `build.log` (8 files), console prints ~15 lines (2 npm
  banner + 3 build/server + 7 step + 1 blank + 1 done) instead of the
  full instrument output.
- `gauntlet:diff` default: 40/40 compared, 0.00% on every shot.
  `--against gauntlet/baseline`: identical (same target). `--against
  /tmp/empty`: exit 1, names the dir.
- `npm run format:check`, `npm run lint` (0 errors, 3 pre-existing
  `<img>` warnings from run 1's backlog — unrelated, untouched), `npm run
  test` (6 files / 13 tests): all green locally before push.
- `a11y.json` `idle-armed__mobile` and `idle-armed__desktop`: both show
  one `color-contrast` violation, `#fff3f0` on `#ff4d00`, actual ratio
  **3.06**, required 4.5:1, target `.py-\[1\.15em\]` — the Run Audit
  button, present at both viewports, exactly as the key expected.
- `a11y.json` `idle__mobile` and `idle__desktop` (cold): **0** violations
  at both. Axe does not flag the disabled pill's text at all — no rule
  fires on it, consistent with WCAG 1.4.3 exempting inactive controls
  (quoted in `FREEZE.md`).

**What's stale for the next worker:** the standing gap above (re-seed the
baseline after every approved run — logged, not yet turned into a
checklist step anywhere durable). Run 1's lint backlog (3 `<img>` →
`next/image` warnings) is untouched, unrelated to this session. The Run
Audit CTA's actual contrast fix (`text-ivory` → `text-navy`, 4.56:1,
Commander-ruled this session per `FREEZE.md`) is recorded, not executed —
that is run 2's lane's job, not this setup lap's. This entry was written
and committed before the PR was merged — confirm merge state before
trusting NOW/NEXT in `PIPELINE.md` as current.

>> BATON
STATE: PR [#8](https://github.com/Ulgolan/auditlens/pull/8) open against
main, branch `gauntlet/setup-2`, 9 commits, CI harness **green**
(format/lint/test/eval:smoke), Vercel preview deployed. Not yet merged
at LEDGER close.
CERTIFIED: 40 PNGs; `gauntlet:diff` 40/40 @ 0.00% against the re-seeded
baseline; 24 re-seeded baseline PNGs sha256-confirmed byte-identical to
`gauntlet/run-1-final/`; format/lint/test green locally and in CI;
idle-armed contrast failure (3.06:1, both viewports) and idle cold
cleanliness both confirmed in a11y.json; `view=idle` proven
production-inert live in browser.
OPEN: PR #8 merge (harness is green — merge is a Commander/desk call,
not this session's to make unprompted). Run-2 backlog per FREEZE.md:
idle input screen lanes (contrast/layout/a11y builder work), Run Audit
CTA → text-navy execution, 9 parked prompt vocab hits (separate key),
surface-list consolidation into lib.mjs (parked, not this lap).
NEXT: once PR #8 merges, run 2's builder/critic lanes against the
now-armed idle surfaces — the Run Audit CTA fix is the headline item,
ruled this session, not yet executed.
TRAPS: gauntlet/baseline/ drifting silently after a future approved run
is the exact failure this session found and fixed once — the standing
gap above exists specifically so nobody has to rediscover it by hand
again. `gauntlet/run-1-final/` is now provenance evidence for the
re-seed, not just a report artifact — do not delete it.

### 2026-08-31 — Tower session close (setup-2 arc) — appended by doc-only micro-lap

>> BATON — Tower session close, 2026-08-31 (gauntlet setup-2 arc)

STATE: PR #8 merged to main; post-merge verified byte-identical to the
certified branch tarball (diff -rq, diff's own exit code 0, zero stdout,
zero stderr, unfiltered). Run 2 instruments live: 5 surfaces, 40-shot
baseline. Baseline re-seeded = run-1-final = DESIGN GATE 31.08 approved
state, and is now the DESIGN REFERENCE: option B RETIRED for AuditLens
2.0 by Commander ruling ("solid as it gets; features yes, redesign no").
FREEZE run 2 open at root. PIPELINE: NOW = gauntlet run 2, NEXT =
station 12 Polaris audit (deferral reason in the file, Commander-
ratified). Cycle-0 for run 2: 213.5s local / 215s fresh clone.

CERTIFIED (Tower, against tarballs, this session): setup-2 diff scope
exact (8 scripts, 24 re-seeded + 16 new baseline PNGs, page.tsx fixture
block only, FREEZE/PIPELINE/LEDGER/README; package.json byte-identical,
zero new deps); re-seed provenance by cmp on all 24 pairs vs
run-1-final; all 16 idle PNG dimensions correct (390/1280); both idle
states eye-checked from committed baselines (cold = disabled pill,
armed = RUN AUDIT · 4 FRAMEWORKS). OBSERVED, not re-run: CI harness
green, 40/40 @ 0.00%, a11y idle-armed 3.06:1 both viewports / idle
cold clean.

OPEN (next Tower, in order):
1. Cold-review the proposed scars below; Commander ratifies; Hands lap
   commits ratified scars to acp-doctrine/SCAR-LEDGER.md.
2. Author run-key v1.2 from measured ground: caps from 213s cycle-0;
   lane 1 = idle-armed Run Audit CTA text-ivory → text-navy
   (Commander-ruled 2026-08-31, FREEZE-recorded, NOT yet executed);
   further lanes from the idle a11y/layout findings; changelog:
   redeclaration requires traced evidence; R5c reworded "no desktop
   finding introduced — decrease or hold"; READ FIRST drops CLAUDE.md
   (none exists in this repo — parked finding, LEDGER 2026-08-06);
   builder pre-commit verify adds format:check; foreman reads
   SUMMARY.md only, instrument logs handed to critics by path.
3. After run-2 merge + Commander eye: RE-SEED BASELINE per the standing
   law born this session (eye approves → merge → re-seed → ledger).
   Propagation of that law into acp-doctrine templates/gauntlet/ is
   queued, not done.
4. Prompts-vocab key (9 parked hits) — separate key, after run 2.

PROPOSED SCARS (all clade I, one session — cold reviewer weighs one
scar with four incidents vs separate scars):
S1: Key v1.2 PHYSICS stated "0.00% on all 24" from run-1's cycle-0
    report, never re-measured against current main. Caught by a Hands
    that measured before obeying. Root cause also produced the standing
    re-seed law.
S2: The correcting ruling overclaimed — "10.14% matches the declared
    10.18%" graded an inference as verification (different comparanda:
    composite-vs-original vs lane-3-vs-lane-baseline). Caught by
    self-applied Tribunal.
S3: The post-merge receipt "diff exit: 0" reported a pipeline tail's
    exit (always 0) with stderr suppressed — the shown proof did not
    prove the stated claim. Caught by self-applied Tribunal; re-run
    clean. "Absence from a filtered read is not absence," convicted
    twice in one arc.
S4: The micro-lap key claimed a doc-only exemption permitting
    direct commits to main — contradicted by the repo's own
    main-harness ruleset, documented in this LEDGER's 2026-08-30
    entry and read by the Tower at session open. Caught by the
    Hands at push. The doc-only exemption is process doctrine
    (skip preview/eye), never a bypass of repo rules.

TRAPS: gauntlet/baseline/ is CANON now, not a scratch "before" — no
re-seed without a Commander DESIGN GATE ruling. gauntlet/run-1-final/
is provenance evidence — never delete. The armed-idle fixture view is
production-inert by a return-early branch — any future fixture-effect
edit re-proves inertness. Verification receipts must capture the
measuring command's OWN exit code, never a pipeline tail's, never with
stderr suppressed. Sonnet 5 intro pricing ends 2026-08-31 — assume
post-intro executor economics for run 2's spawns.

Session formalities: valve usage 0, overrides 0. Commander carries
nothing forward except ratification words on the scars.
