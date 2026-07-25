import { NextRequest } from "next/server";
import { buildFrameworkSystemPrompt, buildOverallSystemPrompt } from "@/lib/prompts";

export const maxDuration = 300;
export const runtime = "nodejs";

// ═══════════════════════════════════════════════════════
// API HANDLER — one framework per request
//
// The client orchestrates: it calls this route once per selected
// framework, then once more with framework="overall" to synthesise.
// Each call gets its own maxDuration budget and its own stop_reason,
// which is what makes truncation detectable per section.
// ═══════════════════════════════════════════════════════

interface EvaluateBody {
  images: { data: string; mediaType: string }[];
  taskScenario: string;
  audience: string;
  framework: string;
  priorReport?: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as EvaluateBody;
    const { images, taskScenario, audience, framework, priorReport } = body;

    if (!framework) {
      return new Response(JSON.stringify({ error: "No framework specified" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isOverall = framework === "overall";

    if (!isOverall && (!images || images.length === 0)) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ─── Build system prompt ───
    let system: string;
    try {
      system = isOverall
        ? buildOverallSystemPrompt(audience)
        : buildFrameworkSystemPrompt(framework, audience);
    } catch {
      return new Response(JSON.stringify({ error: `Unknown framework: ${framework}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ─── Build message content ───
    const content: Array<Record<string, unknown>> = [];

    if (isOverall) {
      content.push({
        type: "text",
        text: `Here is the assembled audit report. Synthesise the final assessment from it.\n\n---\n\n${priorReport || "(No completed sections.)"}`,
      });
    } else {
      for (const img of images) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType,
            data: img.data,
          },
        });
      }

      const screenshotContext =
        images.length > 1
          ? `I've uploaded ${images.length} screenshots showing a sequential flow. Evaluate them as a unified experience, referencing specific screens by number (Screen 1, Screen 2, etc.).`
          : "I've uploaded a screenshot for evaluation.";

      const taskContext = taskScenario
        ? `\n\nTask scenario: ${taskScenario}`
        : "\n\nNo specific task scenario provided — infer the most likely primary task from the UI and note that the walkthrough is based on inference.";

      content.push({
        type: "text",
        text: `${screenshotContext}${taskContext}\n\nRun your assigned framework now.`,
      });
    }

    // ─── Call Claude ───
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 16000,
        output_config: { effort: "medium" },
        stream: true,
        system,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Claude API error:", response.status, errBody);
      return new Response(
        JSON.stringify({ error: `Claude API error: ${response.status}` }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Evaluation error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
