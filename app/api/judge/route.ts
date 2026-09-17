import { JEV_MODEL, callJevDetailed } from "@/lib/jevClient";
import { mockCallJev } from "@/lib/mockJevClient";
import { redactSecrets } from "@/lib/redact";
import { JevApiError, type JevErrorPayload, type JevQuestion, type JevRequest } from "@/types/jev";

/**
 * POST /api/judge
 *
 * The server's API key never leaves the server. The browser sends a
 * `JevRequest` here and this route forwards it to Jev.
 *
 * Which key is used, in order:
 *   1. the `x-typesafe-api-key` header, if the user saved a key in the UI
 *   2. TYPESAFE_API_KEY from .env.local
 *   3. neither → the mock answers (demo mode safety net)
 *
 * Error bodies are passed through redactSecrets() so a key can never be echoed
 * back to the screen, and nothing here logs the key.
 *
 * Success:  200 { answers, demo, model, latencyMs, usage: { inputTokens?, outputTokens? } }
 * Failure:  4xx/5xx { error, code, status?, raw? }   (see JevErrorPayload)
 */

const MAX_TEXT_CHARS = 150_000; // roughly Jev's 32k-token budget
const MAX_QUESTIONS = 50;
export const API_KEY_HEADER = "x-typesafe-api-key";

function errorResponse(error: JevApiError): Response {
  const payload: JevErrorPayload = {
    error: redactSecrets(error.message) ?? error.message,
    code: error.code,
    status: error.status,
    raw: redactSecrets(error.raw),
  };
  // Pass rate-limit / auth statuses through so the client can react; otherwise 502.
  const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 502;
  return Response.json(payload, { status });
}

/** Rough token estimate for demo mode, so the readout has something to show. */
function estimateUsage(request: JevRequest) {
  const chars = request.context.length + request.questions.reduce((n, q) => n + q.question.length, 0);
  return { inputTokens: Math.ceil(chars / 4), outputTokens: request.questions.length };
}

/** Very small hand-written validator. Returns an error message or null. */
export function validateRequest(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";
  const { context, questions } = body as Partial<JevRequest>;
  if (typeof context !== "string" || context.trim().length === 0) return "`context` must be a non-empty string.";
  if (context.length > MAX_TEXT_CHARS) return `Text is too long (max ${MAX_TEXT_CHARS.toLocaleString()} characters).`;
  if (!Array.isArray(questions) || questions.length === 0) return "`questions` must be a non-empty array.";
  if (questions.length > MAX_QUESTIONS) return `Too many questions (max ${MAX_QUESTIONS}).`;
  for (const q of questions as Partial<JevQuestion>[]) {
    if (!q || typeof q.id !== "string" || typeof q.question !== "string") return "Each question needs an `id` and `question`.";
    if (q.type !== "noul" && q.type !== "choice") return `Unknown question type "${String(q.type)}".`;
    if (q.type === "choice" && (!Array.isArray(q.options) || q.options.length < 2)) {
      return `Choice question "${q.id}" needs at least two options.`;
    }
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(new JevApiError("Request body was not valid JSON.", "validation", 400));
  }

  const problem = validateRequest(body);
  if (problem) return errorResponse(new JevApiError(problem, "validation", 400));

  const jevRequest = body as JevRequest;
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim() || process.env.TYPESAFE_API_KEY?.trim() || "";

  try {
    const started = Date.now();
    const { answers, usage } = apiKey
      ? await callJevDetailed(jevRequest, apiKey)
      : { answers: await mockCallJev(jevRequest, { delayMs: 0 }), usage: estimateUsage(jevRequest) };
    return Response.json({ answers, demo: !apiKey, model: apiKey ? JEV_MODEL : "simulated", latencyMs: Date.now() - started, usage });
  } catch (error) {
    if (error instanceof JevApiError) return errorResponse(error);
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(new JevApiError("Unexpected error while calling Jev.", "unknown", 500, message));
  }
}
