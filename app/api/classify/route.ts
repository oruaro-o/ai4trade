import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { loadHtsContext } from "@/lib/hts-context";

// ── Types ──────────────────────────────────────────────────────────────────

export type ClassificationResult = {
  rank: number;
  htsCode: string;
  description: string;
  confidence: number;
  reasoning: string;
  dutyRate: string;
  costEffectivenessNote: string;
};

export type APIResponse = {
  results: ClassificationResult[];
};

export type APIErrorResponse = {
  error: string;
  code: "INVALID_IMAGE" | "UNCLASSIFIABLE" | "LLM_ERROR" | "RATE_LIMITED";
};

// ── Zod Schemas ────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  image: z.string().min(1, "Image is required"),
});

const ClassificationResultSchema = z.object({
  rank: z.number().int().min(1).max(5),
  htsCode: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  dutyRate: z.string(),
  costEffectivenessNote: z.string(),
});

const LLMSuccessSchema = z.object({
  results: z.array(ClassificationResultSchema).length(5),
});

const LLMErrorSchema = z.object({
  error: z.string(),
  code: z.enum(["INVALID_IMAGE", "UNCLASSIFIABLE", "LLM_ERROR", "RATE_LIMITED"]),
});

type LLMResult = z.infer<typeof LLMSuccessSchema> | z.infer<typeof LLMErrorSchema>;

// ── Config ─────────────────────────────────────────────────────────────────

const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const SUPPORTED_MEDIA_TYPES = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

// ── Prompt ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert customs classification specialist with deep knowledge of the Harmonized Tariff Schedule of the United States (HTSUS). You have decades of experience accurately classifying imported goods for customs and trade compliance purposes.

Your task:
1. Carefully analyze the provided image to identify the physical good depicted.
2. Using the HTS reference document supplied in the user message (if present), determine the 5 most plausible HTS classifications for this good.
3. Rank the 5 candidates by cost-effectiveness — lowest effective duty rate first (rank 1 = best/cheapest).
4. Return ONLY valid JSON matching the exact schema below. No markdown fencing, no preamble, no explanation outside the JSON.

Required JSON schema:
{
  "results": [
    {
      "rank": 1,
      "htsCode": "XXXX.XX.XXXX",
      "description": "Plain-language description of the HTS heading/subheading",
      "confidence": 0.95,
      "reasoning": "1–3 sentences explaining why this code is a plausible match for the image.",
      "dutyRate": "Free",
      "costEffectivenessNote": "Brief note on the duty implications of this classification."
    }
  ]
}

Rules:
- Provide exactly 5 results, ranked 1 (lowest duty) to 5 (highest duty).
- Use 8–10 digit HTS codes where possible (e.g. "8471.30.0100").
- confidence is a float between 0.0 and 1.0 reflecting how well the image matches the code.
- dutyRate should reflect the general (MFN) rate (e.g. "Free", "2.5%", "4.9%").
- If the image is unclear, does not depict a physical good, or is genuinely unclassifiable, return ONLY this JSON:
  {"error": "<brief explanation>", "code": "UNCLASSIFIABLE"}
- If image quality prevents confident identification, return ONLY this JSON:
  {"error": "<brief explanation>", "code": "INVALID_IMAGE"}
