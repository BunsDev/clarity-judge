"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Axis } from "@/types/axis";
import type { JevErrorPayload } from "@/types/jev";
import { JevApiError } from "@/types/jev";
import type { AxisResult, JudgmentStatus } from "@/types/results";
import { BUILT_IN_AXES } from "@/lib/builtInAxes";
import type { DeployTarget } from "@/lib/env";
import { runJudgment } from "@/lib/judge";
import { buildSummary } from "@/lib/results";
import { SAMPLE_TEXT } from "@/lib/sampleText";
import { redactSecrets } from "@/lib/redact";
import {
  DEFAULT_SETTINGS,
  clearApiKey,
  loadApiKey,
  loadCustomAxes,
  loadSettings,
  saveApiKey,
  saveCustomAxes,
  saveSettings,
} from "@/lib/storage";
import { API_KEY_INPUT_ID, ApiKeyBanner } from "./ApiKeyBanner";
import { AxisSelector } from "./AxisSelector";
import { ResultsPanel } from "./ResultsPanel";
import { TextEditor } from "./TextEditor";
import { ThemeToggle } from "./ThemeToggle";
import { Window } from "./Window";

type Props = {
  /** Decided on the server from whether TYPESAFE_API_KEY is set. Never the key itself. */
  serverHasKey: boolean;
  /** Where the app is running, so key-setup instructions match the environment. */
  deployTarget: DeployTarget;
};

/**
 * The whole app's state lives here. Child components are presentational and
 * receive callbacks. Flow: 01 text → 02 checks → run → 03 results.
 */
