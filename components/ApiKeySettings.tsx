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

  const status = hasBrowserKey
    ? { label: "Key saved in this browser", tone: "bg-emerald-100 text-emerald-800" }
    : serverHasKey
      ? { label: "Using server key from .env.local", tone: "bg-emerald-100 text-emerald-800" }
      : { label: "No key — demo mode", tone: "bg-amber-100 text-amber-800" };

  function save() {
    const value = draft.trim();
    if (value.length < 16) return setError("Paste the full key — it's much longer than that.");
    if (!looksLikeTypeSafeKey(value)) return setError("That doesn't look like a TypeSafe key (they start with apikey_). Check for extra characters.");
    onSave(value);
    setDraft("");
    setError(null);
    setJustSaved(true);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-800">API key</h2>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.tone}`}>{status.label}</span>
      </div>

      {hasBrowserKey ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-700">
          <span className="font-mono tracking-widest text-zinc-500" aria-label="Key is hidden">
            ••••••••••••••••
          </span>
          <button
            type="button"
            onClick={() => {
              onClear();
              setJustSaved(false);
            }}
            disabled={disabled}
            className="text-xs font-medium text-rose-700 hover:underline disabled:opacity-50"
          >
            Remove key from this browser
          </button>
        </div>
      ) : null}

      {justSaved && hasBrowserKey && (
        <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700">
          <CheckIcon className="h-3.5 w-3.5" /> Saved. The key won&apos;t be shown again.
        </p>
      )}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer select-none text-xs font-medium text-indigo-700">
          {hasBrowserKey ? "Replace key" : "Add a key in the browser"}
        </summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="mt-2 space-y-2"
        >
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
            placeholder="Paste your TypeSafe API key"
            aria-label="TypeSafe API key"
            className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-zinc-50"
          />
          {error && <p className="text-xs text-rose-700">{error}</p>}
          <button
            type="submit"
            disabled={disabled || draft.trim().length === 0}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Save key
          </button>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Stored only in this browser (localStorage) and sent to this app&apos;s own <code>/api/judge</code> route with each run.
            It is never displayed after saving. Anyone using this browser profile could read it, so on shared machines prefer{" "}
            <code>.env.local</code> below.
            {serverHasKey && " A browser key overrides the server key."}
          </p>
        </form>
      </details>

      {!serverHasKey && (
        <div className="mt-3">
          <ApiKeySetupGuide />
        </div>
      )}
    </section>
  );
}
