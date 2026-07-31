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
