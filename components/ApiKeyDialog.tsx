"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { looksLikeTypeSafeKey } from "@/lib/redact";
import { useShell } from "./ShellContext";

type Props = { open: boolean; onClose: () => void };

/**
 * The only place a key is ever typed. It's a password field, it's never shown
 * again after saving, and the saved value is never rendered anywhere.
 */
export function ApiKeyDialog({ open, onClose }: Props) {
  const { serverHasKey, deployTarget, apiKey, saveKey, clearKey } = useShell();
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  function close() {
    setDraft("");
    setError("");
    setJustSaved(false);
    onClose();
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (value.length < 16) return setError("Paste the full key. It's much longer than that.");
    if (!looksLikeTypeSafeKey(value)) return setError("That doesn't look like a TypeSafe key. They start with apikey_. Check for extra characters.");
    saveKey(value);
    setDraft("");
    setError("");
    setJustSaved(true);
  }

  const serverPlace = deployTarget === "local" ? ".env.local" : deployTarget === "vercel" ? "the Vercel environment" : "the server environment";
  const status = apiKey
    ? "A personal key is saved in this browser. It overrides the server key for every run."
    : serverHasKey
      ? `Runs use the key from ${serverPlace}. Save your own key here to override it in this browser.`
      : "No key anywhere yet, so results are simulated. Paste a TypeSafe key to get real verdicts from Jev.";

  return (
    <dialog
      ref={dialog}
      className="app-dialog"
      aria-labelledby="api-key-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <div className="dialog-head">
        <div>
          <span className="eyebrow">Credentials</span>
          <h2 id="api-key-title">Your TypeSafe API key</h2>
        </div>
        <button type="button" className="icon-button" aria-label="Close API key settings" onClick={close}>
          <X size={18} />
        </button>
      </div>
      <div className="dialog-body">
        <p>{status}</p>
        {justSaved && (
          <p className="notice" role="status">
            Saved. The key is hidden from now on and stays in this browser only.
          </p>
        )}
        <form onSubmit={submit}>
          <label htmlFor="personal-api-key">{apiKey ? "Replace the saved key" : "API key"}</label>
          <input
            id="personal-api-key"
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={draft}
            placeholder={apiKey ? "Enter a replacement key" : "apikey_…"}
            onChange={(event) => {
              setDraft(event.target.value);
              setError("");
            }}
          />
          <span className="field-hint">
            Stays in this browser until removed or site data is cleared. Masked on screen, sent only to this app&apos;s own /api/judge route, and never
            displayed again. Get one at{" "}
            <a href="https://typesafe.ai" target="_blank" rel="noreferrer">
              typesafe.ai
            </a>
            .
          </span>
          {error && (
            <p className="field-hint" role="alert" style={{ color: "var(--error)" }}>
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button className="button primary" type="submit" disabled={!draft.trim()}>
              Save key
            </button>
            {apiKey && (
              <button
                className="button"
                type="button"
                onClick={() => {
                  clearKey();
                  setJustSaved(false);
                }}
              >
                Remove from this browser
              </button>
            )}
          </div>
        </form>

        {!serverHasKey && (
          <details className="disclosure">
            <summary>
              <ChevronDown size={14} className="marker" />
              Set it on the server instead
            </summary>
            <ServerSetup deployTarget={deployTarget} />
          </details>
        )}
      </div>
    </dialog>
  );
}

function ServerSetup({ deployTarget }: { deployTarget: "local" | "vercel" | "hosted" }) {
  return (
    <div className="prose">
      {deployTarget === "local" && (
        <ol>
          <li>
            Copy the example env file:
            <pre>cp .env.local.example .env.local</pre>
          </li>
          <li>
            Open <code>.env.local</code> and paste your key:
            <pre>TYPESAFE_API_KEY=your_key_here</pre>
          </li>
          <li>
            Restart the dev server with <code>pnpm dev</code>.
          </li>
        </ol>
      )}
      {deployTarget === "vercel" && (
        <ol>
          <li>
            In the Vercel dashboard open this project, then Settings → Environment Variables, and add <code>TYPESAFE_API_KEY</code> for Production.
            Or from the repo:
            <pre>vercel env add TYPESAFE_API_KEY production</pre>
          </li>
          <li>
            Redeploy so the variable is picked up:
            <pre>vercel --prod</pre>
          </li>
        </ol>
      )}
      {deployTarget === "hosted" && (
        <ol>
          <li>
            Set <code>TYPESAFE_API_KEY</code> in your host&apos;s environment settings.
          </li>
          <li>Restart or redeploy the app so it picks up the variable.</li>
        </ol>
      )}
      {deployTarget !== "local" && (
        <p className="notice" style={{ marginTop: 12 }}>
          A server key is shared by everyone who can open this URL, and every run spends its credits. For a public demo, leave it unset and let each
          visitor paste their own key.
        </p>
      )}
      <p style={{ marginTop: 10 }}>The key stays on the server. The browser only talks to this app&apos;s own /api/judge route.</p>
    </div>
  );
}
