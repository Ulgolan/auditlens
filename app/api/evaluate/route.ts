import { NextRequest } from "next/server";
import {
  buildSharedSystemPrompt,
  buildFrameworkInstruction,
  buildOverallSystemPrompt,
} from "@/lib/prompts";
import { CLAUDE_MODEL } from "@/lib/ai-config";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 300;
export const runtime = "nodejs";

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

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
  /** Written description of an idea or flow, when there is no visual material. */
  conceptText?: string;
  /**
   * Whether the audit as a whole had visual material.
   *
   * Read ONLY on the overall pass, and ignored everywhere else. Framework
   * passes derive the mode from their own payload, which cannot lie. The
   * overall pass is handed the assembled report and no material at all,
   * so there is genuinely nothing there to derive from — a declaration is
   * the only signal available, and with no content present it has nothing
   * to contradict.
   */
  visualsPresent?: boolean;
  taskScenario: string;
  audience: string;
  framework: string;
  priorReport?: string;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait before retrying." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as EvaluateBody;
    const {
      images,
      conceptText,
      visualsPresent,
      taskScenario,
      audience,
      framework,
      priorReport,
    } = body;

    if (!framework) {
      return new Response(JSON.stringify({ error: "No framework specified" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isOverall = framework === "overall";

    // Mode is DERIVED, never declared. A `mode` field in the body would be
    // a second source of truth that can contradict the payload it
    // describes — `mode:"text"` arriving with images attached would put
    // the model in concept mode while looking straight at screenshots,
    // and nothing here could catch it. The content decides.
    const hasVisuals = Array.isArray(images) && images.length > 0;
    const concept = (conceptText || "").trim();

    if (!isOverall && !hasVisuals && !concept) {
      return new Response(
        JSON.stringify({
          error: "Provide screenshots or a written concept description.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ─── Build system prompt ───
    // For framework passes this is identical on every call, which is
    // what lets the screenshots below it stay cached.
    let system: string;
    let instruction: string | null = null;
    try {
      if (isOverall) {
        // See visualsPresent above: declared, because this pass has no
        // material of its own to derive from. Defaults to true so an
        // older client that never sends it keeps its v2.0 behaviour.
        system = buildOverallSystemPrompt(audience, visualsPresent !== false);
      } else {
        system = buildSharedSystemPrompt(audience, hasVisuals);
        instruction = buildFrameworkInstruction(framework, hasVisuals);
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
      // Stable prefix: material + shared context. Cached across every
      // framework call in this audit, so calls 2..N read the material at
      // roughly a tenth of the cost instead of re-sending it.
      if (hasVisuals) {
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
      }

      let materialContext: string;
      if (hasVisuals) {
        materialContext =
          images.length > 1
            ? `I've uploaded ${images.length} screenshots showing a sequential flow. Evaluate them as a unified experience, referencing specific screens by number (Screen 1, Screen 2, etc.).`
            : "I've uploaded a screenshot for evaluation.";
        // Mixed material: visuals plus a written description of what
        // happens between or around them. The visuals still govern —
        // concept-mode rules are NOT in force here, because there is real
        // visual evidence to cite.
        if (concept) {
          materialContext += `\n\nThe designer has also provided a written description of the concept and flow. Use it to understand intent and to fill in what happens between screens. Where the description and the screenshots disagree, the screenshots are what exists — say so.\n\n--- CONCEPT DESCRIPTION ---\n${concept}\n--- END DESCRIPTION ---`;
        }
      } else {
        // Concept-only. No visual evidence exists anywhere in this
        // conversation; the system prompt carries the rules that keep the
        // model from inventing some.
        materialContext = `There are no screenshots in this conversation. The material for this audit is the written concept description below — evaluate the design decisions it commits to, and do not invent visual evidence.\n\n--- CONCEPT DESCRIPTION ---\n${concept}\n--- END DESCRIPTION ---`;
      }

      const taskContext = taskScenario
        ? `\n\nTask scenario: ${taskScenario}`
        : hasVisuals
          ? "\n\nNo specific task scenario provided — infer the most likely primary task from the UI and note that the walkthrough is based on inference."
          : "\n\nNo specific task scenario provided — infer the most likely primary task from the description and note that the walkthrough is based on inference.";

      content.push({
        type: "text",
        text: `${materialContext}${taskContext}`,
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
        model: CLAUDE_MODEL,
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
        output_config: { effort: "low" },
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
