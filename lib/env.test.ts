import { afterEach, describe, expect, it, vi } from "vitest";
import { getDeployTarget } from "./env";

describe("getDeployTarget", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is local during development", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getDeployTarget()).toBe("local");
  });

  it("is vercel when Vercel's env markers are present", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(getDeployTarget()).toBe("vercel");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(getDeployTarget()).toBe("vercel");
  });

  it("is hosted for any other production environment", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(getDeployTarget()).toBe("hosted");
  });
});
