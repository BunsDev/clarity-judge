import { describe, expect, it } from "vitest";
import { pickEvidence, splitSentences } from "./evidenceHeuristic";
import { BUILT_IN_AXES } from "./builtInAxes";
import { SAMPLE_TEXT } from "./sampleText";

const axis = (id: string) => BUILT_IN_AXES.find((a) => a.id === id)!;

describe("splitSentences", () => {
  it("splits on sentence punctuation and blank lines", () => {
    expect(splitSentences("One. Two! Three?\n\nFour")).toEqual(["One.", "Two!", "Three?", "Four"]);
  });
  it("returns an empty array for blank input", () => {
    expect(splitSentences("   \n ")).toEqual([]);
  });
});

describe("pickEvidence", () => {
  it("returns null for empty text", () => {
    expect(pickEvidence("", axis("hedging"))).toBeNull();
  });

  it("picks the sentence with the most em dashes for the em dash axis", () => {
    const text = "Plain sentence. This one — with a dash — and another — has three. Also plain.";
    expect(pickEvidence(text, axis("em_dashes"))?.snippet).toBe("This one — with a dash — and another — has three.");
  });

  it("picks the hedgiest sentence for the hedging axis", () => {
    const text = "We will ship on Monday. I think we might perhaps sort of maybe ship. Done.";
    expect(pickEvidence(text, axis("hedging"))?.snippet).toBe("I think we might perhaps sort of maybe ship.");
  });

  it("finds 'mistakes were made' for passive voice in the sample text", () => {
    expect(pickEvidence(SAMPLE_TEXT, axis("passive_voice"))?.snippet).toContain("mistakes were made");
  });

  it("falls back to the first sentence when nothing matches, and is labelled approximate", () => {
    const result = pickEvidence("Alpha beta. Gamma delta.", { ...axis("clarity"), evidenceHint: undefined, question: "zzz" });
    expect(result).toEqual({ snippet: "Alpha beta.", approximate: true });
  });

  it("ignores an invalid regex in a custom axis instead of throwing", () => {
    const custom = { ...axis("hedging"), evidenceHint: { pattern: "(" } };
    expect(() => pickEvidence("Some text.", custom)).not.toThrow();
  });
});
