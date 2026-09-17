"use client";

import { useState } from "react";
import { looksLikeTypeSafeKey } from "@/lib/redact";
import { ApiKeySetupGuide } from "./ApiKeySetupGuide";
import { CheckIcon } from "./icons";

type Props = {
  /** True when the server found TYPESAFE_API_KEY in .env.local. */
  serverHasKey: boolean;
  /** True when a key is saved in this browser's localStorage. */
  hasBrowserKey: boolean;
  onSave: (key: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

/**
 * Lets the user add an API key without ever displaying it.
 *
 * - The input is a password field, so the key is dots while typing.
 * - After saving, the field is cleared and the key is never rendered again —
 *   only a "saved" status. There is deliberately no "show key" toggle.
 * - The key lives in localStorage and goes to this app's own /api/judge route
 *   in a request header. A browser key takes precedence over the server key.
 */
export function ApiKeySettings({ serverHasKey, hasBrowserKey, onSave, onClear, disabled }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  function save() {
    const value = draft.trim();
    if (value.length < 16) return setError("Paste the full key. It's much longer than that.");
    if (!looksLikeTypeSafeKey(value)) return setError("That doesn't look like a TypeSafe key (they start with apikey_). Check for extra characters.");
    onSave(value);
    setDraft("");
    setError(null);
    setJustSaved(true);
  }

  return (
    <div className="space-y-3 text-sm">
      {hasBrowserKey ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs tracking-[0.3em] text-muted" aria-label="Key is hidden">
            ••••••••••••
          </span>
          <button
            type="button"
            onClick={() => {
              onClear();
              setJustSaved(false);
            }}
            disabled={disabled}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-pink hover:underline disabled:opacity-50"
          >
            Remove from this browser
          </button>
        </div>
      ) : (
        <p className="text-ink-2">
          {serverHasKey
            ? "Using the key from .env.local. You can also save one in this browser; it will take precedence."
            : "No key yet. Paste one here or set it in .env.local. Until then, results are simulated."}
        </p>
      )}

      {justSaved && hasBrowserKey && (
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-teal">
          <CheckIcon className="h-3.5 w-3.5" /> Saved. It won&apos;t be shown again.
        </p>
      )}

      <details>
        <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 hover:text-ink">
          {hasBrowserKey ? "Replace key" : "Add a key in the browser"}
        </summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="mt-2 space-y-2"
        >
          <div className="flex gap-2">
            <input
              type="password"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
              placeholder="apikey_…"
              aria-label="TypeSafe API key"
              className="min-w-0 flex-1 border border-line bg-bg px-2.5 py-1.5 font-mono text-sm text-ink outline-none transition focus:border-ink disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={disabled || draft.trim().length === 0}
              className="bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition hover:bg-pink hover:text-[#1e1e1e] disabled:opacity-40"
            >
              Save
            </button>
          </div>
          {error && <p className="text-xs text-pink">{error}</p>}
          <p className="font-mono text-[11px] leading-relaxed text-muted">
            Stored only in this browser and sent to this app&apos;s own /api/judge route. Never displayed after saving.
            Anyone using this browser profile could read it, so on shared machines prefer .env.local.
          </p>
        </form>
      </details>

      {!serverHasKey && <ApiKeySetupGuide />}
    </div>
  );
}
