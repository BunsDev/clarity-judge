import { afterEach, describe, expect, it, vi } from "vitest";
import { POST, validateRequest } from "./route";

function post(body: unknown): Promise<Response> {
  return POST(new Request("http://localhost/api/judge", { method: "POST", body: JSON.stringify(body) }));
}

describe("validateRequest", () => {
  it("accepts a well-formed request", () => {
    expect(validateRequest({ context: "hi", questions: [{ type: "noul", id: "a", question: "q" }] })).toBeNull();
  });
  it("rejects missing text and bad question types", () => {
    expect(validateRequest({ context: "", questions: [] })).toMatch(/context/);
    expect(validateRequest({ context: "x", questions: [{ type: "score", id: "a", question: "q" }] })).toMatch(/Unknown question type/);
    expect(validateRequest({ context: "x", questions: [{ type: "choice", id: "a", question: "q", options: ["one"] }] })).toMatch(/two options/);
  });
});

describe("POST /api/judge", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns 400 with a JevErrorPayload for invalid bodies", async () => {
    const response = await post({ context: "" });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "validation" });
  });

  it("falls back to the mock when no API key is set", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "");
    const response = await post({ context: "Some text.", questions: [{ type: "noul", id: "a", question: "q" }] });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.demo).toBe(true);
    expect(body.answers).toHaveLength(1);
  });

  it("uses a browser-supplied key header over the server key and never echoes it back", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "server-key");
    const browserKey = "apikey_" + "b".repeat(40);
    const fetchMock = vi.fn(async () => new Response(`bad key ${browserKey}`, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(
      new Request("http://localhost/api/judge", {
        method: "POST",
        headers: { "x-typesafe-api-key": browserKey },
        body: JSON.stringify({ context: "Some text.", questions: [{ type: "noul", id: "a", question: "q" }] }),
      }),
    );
    const sent = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((sent[1].headers as Record<string, string>).Authorization).toBe(`Bearer ${browserKey}`);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("auth");
    expect(JSON.stringify(body)).not.toContain(browserKey);
    expect(body.raw).toContain("[redacted]");
    vi.unstubAllGlobals();
  });

  it("surfaces a 429 from TypeSafe with the rate-limit message", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("rate limited", { status: 429 })));
    const response = await post({ context: "Some text.", questions: [{ type: "noul", id: "a", question: "q" }] });
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      code: "rate_limited",
      error: "You've hit the API rate limit, try again in a moment.",
      raw: "rate limited",
    });
    vi.unstubAllGlobals();
  });
});
