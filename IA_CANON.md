# IA_CANON.md — AuditLens

*Canon-lite.*

- **Product:** AuditLens — senior-grade UX audit tool; ACP is the sole operator, running material through evaluation frameworks to a client-exportable report.
- **Canon version:** 1.0
- **Created:** 2026-07-31 · **Last amended:** 2026-07-31

## Section 1 — Controlled Vocabulary

| Concept | Canonical term | Banned synonyms | Notes |
|---|---|---|---|
| The evaluation run itself | `audit` | — | Process lane. "Run Audit", "New audit", "an audit is still running", "this audit is incomplete". |
| The exported artifact | `report` | document | Output lane — two load-bearing concepts, not synonyms: an audit *runs*, a report *exports*. "Export report", "AuditLens Report", `auditlens-report-*.html`. Commander ruling 2026-07-31. |
| Uploaded image of the interface, and its numbering | `Screenshot` (e.g. "Screenshot 1") | screen *(as a numbering/labeling system)* | "screen" stays legal only in ordinary descriptive prose, never as an alt text, figcaption, counter, or model-facing numbering instruction. Rationale: multiple screenshots can depict one screen, so screen-numbering can be false while screenshot-numbering is always true. |
| An individual point raised within a framework section | `finding` | issue, problem, criticism, observation *(in authored strings)* | Ban covers authored UI strings — labels, buttons, aria-labels, structural prompt vocabulary. Model runtime prose is steered, not blocked. **Exempt:** "observation" in the What's Working Well vehicle (`lib/prompts.ts:335`) — names positive commentary, a different concept from `finding`, not a mislabeled one. |
| A framework's identity | register: chip label ↔ report heading (e.g. `Accessibility` ↔ `ACCESSIBILITY AUDIT`) | — | Canonized as designed intent, both faces kept. Headings are proper nouns — exempt from the audit/report lane split above; "AUDIT" inside a heading is not a violation. |
| Selectable evaluation lens | `framework` | — | Consistent throughout. |
| Input as a whole (screenshots + concept, together) | `material` | — | Consistent throughout. |
| Text-only description of an unbuilt flow | `concept` / `concept description` | — | Consistent throughout. |
| What the user is trying to accomplish | `task scenario` | — | Consistent throughout. |
| Who the interface is evaluated for | `audience` | — | Consistent throughout. |
| The three severity levels | `Pass` / `Minor` / `Critical` | — | Tokens `[PASS]`/`[MINOR]`/`[CRITICAL]`. Legacy emoji tolerated by the parser only, never shown in UI. |
| A section's completion state (not severity) | `Queued` / `Evaluating…` / `Complete` / `Cut off` / `Failed` | — | Distinct axis from severity. |
| The letter score | `grade` / `letter grade` | — | Consistent throughout. |

Executors may propose new terms; only ACP rules.

## Section 2 — Content Types

- `Screenshot` — uploaded image of the interface — canonical
- `Concept Description` — freeform text describing an unbuilt flow — canonical
- `Task Scenario` — freeform text naming the user's goal — canonical
- `Framework Section` — one streamed pass per selected framework — canonical
- `Overall Assessment` — synthesis pass: letter grade + Top 3 Quick Wins + What's Working Well — canonical, id `overall`
- `Report` — the downloadable self-contained HTML artifact — canonical

## Section 3 — Structure Map

Single-page app, no routing (`app/page.tsx` is the only screen; one API route). Two states, not nav:
- **Header** (always) → lockup/home, Export report, New audit
- **Input Panel** (idle) → Screenshots → Concept Description → Task Scenario → Audience Context → Evaluation Frameworks → Run Audit
- **Report Panel** (running/done) → Context Panel → Framework Progress → error banner → Grade Card (only once complete) → Overall Panel → Section Tabs → active Section Card

## Changelog

- 2026-07-31 — v1.0 — initial canon (retrofit)
