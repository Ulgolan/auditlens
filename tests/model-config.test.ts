import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { CLAUDE_MODEL } from "../lib/ai-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("model string tripwire (redundant with the ESLint no-restricted-syntax rule)", () => {
  it("lib/ai-config.ts exports a claude- model id", () => {
    expect(CLAUDE_MODEL).toMatch(/^claude-/);
  });

  it("the API route imports the model from the config module, not a literal", () => {
    const routeSource = readFileSync(
      path.join(__dirname, "../app/api/evaluate/route.ts"),
      "utf-8"
    );

    expect(routeSource).toContain('import { CLAUDE_MODEL } from "@/lib/ai-config"');
    expect(routeSource).toContain("model: CLAUDE_MODEL");
    expect(routeSource).not.toMatch(/model:\s*"claude-/);
  });
});
