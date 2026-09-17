"use client";

import { createContext, useContext } from "react";
import type { DeployTarget } from "@/lib/env";
import type { Telemetry } from "@/types/results";

export type ShellState = {
  /** True when the server found TYPESAFE_API_KEY. Never the key itself. */
  serverHasKey: boolean;
  deployTarget: DeployTarget;
  /** The key saved in this browser, if any. A browser key overrides the server key. */
  apiKey: string | null;
  /** True until localStorage has been read on the client. */
  hydrated: boolean;
  demoMode: boolean;
  saveKey: (key: string) => void;
  clearKey: () => void;
  openKeyDialog: () => void;
  /** Facts about the last run, shown in the topbar. */
  telemetry: Telemetry | null;
  setTelemetry: (telemetry: Telemetry | null) => void;
  running: boolean;
  setRunning: (running: boolean) => void;
  /** ⌘K palette, opened from the topbar button or the keyboard. */
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  /** "⌘" on Apple platforms, "Ctrl" elsewhere, for shortcut hints. */
  modKey: string;
};

export const ShellContext = createContext<ShellState | null>(null);

export function useShell(): ShellState {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside <Shell>.");
  return value;
}
