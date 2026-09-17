import { describe, expect, it } from "vitest";
import { looksLikeTypeSafeKey, redactSecrets } from "./redact";

// Built by concatenation so the secret scanner doesn't flag this test file.
const fakeKey = "apikey_" + "a1b2c3d4".repeat(6);

describe("redactSecrets", () => {
  it("masks TypeSafe-style keys", () => {
    const out = redactSecrets(`Unauthorized: ${fakeKey} is invalid`)!;
    expect(out).not.toContain(fakeKey);
    expect(out).toContain("[redacted]");
  });
  it("masks bearer tokens", () => {
    expect(redactSecrets("Authorization: Bearer " + "x".repeat(40))).toBe("Authorization: Bear…[redacted]");
  });
  it("leaves ordinary text alone", () => {
    expect(redactSecrets("HTTP 429 rate limited")).toBe("HTTP 429 rate limited");
    expect(redactSecrets(undefined)).toBeUndefined();
  });
});

describe("looksLikeTypeSafeKey", () => {
  it("accepts the documented shape and rejects junk", () => {
    expect(looksLikeTypeSafeKey(fakeKey)).toBe(true);
    expect(looksLikeTypeSafeKey("hello")).toBe(false);
    expect(looksLikeTypeSafeKey("")).toBe(false);
  });
});