export function ClarityJudgeApp({ serverHasKey, deployTarget }: Props) {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [customAxes, setCustomAxes] = useState<Axis[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(DEFAULT_SETTINGS.selectedAxisIds));
  const [threshold, setThreshold] = useState(DEFAULT_SETTINGS.threshold);
  const [status, setStatus] = useState<JudgmentStatus>("idle");
  const [results, setResults] = useState<AxisResult[]>([]);
  const [error, setError] = useState<JevErrorPayload | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [runId, setRunId] = useState(0);
  const autoRan = useRef(false);

  // Load saved custom axes, settings and key once the component is on screen.
  // localStorage only exists in the browser, and the server-rendered HTML must
  // match the first client render, so this has to happen in an effect after
  // mount rather than in the initial state. That's exactly the case the lint
  // rule below warns about, so we opt out here on purpose.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomAxes(loadCustomAxes());
    setApiKey(loadApiKey());
    const settings = loadSettings();
    setThreshold(settings.threshold);
    setSelectedIds(new Set(settings.selectedAxisIds));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCustomAxes(customAxes);
  }, [customAxes, hydrated]);
  useEffect(() => {
    if (hydrated) saveSettings({ threshold, selectedAxisIds: [...selectedIds] });
  }, [threshold, selectedIds, hydrated]);

  // Demo mode only when there's no key anywhere. A browser key beats the server key.
  const demoMode = !serverHasKey && !apiKey;

  const allAxes = useMemo(() => [...BUILT_IN_AXES, ...customAxes], [customAxes]);
  const selectedAxes = useMemo(() => allAxes.filter((axis) => selectedIds.has(axis.id)), [allAxes, selectedIds]);

  const run = useCallback(async () => {
    if (!text.trim()) {
      setError({ error: "Add some text to judge first.", code: "validation" });
      setStatus("error");
      return;
    }
    if (selectedAxes.length === 0) {
      setError({ error: "Switch on at least one check.", code: "validation" });
      setStatus("error");
      return;
    }

    setStatus("running");
    setError(null);
    try {
      const next = await runJudgment(text, selectedAxes, { demoMode, apiKey: apiKey ?? undefined, jevEvidence: true });
      setResults(next);
      setRunId((id) => id + 1);
      setStatus("done");
    } catch (caught) {
      const payload: JevErrorPayload =
        caught instanceof JevApiError
          ? { error: caught.message, code: caught.code, status: caught.status, raw: caught.raw }
          : { error: "Something went wrong.", code: "unknown", raw: caught instanceof Error ? caught.message : String(caught) };
      // Belt and braces: never let a key reach the screen via an error message.
      setError({ ...payload, error: redactSecrets(payload.error) ?? payload.error, raw: redactSecrets(payload.raw) });
      setStatus("error");
    }
  }, [text, selectedAxes, demoMode, apiKey]);

  // In demo mode, run once automatically so the results UI is populated on first load.
  // In live mode we don't spend the user's API quota without a click.
  useEffect(() => {
    if (hydrated && demoMode && !autoRan.current) {
      autoRan.current = true;
      void run();
    }
  }, [hydrated, demoMode, run]);

  const summary = useMemo(() => (results.length ? buildSummary(results, threshold) : null), [results, threshold]);
  const running = status === "running";

  function toggleAxis(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(select: boolean) {
    setSelectedIds(select ? new Set(allAxes.map((a) => a.id)) : new Set());
  }

  function addCustomAxis(axis: Axis) {
    setCustomAxes((prev) => [...prev, axis]);
    setSelectedIds((prev) => new Set(prev).add(axis.id));
  }

  function handleSaveApiKey(key: string) {
    saveApiKey(key);
    setApiKey(key);
  }

  function handleClearApiKey() {
    clearApiKey();
    setApiKey(null);
  }

  /** Scroll to the key banner and focus its input (used by the auth-error action). */
  function focusKeyInput() {
    if (!apiKey && !serverHasKey) {
      document.getElementById(API_KEY_INPUT_ID)?.focus();
      return;
    }
    // A key exists, so the input is hidden until "Replace key" is pressed; do that for the user.
    const button = Array.from(document.querySelectorAll("button")).find((b) => /replace key|use my own key/i.test(b.textContent ?? ""));
    button?.click();
    requestAnimationFrame(() => document.getElementById(API_KEY_INPUT_ID)?.focus());
  }

  function removeCustomAxis(id: string) {
    setCustomAxes((prev) => prev.filter((a) => a.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setResults((prev) => prev.filter((r) => r.axis.id !== id));
  }

  const modeLabel = !hydrated ? "" : demoMode ? "Demo" : apiKey ? "Live · browser key" : "Live · server key";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-3.5 w-3.5 items-center justify-center border border-ink" aria-hidden>
            <span className="h-1.5 w-1.5 bg-pink" />
          </span>
          <h1 className="text-[15px] font-semibold tracking-tight text-ink">Clarity Judge</h1>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:inline">Judged by TypeSafe Jev</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Reserve the badge's space before hydration so the header doesn't shift. */}
          <span
            className={`flex h-7 items-center border px-2 font-mono text-[11px] uppercase tracking-[0.14em] ${
              !hydrated ? "invisible border-line" : demoMode ? "border-pink text-pink" : "border-teal text-teal"
            }`}
          >
            {modeLabel || "…"}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* API key: the first thing on the page, because without one nothing else is real. */}
      <ApiKeyBanner
        serverHasKey={serverHasKey}
        deployTarget={deployTarget}
        hasBrowserKey={apiKey !== null}
        hydrated={hydrated}
        onSave={handleSaveApiKey}
        onClear={handleClearApiKey}
        disabled={running}
      />

      {/* Thesis strip */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-line px-4 py-3 sm:px-6">
        <span className="chip !bg-pink !text-[#1e1e1e]">Decisions, not scores</span>
        <p className="max-w-3xl text-sm text-ink-2">
          One vague &ldquo;is this good?&rdquo; is easy to game. Separate, named checks each get their own verdict and
          confidence, so you see exactly what to fix.
        </p>
      </div>

      {/* Workspace: 1 col → 2 cols (lg) → 3 cols (2xl) */}
      <div className="grid flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-2 2xl:grid-cols-12">
        <div className="space-y-4 2xl:contents">
          <div className="space-y-4 2xl:col-span-4">
            <Window title="01 · Text" meta={running ? "Locked" : "Editable"} bodyClassName="">
              <TextEditor value={text} onChange={setText} onLoadSample={() => setText(SAMPLE_TEXT)} onRun={() => void run()} disabled={running} />
            </Window>
          </div>

          <div className="space-y-4 2xl:col-span-3">
            <Window title="02 · Checks" meta={`${selectedAxes.length}/${allAxes.length} on`} bodyClassName="p-3">
              <AxisSelector
                builtInAxes={BUILT_IN_AXES}
                customAxes={customAxes}
                selectedIds={selectedIds}
                onToggle={toggleAxis}
                onSelectAll={selectAll}
                onAddCustom={addCustomAxis}
                onRemoveCustom={removeCustomAxis}
                disabled={running}
              />
            </Window>
            <button
              type="button"
              onClick={() => void run()}
              disabled={running}
              className="press window flex w-full items-center justify-between gap-2 border border-pink bg-pink px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-[#1e1e1e] hover:bg-magenta hover:text-[#fefefe] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{running ? "Judging…" : `Run judgment · ${selectedAxes.length} ${selectedAxes.length === 1 ? "check" : "checks"}`}</span>
              <span className="opacity-60">⌘↵</span>
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-16 lg:self-start 2xl:col-span-5">
          <Window
            title="03 · Results"
            meta={summary ? `${summary.passed}/${summary.total} passed` : status === "running" ? "Working" : "Waiting"}
            bodyClassName="lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto"
          >
            <ResultsPanel
              status={status}
              results={results}
              summary={summary}
              error={error}
              threshold={threshold}
              onThresholdChange={setThreshold}
              onRetry={() => void run()}
              onChangeKey={focusKeyInput}
              demoMode={demoMode}
              runId={runId}
            />
          </Window>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:px-6">
        <span>Clarity Judge · one request per run · every check answered in parallel</span>
        <a href="https://docs.typesafe.ai" target="_blank" rel="noreferrer" className="hover:text-pink">
          docs.typesafe.ai
        </a>
      </footer>
    </div>
  );
}
