export interface Screenshot {
  id: string;
  file: File;
  dataUrl: string;
  name: string;
}

export interface Framework {
  id: string;
  label: string;
  icon: string;
  description: string;
  default: boolean;
}

export interface Audience {
  id: string;
  label: string;
  /** Shown to the operator on the chip tooltip. */
  description: string;
  /**
   * The sentence handed to the model. Lives here, next to the label, on
   * purpose: v2.0 kept a second id->sentence map inside prompts.ts with a
   * silent `|| consumer` fallback, so an audience added in one file and
   * forgotten in the other audited as General Consumer without ever
   * saying so. One list, no drift.
   */
  promptLabel: string;
}

export type EvalPhase = "idle" | "processing" | "running" | "done" | "error";

/**
 * Why a section stopped.
 * - complete  → the model signalled end_turn. Trustworthy.
 * - truncated → hit max_tokens, OR the stream ended with no completion
 *               signal at all (dropped connection / function timeout).
 *               Either way the section is incomplete and must say so.
 * - failed    → the request errored, or the model declined.
 */
export type SectionStatus =
  | "pending"
  | "streaming"
  | "complete"
  | "truncated"
  | "failed";

export interface ReportSection {
  id: string; // framework id, or "overall"
  label: string;
  text: string;
  status: SectionStatus;
  /** Human-readable reason, shown to the operator when not complete. */
  detail?: string;
}

export const OVERALL_ID = "overall";

export const FRAMEWORKS: Framework[] = [
  { id: "nielsen", label: "Nielsen's 10", icon: "📐", description: "Heuristic evaluation with Gestalt principles", default: true },
  { id: "cw", label: "Cognitive Walkthrough", icon: "🧠", description: "Task-journey evaluation with mental model tracking", default: true },
  { id: "state", label: "State Stress Test", icon: "⚡", description: "5 UI states: Empty, Loading, Partial, Error, Ideal", default: true },
  { id: "a11y", label: "Accessibility", icon: "♿", description: "WCAG-based visual accessibility review", default: true },
];

/**
 * Audience categories key on the user's RELATIONSHIP to the interface —
 * expertise, frequency, and cost of error — not on product vertical.
 * v2.0's list mixed the two ("SaaS" is a business model, not an
 * audience; "Enterprise B2B" and "Developer Tool" both just meant
 * *trained user*), which left no honest home for a habitual consumer
 * and no way at all to weight a high-stakes context.
 */
export const AUDIENCES: Audience[] = [
  {
    id: "public",
    label: "General Public",
    description: "Infrequent, untrained, no motivation to persist — most conservative calibration",
    promptLabel:
      "General Public (infrequent, untrained users with no motivation to persist through friction — the most conservative severity calibration. Assume no prior exposure to the product, no tolerance for jargon, and abandonment as the default response to confusion.)",
  },
  {
    id: "habitual",
    label: "Habitual Consumer",
    description: "Uses it often by choice — tolerates density for power. Games, social, media",
    promptLabel:
      "Habitual Consumer (uses the product frequently and by choice — games, social, media. Tolerates information density, learned shortcuts, and non-standard patterns in exchange for speed and expressive power. Do not penalise density or a learning curve on its own; penalise anything that punishes returning users or breaks a learned habit.)",
  },
  {
    id: "operator",
    label: "Professional Operator",
    description: "Trained, daily, work-critical — speed and density beat hand-holding",
    promptLabel:
      "Professional Operator (trained users operating the product daily as core work. Speed and information density beat hand-holding; onboarding affordances that slow an expert down are themselves a cost. Errors are expensive in time and rework, so weight error prevention and recovery heavily, and weight discoverability lightly.)",
  },
  {
    id: "practitioner",
    label: "Technical Practitioner",
    description: "Reads docs, explores — expects escape hatches and keyboard paths",
    promptLabel:
      "Technical Practitioner (developers, analysts, and similar. Reads documentation, explores deliberately, and expects escape hatches, keyboard paths, and predictable, inspectable system behaviour. Tolerates complexity but not opacity — hidden state and unexplained magic are severe here even when they would be minor elsewhere.)",
  },
  {
    id: "transactional",
    label: "Transactional Visitor",
    description: "One-shot intent to buy, book, or apply — abandonment is the failure mode",
    promptLabel:
      "Transactional Visitor (arrives with a specific one-shot intent — buy, book, or apply — and will not return to retry. Abandonment is the primary failure mode, so weight anything that introduces doubt, hidden cost, or an unnecessary step at the point of commitment as more severe than its usability impact alone suggests.)",
  },
  {
    id: "highstakes",
    label: "Regulated / High-Stakes",
    description: "Health, finance, safety, government — errors cause real harm",
    promptLabel:
      "Regulated / High-Stakes (health, finance, safety, or government contexts where an error causes real harm to the user, not merely inconvenience. Weight error prevention, confirmation of destructive or irreversible actions, and accessibility most heavily of all — an accessibility barrier here is an exclusion from an essential service, not a polish item. Never downgrade a severity for aesthetic reasons.)",
  },
];
