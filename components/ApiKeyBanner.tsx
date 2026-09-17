"use client";

import { useState } from "react";
import type { DeployTarget } from "@/lib/env";
import { looksLikeTypeSafeKey } from "@/lib/redact";
import { ApiKeySetupGuide } from "./ApiKeySetupGuide";
import { CheckIcon } from "./icons";

export const API_KEY_INPUT_ID = "api-key-input";

type Props = {
  /** True when the server found TYPESAFE_API_KEY in its environment. */
  serverHasKey: boolean;
  deployTarget: DeployTarget;
  /** True when a key is saved in this browser's localStorage. */
  hasBrowserKey: boolean;
  /** False until localStorage has been read; the banner stays neutral until then. */
  hydrated: boolean;
  onSave: (key: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

/**
 * Full-width strip under the header. It's the first thing on the page because
 * without a key nothing else is real.
 *
 * - No key anywhere → pink "demo" state with the input right in the banner.
 * - Key present → slim teal state saying where the key comes from, with
 *   "Replace" / "Remove" that reveal the same input.
 *
 * The input is a password field and the key is never shown after saving.
 */
export function ApiKeyBanner({ serverHasKey, deployTarget, hasBrowserKey, hydrated, onSave, onClear, disabled }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const hasKey = hasBrowserKey || serverHasKey;
  const showForm = hydrated && (!hasKey || editing);
  const serverPlace = deployTarget === "local" ? ".env.local" : deployTarget === "vercel" ? "the Vercel environment" : "the server environment";

  function save() {
    const value = draft.trim();
    if (value.length < 16) return setError("Paste the full key. It's much longer than that.");
    if (!looksLikeTypeSafeKey(value)) return setError("That doesn't look like a TypeSafe key. They start with apikey_. Check for extra characters.");
    onSave(value);
    setDraft("");
    setError(null);
    setEditing(false);
    setJustSaved(true);
  }

  const tone = !hydrated ? "border-line" : hasKey ? "border-teal/60 bg-teal/5" : "border-pink bg-pink/10";

  return (
    <section aria-label="API key" className={`border-b ${tone}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        {/* Status */}
        <div className="flex min-w-0 items-center gap-3">
          <span className={`chip ${!hydrated ? "" : hasKey ? "!bg-teal !text-[#1e1e1e]" : "!bg-pink !text-[#1e1e1e]"}`}>
            {!hydrated ? "Key" : hasKey ? "Live" : "Demo mode"}
          </span>
          <p className="text-sm text-ink-2">
            {!hydrated
              ? "Checking for an API key…"
              : hasBrowserKey
                ? "Using the key saved in this browser."
                : serverHasKey
                  ? `Using the key from ${serverPlace}.`
                  : "No API key set. Results are simulated. Paste a TypeSafe key to get real judgments from Jev."}
            {justSaved && hasBrowserKey && (
              <span className="ml-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-teal">
                <CheckIcon className="h-3 w-3" /> Saved, hidden from now on
              </span>
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {hydrated && hasKey && !editing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={disabled}
                className="press border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 hover:border-ink hover:text-ink disabled:opacity-50"
              >
                {hasBrowserKey ? "Replace key" : "Use my own key"}
              </button>
              {hasBrowserKey && (
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setJustSaved(false);
                  }}
                  disabled={disabled}
                  className="press border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-pink hover:border-pink disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </>
          )}
          {!serverHasKey && hydrated && !editing && !hasBrowserKey && (
            <details className="relative">
              <summary className="cursor-pointer select-none list-none border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 hover:border-ink hover:text-ink">
                Set it on the server instead
              </summary>
              <div className="absolute right-0 z-30 mt-1 w-[min(28rem,90vw)] bg-panel shadow-[3px_3px_0_0_var(--shadow)]">
                <ApiKeySetupGuide deployTarget={deployTarget} />
              </div>
            </details>
          )}
        </div>

        {/* Inline form */}
        {showForm && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            className="flex w-full flex-wrap items-start gap-2"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <input
                id={API_KEY_INPUT_ID}
                type="password"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError(null);
                }}
                disabled={disabled}
                autoComplete="off"
                spellCheck={false}
                placeholder="apikey_…  (stays in this browser, never displayed)"
                aria-label="TypeSafe API key"
                className="w-full border border-line bg-bg px-2.5 py-1.5 font-mono text-sm text-ink outline-none transition-[border-color] duration-150 placeholder:text-muted focus:border-ink disabled:opacity-50"
              />
              {error && <p className="text-xs text-pink">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={disabled || draft.trim().length === 0}
              className="press bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bg hover:bg-pink hover:text-[#1e1e1e] disabled:opacity-40"
            >
              Save key
            </button>
            {hasKey && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft("");
                  setError(null);
                }}
                className="press border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 hover:border-ink"
              >
                Cancel
              </button>
            )}
            <p className="w-full font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Sent only to this app&apos;s own /api/judge route. A browser key overrides the server key. Get one at typesafe.ai.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
