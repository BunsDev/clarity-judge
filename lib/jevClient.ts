import { JevApiError, type JevAnswer, type JevRequest } from "@/types/jev";

/**
 * Real client for TypeSafe's Jev model.
 *
 * Server-side only: it reads `TYPESAFE_API_KEY` from the environment, so it
 * must be called from `app/api/judge/route.ts`, never from browser code.
 *
 * One request carries every question. Jev evaluates them all in parallel
 * against the same text, so a judgment run costs one round trip regardless of
 * how many axes are switched on.
 *
 * Wire format (from https://docs.typesafe.ai/api):
 *   POST https://api.typesafe.ai/v1/systemone
 *   Authorization: Bearer <key>
 *   { "state": "<text>", "model": "jev-latest", "questions": { "<id>": {...}, ... } }
 *
 * Question shapes:
 *   { "type": "noul",   "instructions": "...", "criteria"?: { "true": "...", "false": "..." } }
 *   { "type": "choice", "instructions": "...", "criteria": { "<option>": "<description>" } }
 *
 * Answer shapes:
 *   { "type": "noul",   "noul": 0.87 }                                   ← no confidence field
 *   { "type": "choice", "choice": "formal", "probabilities": {...}, "confidence": 0.91 }
 */

export const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
export const JEV_MODEL = "jev-latest";
const TIMEOUT_MS = 20_000;

type WireQuestion =
  | { type: "noul"; instructions: unknown; criteria?: { true: string; false: string } }
  | { type: "choice"; instructions: unknown; criteria: Record<string, string> };

type WireAnswer = {
  type?: string;
  noul?: number;
  choice?: string;
  probabilities?: Record<string, number>;
  confidence?: number;
};

type WireResponse = {
  answers?: Record<string, WireAnswer>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

/** Convert our friendly request shape into TypeSafe's keyed-map format. */
export function toWireRequest(request: JevRequest): {
  state: string;
  model: string;
  questions: Record<string, WireQuestion>;
} {
  const questions: Record<string, WireQuestion> = {};

  for (const question of request.questions) {
    // Jev understands structured instructions, so when the user described
    // what "good" looks like we send it alongside the question as an object.
    const instructions: unknown = question.goodLooksLike
      ? { question: question.question, what_good_looks_like: question.goodLooksLike }
      : question.question;

    if (question.type === "noul") {
      questions[question.id] = {
        type: "noul",
        instructions,
        ...(question.criteria ? { criteria: question.criteria } : {}),
      };
    } else {
      const criteria: Record<string, string> = {};
      for (const option of question.options) {
        criteria[option] = question.optionDescriptions?.[option] ?? option;
      }
      questions[question.id] = { type: "choice", instructions, criteria };
    }
  }

  return { state: request.context, model: JEV_MODEL, questions };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Turn Jev's raw answers into our `JevAnswer` shape. Never throws on a single
 * bad answer — a missing or malformed value becomes `needsReview: true` so the
 * UI can flag it instead of crashing the whole run.
 */
export function normalizeAnswers(request: JevRequest, body: WireResponse): JevAnswer[] {
  const answers = body.answers ?? {};

  return request.questions.map((question) => {
    const raw = answers[question.id];

    if (question.type === "noul") {
      const p = raw?.noul;
      if (!isFiniteNumber(p) || p < 0 || p > 1) {
        return { id: question.id, type: "noul", value: false, confidence: 0, needsReview: true };
      }
      return {
        id: question.id,
        type: "noul",
        value: p >= 0.5,
        probability: p,
        confidence: Math.max(p, 1 - p), // derived: how far from a coin flip
        needsReview: false,
      };
    }

    const choice = raw?.choice;
    const optionProbabilities = raw?.probabilities;
    const validChoice = typeof choice === "string" && question.options.includes(choice);
    if (!validChoice) {
      return { id: question.id, type: "choice", value: "", confidence: 0, needsReview: true };
    }
    // Confidence should come from Jev. If it's missing, fall back to the winning
    // option's probability; if that's missing too, flag for review.
    const confidence = isFiniteNumber(raw?.confidence)
      ? raw.confidence
      : isFiniteNumber(optionProbabilities?.[choice])
        ? optionProbabilities[choice]
        : null;
    return {
      id: question.id,
      type: "choice",
      value: choice,
      optionProbabilities: optionProbabilities ?? undefined,
      confidence: confidence ?? 0,
      needsReview: confidence === null,
    };
  });
}

/** Map an HTTP status to a friendly message + error code. */
export function describeHttpError(status: number, raw: string): JevApiError {
  switch (status) {
    case 429:
      return new JevApiError("You've hit the API rate limit, try again in a moment.", "rate_limited", status, raw);
    case 401:
    case 403:
      return new JevApiError("TypeSafe rejected the API key. Check TYPESAFE_API_KEY in .env.local.", "auth", status, raw);
    case 400:
    case 422:
      return new JevApiError("TypeSafe rejected the request as invalid.", "validation", status, raw);
    case 529:
    case 503:
      return new JevApiError("TypeSafe is overloaded right now. Try again shortly.", "overloaded", status, raw);
    default:
      return new JevApiError(`TypeSafe API returned HTTP ${status}.`, "unknown", status, raw);
  }
}

export async function callJev(request: JevRequest): Promise<JevAnswer[]> {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) {
    throw new JevApiError("TYPESAFE_API_KEY is not set.", "auth");
  }
  if (request.questions.length === 0) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(JEV_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toWireRequest(request)),
      signal: controller.signal,
    });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    throw new JevApiError(
      isAbort ? "The request to TypeSafe timed out." : "Could not reach the TypeSafe API.",
      isAbort ? "timeout" : "network",
      undefined,
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    clearTimeout(timer);
  }

  const rawText = await response.text();
  if (!response.ok) {
    throw describeHttpError(response.status, rawText);
  }

  let body: WireResponse;
  try {
    body = JSON.parse(rawText) as WireResponse;
  } catch {
    throw new JevApiError("TypeSafe returned a response that wasn't valid JSON.", "bad_response", response.status, rawText);
  }

  return normalizeAnswers(request, body);
}
