import { callJev } from "@/lib/jevClient";
import { mockCallJev } from "@/lib/mockJevClient";
import { JevApiError, type JevErrorPayload, type JevQuestion, type JevRequest } from "@/types/jev";

/**
 * POST /api/judge
 *
 * The browser never sees the TypeSafe API key. It sends a `JevRequest` here,
 * and this route forwards it to Jev. If no key is configured, it answers with
 * the mock so the app keeps working (the client normally short-circuits to the
 * mock itself in demo mode; this is a safety net).
 *
 * Success:  200 { answers: JevAnswer[], demo: boolean }
 * Failure:  4xx/5xx { error, code, status?, raw? }   (see JevErrorPayload)
 */

const MAX_TEXT_CHARS = 150_000; // roughly Jev's 32k-token budget
const MAX_QUESTIONS = 50;

function errorResponse(error: JevApiError): Response {
  const payload: JevErrorPayload = {
    error: error.message,
    code: error.code,
    status: error.status,
    raw: error.raw,
  };
  // Pass rate-limit / auth statuses through so the client can react; otherwise 502.
  const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 502;
  return Response.json(payload, { status });
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
  const hasKey = Boolean(process.env.TYPESAFE_API_KEY?.trim());

  try {
    const answers = hasKey ? await callJev(jevRequest) : await mockCallJev(jevRequest, { delayMs: 0 });
    return Response.json({ answers, demo: !hasKey });
  } catch (error) {
    if (error instanceof JevApiError) return errorResponse(error);
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(new JevApiError("Unexpected error while calling Jev.", "unknown", 500, message));
  }
}
