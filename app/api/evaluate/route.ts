import { NextRequest } from "next/server";
import {
  buildSharedSystemPrompt,
  buildFrameworkInstruction,
  buildOverallSystemPrompt,
} from "@/lib/prompts";

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
    // For framework passes this is identical on every call, which is
    // what lets the screenshots below it stay cached.
    let system: string;
    let instruction: string | null = null;
    try {
      if (isOverall) {
        system = buildOverallSystemPrompt(audience);
      } else {
        system = buildSharedSystemPrompt(audience);
        instruction = buildFrameworkInstruction(framework);
      }
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
      const screenshotContext =
        images.length > 1
          ? `I've uploaded ${images.length} screenshots showing a sequential flow. Evaluate them as a unified experience, referencing specific screens by number (Screen 1, Screen 2, etc.).`
          : "I've uploaded a screenshot for evaluation.";

      const taskContext = taskScenario
        ? `\n\nTask scenario: ${taskScenario}`
        : "\n\nNo specific task scenario provided — infer the most likely primary task from the UI and note that the walkthrough is based on inference.";

      // Stable prefix: images + shared context. Cached across every
      // framework call in this audit, so calls 2..N read the images at
      // roughly a tenth of the cost instead of re-uploading them.
      images.forEach((img, i) => {
        const block: Record<string, unknown> = {
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType,
            data: img.data,
          },
        };
        if (i === images.length - 1) {
          block.cache_control = { type: "ephemeral" };
        }
        content.push(block);
      });

      content.push({
        type: "text",
        text: `${screenshotContext}${taskContext}`,
        cache_control: { type: "ephemeral" },
      });

      // Volatile suffix: the only part that differs per framework.
      content.push({ type: "text", text: instruction as string });
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
        // One framework per call now, and streaming is on, so there is
        // room to be generous. max_tokens caps thinking + visible text
        // together — v1's 16000 was shared across all four frameworks
        // AND adaptive thinking, which is a direct cause of mid-report
        // truncation. You are billed for tokens generated, not the cap.
        max_tokens: isOverall ? 16000 : 32000,
        // Explicit rather than implicit: Sonnet 5 runs adaptive thinking
        // when `thinking` is omitted, so v1 was already spending part of
        // its budget on invisible reasoning without saying so anywhere.
        thinking: { type: "adaptive" },
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
