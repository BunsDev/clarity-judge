/**
 * Types for talking to TypeSafe's Jev model.
 *
 * Jev doesn't generate text. You send it a piece of "state" (for us: the
 * user's writing) plus a set of typed questions, and it answers every question
 * in one go with structured values and probabilities.
 *
 * We use two of Jev's three question types:
 *   - "noul"   → a yes/no question. Jev returns the probability that the answer is "yes".
 *   - "choice" → pick one option from a list. Jev returns the pick plus a
 *                probability for every option and a confidence value.
 *
 * These types are the app's own, beginner-friendly shape. `lib/jevClient.ts`
 * converts them to the exact wire format the TypeSafe API expects.
 */

export type NoulQuestion = {
  type: "noul";
  /** Unique key so we can match answers back to axes. */
  id: string;
  /** The yes/no question, phrased so that "yes" is unambiguous. */
  question: string;
  /** Optional plain-language description of what a good answer looks like. */
  goodLooksLike?: string;
  /** Optional clarification of what "true" and "false" should mean. */
  criteria?: { true: string; false: string };
};

export type ChoiceQuestion = {
  type: "choice";
  id: string;
  question: string;
  /** The option keys Jev must choose between (e.g. ["formal", "casual"]). */
  options: string[];
  /** Optional one-line description per option, keyed by option. */
  optionDescriptions?: Record<string, string>;
  goodLooksLike?: string;
};

export type JevQuestion = NoulQuestion | ChoiceQuestion;

export type JevRequest = {
  /** The text being judged. Jev calls this "state". */
  context: string;
  questions: JevQuestion[];
};

export type JevAnswer = {
  id: string;
  type: "noul" | "choice";
  /** `true`/`false` for noul questions, the chosen option key for choice questions. */
  value: boolean | string;
  /** For noul: the probability (0–1) that the answer is "yes". */
  probability?: number;
  /** For choice: probability (0–1) for every option. */
  optionProbabilities?: Record<string, number>;
  /**
   * 0–1. For choice questions this comes straight from Jev. Noul answers don't
   * carry a confidence field, so we derive one: max(p, 1 - p). A probability
   * of 0.5 is a coin flip (confidence 0.5); 0.95 or 0.05 is very sure (0.95).
   */
  confidence: number;
  /** True when Jev's answer was missing or malformed and a human should look. */
  needsReview: boolean;
};

export type JevErrorCode =
  | "rate_limited"
  | "auth"
  | "billing"
  | "validation"
  | "overloaded"
  | "timeout"
  | "network"
  | "bad_response"
  | "unknown";

/** Thrown by `callJev` for any failure. Carries enough detail to show the user. */
export class JevApiError extends Error {
  code: JevErrorCode;
  status?: number;
  /** The raw response body (or underlying error text) for debugging. */
  raw?: string;

  constructor(message: string, code: JevErrorCode, status?: number, raw?: string) {
    super(message);
    this.name = "JevApiError";
    this.code = code;
    this.status = status;
    this.raw = raw;
  }
}

/** Plain-object version of JevApiError, safe to send from the API route to the browser. */
export type JevErrorPayload = {
  error: string;
  code: JevErrorCode;
  status?: number;
  raw?: string;
};
