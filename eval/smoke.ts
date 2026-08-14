/**
 * Smoke eval — one fixed input, one real call to Claude, a handful of
 * loose structural assertions. This is not a quality eval: it exists to
 * catch a broken prompt, a dead model id, or an API contract change
 * before either reaches a client-facing audit. Requires
 * ANTHROPIC_API_KEY in the environment; the harness Action skips this
 * step entirely when the secret isn't present.
 *
 * Builds the request the same way app/api/evaluate/route.ts does —
 * same model constant, same prompt builders — but calls the Anthropic
 * API directly (non-streaming) rather than going through the Next.js
 * route, so it needs no running server.
 */
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildSharedSystemPrompt, buildFrameworkInstruction } from "../lib/prompts";
import { CLAUDE_MODEL } from "../lib/ai-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface FixtureInput {
  framework: string;
  audience: string;
  taskScenario: string;
  conceptText: string;
}

interface ExpectedProperties {
  minTextLength: number;
  forbiddenStopReasons: string[];
  mustContainHeading: boolean;
  severityBadgePattern: string;
}

function fail(message: string): never {
  console.error(`✗ eval:smoke failed — ${message}`);
  process.exit(1);
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    fail("ANTHROPIC_API_KEY is not set in the environment.");
  }

  const fixture: FixtureInput = JSON.parse(
    readFileSync(path.join(__dirname, "fixture-input.json"), "utf-8")
  );
  const expected: ExpectedProperties = JSON.parse(
    readFileSync(path.join(__dirname, "expected-properties.json"), "utf-8")
  );

  const system = buildSharedSystemPrompt(fixture.audience, false);
  const instruction = buildFrameworkInstruction(fixture.framework, false);

  const materialContext = `There are no screenshots in this conversation. The material for this audit is the written concept description below — evaluate the design decisions it commits to, and do not invent visual evidence.\n\n--- CONCEPT DESCRIPTION ---\n${fixture.conceptText}\n--- END DESCRIPTION ---`;
  const taskContext = `\n\nTask scenario: ${fixture.taskScenario}`;

  console.log(
    `Running smoke eval — framework: ${fixture.framework}, model: ${CLAUDE_MODEL}`
  );

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      stream: false,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${materialContext}${taskContext}` },
            { type: "text", text: instruction },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    fail(`Claude API returned ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    stop_reason: string;
    content: Array<{ type: string; text?: string }>;
  };

  const text = data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text || "")
    .join("");

  if (expected.forbiddenStopReasons.includes(data.stop_reason)) {
    fail(`stop_reason "${data.stop_reason}" is in the forbidden list.`);
  }

  if (text.length < expected.minTextLength) {
    fail(
      `Response text is ${text.length} chars, expected at least ${expected.minTextLength}.`
    );
  }

  if (expected.mustContainHeading) {
    // buildFrameworkInstruction instructs the model to open with this
    // exact "## <HEADING>" line — check for the heading marker, not the
    // full instruction text, so minor prompt wording changes don't
    // spuriously fail this check.
    if (!/^##\s+\S/m.test(text)) {
      fail("Response does not open with a markdown '##' heading.");
    }
  }

  const badgePattern = new RegExp(expected.severityBadgePattern);
  if (!badgePattern.test(text)) {
    fail(
      `Response does not contain a severity badge matching ${expected.severityBadgePattern}.`
    );
  }

  console.log(
    `✓ eval:smoke passed — stop_reason: ${data.stop_reason}, ${text.length} chars`
  );
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
