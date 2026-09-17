import type { JevAnswer, JevRequest } from "@/types/jev";

/**
 * Demo-mode stand-in for the real Jev API.
 *
 * Returns plausible-looking answers without any network call. Results are
 * seeded from the text + question id, so running the same text twice gives the
 * same answers (which feels more like a real model than pure randomness).
 *
 * Optional `lean` values (0–1, keyed by question id) nudge yes/no answers toward
 * "yes" — `lib/judge.ts` passes a lean based on how many of an axis's keywords
 * appear in the text, so the sample paragraph produces sensible demo results.
 */

export type MockOptions = {
  lean?: Record<string, number>;
  /** Fake latency in ms so the loading state is visible. Default ~150ms. */
  delayMs?: number;
};

/** Tiny string hash (FNV-1a) → 32-bit integer. */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Seeded pseudo-random generator (mulberry32). Returns numbers in [0, 1). */
function makeRng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export async function mockCallJev(request: JevRequest, options: MockOptions = {}): Promise<JevAnswer[]> {
  const delay = options.delayMs ?? 120 + Math.floor(Math.random() * 80);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

  return request.questions.map((question) => {
    const rng = makeRng(hashString(`${question.id}::${request.context}`));

    if (question.type === "noul") {
      // Start from the lean (0.5 = no opinion), then add noise so results vary.
      const lean = options.lean?.[question.id] ?? 0.5;
      const noise = (rng() - 0.5) * 0.5; // ±0.25
      const probability = clamp01(0.5 + (lean - 0.5) * 1.2 + noise);
      const rounded = Math.round(probability * 100) / 100;
      return {
        id: question.id,
        type: "noul",
        value: rounded >= 0.5,
        probability: rounded,
        confidence: Math.max(rounded, 1 - rounded),
        needsReview: false,
      };
    }

    // Choice: pick a winner, give it most of the probability mass, spread the rest.
    const choiceOptions = question.options;
    const winnerIndex = Math.floor(rng() * choiceOptions.length);
    const winnerShare = 0.45 + rng() * 0.5; // 0.45–0.95
    const optionProbabilities: Record<string, number> = {};
    let remaining = 1 - winnerShare;
    choiceOptions.forEach((option, index) => {
      if (index === winnerIndex) {
        optionProbabilities[option] = winnerShare;
      } else {
        const isLast =
          index === choiceOptions.length - 1 ||
          (index === choiceOptions.length - 2 && winnerIndex === choiceOptions.length - 1);
        const share = isLast ? remaining : remaining * rng();
        optionProbabilities[option] = share;
        remaining -= share;
      }
    });
    for (const key of Object.keys(optionProbabilities)) {
      optionProbabilities[key] = Math.round(optionProbabilities[key] * 100) / 100;
    }
    const winner = choiceOptions[winnerIndex];
    return {
      id: question.id,
      type: "choice",
      value: winner,
      optionProbabilities,
      confidence: optionProbabilities[winner],
      needsReview: false,
    };
  });
}
