import { describe, expect, it } from "vitest";
import { mockCallJev } from "./mockJevClient";
import type { JevRequest } from "@/types/jev";

const request: JevRequest = {
  context: "Some text to judge.",
  questions: [
    { type: "noul", id: "q1", question: "Is it hedgy?" },
    { type: "choice", id: "q2", question: "Tone?", options: ["formal", "casual", "mixed"] },
  ],
};

describe("mockCallJev", () => {
  it("returns one well-formed answer per question", async () => {
    const answers = await mockCallJev(request, { delayMs: 0 });
    expect(answers.map((a) => a.id)).toEqual(["q1", "q2"]);

    const [noul, choice] = answers;
    expect(typeof noul.value).toBe("boolean");
    expect(noul.probability).toBeGreaterThanOrEqual(0);
    expect(noul.probability).toBeLessThanOrEqual(1);
    expect(noul.confidence).toBeGreaterThanOrEqual(0.5);

    expect(["formal", "casual", "mixed"]).toContain(choice.value);
    const total = Object.values(choice.optionProbabilities!).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 1);
    expect(choice.confidence).toBe(choice.optionProbabilities![choice.value as string]);
  });

  it("is deterministic for the same text and question", async () => {
    const a = await mockCallJev(request, { delayMs: 0 });
    const b = await mockCallJev(request, { delayMs: 0 });
    expect(a).toEqual(b);
  });

  it("leans toward yes when asked to", async () => {
    const [yes] = await mockCallJev(request, { delayMs: 0, lean: { q1: 0.95 } });
    const [no] = await mockCallJev(request, { delayMs: 0, lean: { q1: 0.05 } });
    expect(yes.probability!).toBeGreaterThan(no.probability!);
  });
});