- Do NOT guess wildly. Confidence scores should be honest.
- Output valid JSON only. Never include markdown code fences or any text outside the JSON object.`;

function buildUserMessage(htsContext: string): string {
  if (!htsContext) {
    return "Please analyze the image above and classify this good using your knowledge of the HTS. The goods are being transported from India to the US directly.";
  }
  return (
    "Please analyze the image above and classify this good using the HTS reference below. The goods are being transported from India to the US directly.\n\n" +
    "--- HTS REFERENCE ---\n" +
    htsContext +
    "\n--- END HTS REFERENCE ---"
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseDataUrl(
  dataUrl: string
): { mediaType: ImageMediaType; base64Data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  // Normalise image/jpg → image/jpeg (non-standard but seen in the wild)
  const rawType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  if (!SUPPORTED_MEDIA_TYPES.has(rawType)) return null;

  return { mediaType: rawType as ImageMediaType, base64Data: match[2] };
}

async function callClaude(
  client: Anthropic,
  mediaType: ImageMediaType,
  base64Data: string,
  htsContext: string,
  attempt: number
): Promise<LLMResult> {
  const start = Date.now();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Data },
          },
          {
            type: "text",
            text: buildUserMessage(htsContext),
          },
        ],
      },
    ],
  });

  const duration = Date.now() - start;
  console.log(`[classify] LLM call attempt ${attempt} completed in ${duration}ms`);

  const rawText =
    response.content[0]?.type === "text" ? response.content[0].text.trim() : "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(
      `LLM returned non-JSON on attempt ${attempt}: ${rawText.slice(0, 300)}`
    );
  }

  // LLM reported it can't classify the image
  const errorParse = LLMErrorSchema.safeParse(parsed);
  if (errorParse.success) return errorParse.data;

  // Validate the success shape
  const successParse = LLMSuccessSchema.safeParse(parsed);
  if (successParse.success) return successParse.data;

  throw new Error(
    `LLM response failed schema validation on attempt ${attempt}: ` +
      JSON.stringify(successParse.error.issues)
  );
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("[classify] Request received");

  // TODO: Add rate limiting before going to production.
  // Recommended: Upstash Redis (@upstash/ratelimit) keyed by req.ip,
  // or Vercel's built-in edge rate limiting via middleware.
  // Example: 10 requests per IP per minute.

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[classify] ANTHROPIC_API_KEY is not configured");
    return NextResponse.json<APIErrorResponse>(
      { error: "Server configuration error", code: "LLM_ERROR" },
      { status: 500 }
    );
  }

  // Parse request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<APIErrorResponse>(
      { error: "Request body must be valid JSON", code: "INVALID_IMAGE" },
      { status: 400 }
    );
  }

  // Validate request shape
  const reqParse = RequestSchema.safeParse(body);
  if (!reqParse.success) {
    return NextResponse.json<APIErrorResponse>(
      { error: "Missing or invalid `image` field", code: "INVALID_IMAGE" },
      { status: 400 }
    );
  }

  // Validate and extract base64 image data
  const imageData = parseDataUrl(reqParse.data.image);
  if (!imageData) {
    return NextResponse.json<APIErrorResponse>(
      {
        error:
          "Image must be a base64 data URL with a supported type (jpeg, png, gif, webp)",
        code: "INVALID_IMAGE",
      },
      { status: 400 }
    );
  }

  // Check file size (base64 length × 0.75 ≈ byte size)
  const approximateBytes = Math.ceil(imageData.base64Data.length * 0.75);
  if (approximateBytes > MAX_IMAGE_BYTES) {
    return NextResponse.json<APIErrorResponse>(
      { error: "Image exceeds the 10 MB size limit", code: "INVALID_IMAGE" },
      { status: 413 }
    );
  }

  const client = new Anthropic({ apiKey });
  const htsContext = loadHtsContext();

  // Call Claude — one automatic retry on JSON/schema failure
  let llmResult: LLMResult;
  try {
    llmResult = await callClaude(
      client,
      imageData.mediaType,
      imageData.base64Data,
      htsContext,
      1
    );
  } catch (firstErr) {
    console.warn("[classify] First attempt failed, retrying:", firstErr);
    try {
      llmResult = await callClaude(
        client,
        imageData.mediaType,
        imageData.base64Data,
        htsContext,
        2
      );
    } catch (secondErr) {
      console.error("[classify] Both LLM attempts failed:", secondErr);
      return NextResponse.json<APIErrorResponse>(
        { error: "Classification service error — please try again", code: "LLM_ERROR" },
        { status: 500 }
      );
    }
  }

  // LLM signalled it couldn't classify the image
  if ("error" in llmResult) {
    const status = llmResult.code === "INVALID_IMAGE" ? 400 : 422;
    return NextResponse.json<APIErrorResponse>(llmResult, { status });
  }

  return NextResponse.json<APIResponse>(llmResult);
}
