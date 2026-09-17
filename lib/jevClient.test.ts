import { describe, expect, it } from "vitest";
import { describeHttpError, normalizeAnswers, toWireRequest } from "./jevClient";
import type { JevRequest } from "@/types/jev";

const request: JevRequest = {
  context: "Hello world.",
  questions: [
    { type: "noul", id: "hedging", question: "Hedgy?", criteria: { true: "yes-ish", false: "no-ish" } },
    { type: "choice", id: "tone", question: "Tone?", options: ["formal", "casual"], optionDescriptions: { formal: "Suit and tie" } },
    { type: "noul", id: "custom", question: "On brand?", goodLooksLike: "Warm and direct." },
  ],
};

describe("toWireRequest", () => {
  it("produces TypeSafe's keyed-map format", () => {
    const wire = toWireRequest(request);
    expect(wire.state).toBe("Hello world.");
    expect(wire.model).toBe("jev-latest");
    expect(wire.questions.hedging).toEqual({ type: "noul", instructions: "Hedgy?", criteria: { true: "yes-ish", false: "no-ish" } });
    expect(wire.questions.tone).toEqual({
      type: "choice",
      instructions: "Tone?",
      criteria: { formal: "Suit and tie", casual: "casual" },
    });
    // "What good looks like" becomes structured instructions.
    expect(wire.questions.custom).toEqual({
      type: "noul",
      instructions: { question: "On brand?", what_good_looks_like: "Warm and direct." },
    });
  });
});

describe("normalizeAnswers", () => {
  it("converts a real-shaped response", () => {
    const answers = normalizeAnswers(request, {
      answers: {
        hedging: { type: "noul", noul: 0.82 },
        tone: { type: "choice", choice: "formal", probabilities: { formal: 0.7, casual: 0.3 }, confidence: 0.64 },
        custom: { type: "noul", noul: 0.1 },
      },
    });
    expect(answers[0]).toMatchObject({ id: "hedging", value: true, probability: 0.82, confidence: 0.82, needsReview: false });
    expect(answers[1]).toMatchObject({ id: "tone", value: "formal", confidence: 0.64, needsReview: false });
    expect(answers[2]).toMatchObject({ id: "custom", value: false, confidence: 0.9, needsReview: false });
  });

  it("flags missing or malformed answers as needsReview instead of throwing", () => {
    const answers = normalizeAnswers(request, {
      answers: {
        hedging: { type: "noul", noul: Number.NaN },
        tone: { type: "choice", choice: "nonsense" },
        // "custom" is missing entirely
      },
    });
    expect(answers.every((a) => a.needsReview)).toBe(true);
    expect(answers.every((a) => a.confidence === 0)).toBe(true);
  });

  it("falls back to the winning option's probability when choice confidence is missing", () => {
    const [, tone] = normalizeAnswers(request, {
      answers: { tone: { type: "choice", choice: "casual", probabilities: { formal: 0.2, casual: 0.8 } } },
    });
    expect(tone).toMatchObject({ value: "casual", confidence: 0.8, needsReview: false });
  });
});

describe("describeHttpError", () => {
  it("maps 429 to a rate-limit message", () => {
    const error = describeHttpError(429, "slow down");
    expect(error.code).toBe("rate_limited");
    expect(error.message).toBe("You've hit the API rate limit, try again in a moment.");
    expect(error.raw).toBe("slow down");
  });
  it("maps 402 to a billing message", () => {
    const error = describeHttpError(402, '{"detail":{"error_type":"billing_error"}}');
    expect(error.code).toBe("billing");
    expect(error.message).toMatch(/no API credits/);
  });
  it("maps 401 to an auth message", () => {
    expect(describeHttpError(401, "").code).toBe("auth");
  });
  it("maps unknown statuses to unknown", () => {
    expect(describeHttpError(418, "").code).toBe("unknown");
  });
});
