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
