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
