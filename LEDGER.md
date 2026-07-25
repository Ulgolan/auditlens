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

OPEN / NOT CERTIFIED AT WRITE TIME:
- Preview URL is behind Vercel Deployment Protection; could not be reached
  without authenticating into ACP's Vercel account, which was declined.
- No ANTHROPIC_API_KEY in .env.local, so no real audit ran locally either.
- VERIFIED locally on the v2 build, real code paths, no key: grade WITHHELD
  instead of a letter, "0 of 4 frameworks completed" tally, per-section failure
  banner naming the cause, live retry button, honest 0/0/0 severity counts.
- NOT YET VERIFIED: a successful end-to-end audit, the progress checklist
  mid-run, a genuine max_tokens truncation, and a retry that succeeds and
  recomputes the Overall.

FLAGGED, NOT ACTED ON: two Vercel projects (`auditlens`, `auditlens-db1a`)
deploy from this one repo on every push. Also — Polaris makes text-described
concepts 2.0 CORE, and the build is still screenshot-only (`canEvaluate`
requires a screenshot; the route 400s without images). Tower confirms that is
the next phase.
