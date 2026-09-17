import { describe, expect, it } from "vitest";
import { explainError } from "./errors";

describe("explainError", () => {
  it("explains billing errors with a credits link and retry", () => {
    const e = explainError({ error: "x", code: "billing", status: 402 });
    expect(e.title).toMatch(/no credits/);
    expect(e.actions.map((a) => a.kind)).toEqual(["link", "retry"]);
    expect(e.actions[0].href).toContain("console.typesafe.ai");
  });

  it("offers to change the key on auth errors", () => {
    const e = explainError({ error: "x", code: "auth", status: 401 });
    expect(e.actions.some((a) => a.kind === "change-key")).toBe(true);
  });

  it("passes validation messages through verbatim with no retry", () => {
    const e = explainError({ error: "Switch on at least one check.", code: "validation" });
    expect(e.detail).toBe("Switch on at least one check.");
    expect(e.actions).toEqual([]);
  });

  it("falls back sensibly for unknown codes", () => {
    const e = explainError({ error: "HTTP 418", code: "unknown", status: 418 });
    expect(e.title).toBe("Something went wrong");
    expect(e.detail).toBe("HTTP 418");
  });
});
