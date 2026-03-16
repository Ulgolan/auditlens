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
  description: string;
}

export type EvalPhase = "idle" | "uploading" | "analyzing" | "streaming" | "done" | "error";

export const FRAMEWORKS: Framework[] = [
  { id: "nielsen", label: "Nielsen's 10", icon: "📐", description: "Heuristic evaluation with Gestalt principles", default: true },
  { id: "cw", label: "Cognitive Walkthrough", icon: "🧠", description: "Task-journey evaluation with mental model tracking", default: true },
  { id: "state", label: "State Stress Test", icon: "⚡", description: "5 UI states: Empty, Loading, Partial, Error, Ideal", default: true },
  { id: "a11y", label: "Accessibility", icon: "♿", description: "WCAG-based visual accessibility review", default: true },
];

export const AUDIENCES: Audience[] = [
  { id: "consumer", label: "General Consumer", description: "Non-technical users — most conservative calibration" },
  { id: "enterprise", label: "Enterprise B2B", description: "Domain experts, trained users, complex workflows" },
  { id: "developer", label: "Developer Tool", description: "Technical users who read docs and explore" },
  { id: "saas", label: "SaaS Product", description: "Mixed technical literacy, self-serve onboarding" },
  { id: "ecommerce", label: "E-commerce", description: "Transaction-focused, conversion-critical" },
];
