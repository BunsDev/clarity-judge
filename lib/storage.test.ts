import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  clearApiKey,
  loadApiKey,
  loadCustomAxes,
  loadSettings,
  saveApiKey,
  saveCustomAxes,
  saveSettings,
} from "./storage";
import { BUILT_IN_AXIS_IDS } from "./builtInAxes";
import type { Axis } from "@/types/axis";

/** Minimal in-memory localStorage so these tests run in the node environment. */
function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    _store: store,
  };
}

const customAxis: Axis = {
  id: "custom-abc",
  kind: "yes_no",
  builtIn: false,
  name: "On brand",
  description: "Sounds like us.",
  question: "Does this sound like our brand voice?",
  issueWhen: false,
};

describe("storage without a window (server render)", () => {
  it("returns defaults and never throws", () => {
    expect(typeof window).toBe("undefined");
    expect(loadCustomAxes()).toEqual([]);
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(loadApiKey()).toBeNull();
    expect(() => saveCustomAxes([customAxis])).not.toThrow();
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
    expect(() => saveApiKey("apikey_x")).not.toThrow();
    expect(() => clearApiKey()).not.toThrow();
  });
});

describe("storage in the browser", () => {
  let localStorage: ReturnType<typeof fakeLocalStorage>;

  beforeEach(() => {
    localStorage = fakeLocalStorage();
    vi.stubGlobal("window", { localStorage });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("defaults select every built-in axis at the default threshold", () => {
    expect(DEFAULT_SETTINGS.selectedAxisIds).toEqual(BUILT_IN_AXIS_IDS);
    expect(DEFAULT_SETTINGS.threshold).toBe(0.7);
  });

  it("round-trips custom axes", () => {
    saveCustomAxes([customAxis]);
    expect(loadCustomAxes()).toEqual([customAxis]);
  });

  it("drops corrupt or malformed custom axes instead of throwing", () => {
    localStorage.setItem("clarity-judge:custom-axes", "{not json");
    expect(loadCustomAxes()).toEqual([]);

    localStorage.setItem("clarity-judge:custom-axes", JSON.stringify([customAxis, null, { name: "no id" }, 42]));
    expect(loadCustomAxes()).toEqual([customAxis]);

    localStorage.setItem("clarity-judge:custom-axes", JSON.stringify({ not: "an array" }));
    expect(loadCustomAxes()).toEqual([]);
  });

  it("round-trips settings", () => {
    saveSettings({ threshold: 0.85, selectedAxisIds: ["hedging", "custom-abc"] });
    expect(loadSettings()).toEqual({ threshold: 0.85, selectedAxisIds: ["hedging", "custom-abc"] });
  });

  it("falls back per field when settings are out of range or the wrong shape", () => {
    localStorage.setItem("clarity-judge:settings", JSON.stringify({ threshold: 7, selectedAxisIds: ["hedging", 3, null] }));
    expect(loadSettings()).toEqual({ threshold: DEFAULT_SETTINGS.threshold, selectedAxisIds: ["hedging"] });

    localStorage.setItem("clarity-judge:settings", JSON.stringify({ threshold: 0.6, selectedAxisIds: "hedging" }));
    expect(loadSettings()).toEqual({ threshold: 0.6, selectedAxisIds: DEFAULT_SETTINGS.selectedAxisIds });
  });

  it("stores the API key trimmed and clears it cleanly", () => {
    saveApiKey("  apikey_abc  ");
    expect(loadApiKey()).toBe("apikey_abc");
    clearApiKey();
    expect(loadApiKey()).toBeNull();
    expect(localStorage._store.has("clarity-judge:api-key")).toBe(false);
  });

  it("treats a blank or non-string stored key as no key", () => {
    localStorage.setItem("clarity-judge:api-key", JSON.stringify("   "));
    expect(loadApiKey()).toBeNull();
    localStorage.setItem("clarity-judge:api-key", JSON.stringify({ key: "apikey_abc" }));
    expect(loadApiKey()).toBeNull();
  });

  it("swallows storage errors (private mode, quota) instead of throwing", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => { throw new Error("blocked"); },
        setItem: () => { throw new Error("quota"); },
        removeItem: () => { throw new Error("blocked"); },
      },
    });
    expect(() => saveApiKey("apikey_abc")).not.toThrow();
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
    expect(() => clearApiKey()).not.toThrow();
    expect(loadApiKey()).toBeNull();
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
