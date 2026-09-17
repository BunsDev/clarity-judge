import type { Axis } from "@/types/axis";
import type { Settings } from "@/types/results";
import { BUILT_IN_AXIS_IDS } from "./builtInAxes";
import { DEFAULT_THRESHOLD } from "./results";

/**
 * Tiny localStorage wrapper for custom axes and settings.
 * Every function is safe to call during server rendering (returns defaults)
 * and never throws — a corrupt value just resets to the default.
 */

const CUSTOM_AXES_KEY = "clarity-judge:custom-axes";
const SETTINGS_KEY = "clarity-judge:settings";
const API_KEY_KEY = "clarity-judge:api-key";

/** Fired on window whenever the browser key is saved or removed, so every component can resync. */
export const API_KEY_EVENT = "clarity-judge:api-key-change";

function announceKeyChange(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(API_KEY_EVENT));
  } catch {
    // ignore
  }
}

export const DEFAULT_SETTINGS: Settings = {
  threshold: DEFAULT_THRESHOLD,
  selectedAxisIds: [...BUILT_IN_AXIS_IDS],
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode). Losing persistence is fine.
  }
}

export function loadCustomAxes(): Axis[] {
  const axes = readJson<Axis[]>(CUSTOM_AXES_KEY);
  return Array.isArray(axes) ? axes.filter((a) => a && typeof a.id === "string") : [];
}

export function saveCustomAxes(axes: Axis[]): void {
  writeJson(CUSTOM_AXES_KEY, axes);
}

export function loadSettings(): Settings {
  const stored = readJson<Partial<Settings>>(SETTINGS_KEY);
  const threshold =
    typeof stored?.threshold === "number" && stored.threshold >= 0 && stored.threshold <= 1
      ? stored.threshold
      : DEFAULT_SETTINGS.threshold;
  const selectedAxisIds = Array.isArray(stored?.selectedAxisIds)
    ? stored.selectedAxisIds.filter((id): id is string => typeof id === "string")
    : DEFAULT_SETTINGS.selectedAxisIds;
  return { threshold, selectedAxisIds };
}

export function saveSettings(settings: Settings): void {
  writeJson(SETTINGS_KEY, settings);
}

/**
 * The user's own TypeSafe key, if they saved one in the UI. Kept in
 * localStorage so it persists across reloads; never rendered by any component.
 */
export function loadApiKey(): string | null {
  const key = readJson<string>(API_KEY_KEY);
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

export function saveApiKey(key: string): void {
  writeJson(API_KEY_KEY, key.trim());
  announceKeyChange();
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(API_KEY_KEY);
  } catch {
    // ignore
  }
  announceKeyChange();
}
