"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Axis } from "@/types/axis";
import type { JevErrorPayload } from "@/types/jev";
import { JevApiError } from "@/types/jev";
import type { AxisResult, JudgmentStatus, Telemetry } from "@/types/results";
import { BUILT_IN_AXES } from "@/lib/builtInAxes";
import type { DeployTarget } from "@/lib/env";
import { runJudgmentDetailed } from "@/lib/judge";
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
import { CommandPalette, type Command } from "./CommandPalette";
import { StatusReadout } from "./StatusReadout";
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
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
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
      const { results: next, telemetry: stats } = await runJudgmentDetailed(text, selectedAxes, {
        demoMode,
        apiKey: apiKey ?? undefined,
        jevEvidence: true,
      });
      setResults(next);
      setTelemetry(stats);
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

  // ⌘K / Ctrl+K opens the command palette from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const commands: Command[] = [
    { id: "run", group: "Judge", label: "Run judgment", hint: "⌘↵", run: () => void run() },
    { id: "sample", group: "Text", label: "Load sample text", run: () => setText(SAMPLE_TEXT) },
    { id: "clear-text", group: "Text", label: "Clear text", run: () => setText("") },
    { id: "all", group: "Checks", label: "Select all checks", run: () => selectAll(true) },
    { id: "none", group: "Checks", label: "Clear all checks", run: () => selectAll(false) },
    ...allAxes.map((axis) => ({
      id: `toggle-${axis.id}`,
      group: "Checks",
      label: `${selectedIds.has(axis.id) ? "Disable" : "Enable"} ${axis.name}`,
      hint: selectedIds.has(axis.id) ? "on" : "off",
      keepOpen: true,
      run: () => toggleAxis(axis.id),
    })),
    {
      id: "theme",
      group: "View",
      label: "Toggle light / dark",
      run: () => document.querySelector<HTMLButtonElement>('button[aria-label^="Switch to"]')?.click(),
    },
    { id: "key", group: "View", label: "Change API key", run: () => focusKeyInput() },
    { id: "docs", group: "Help", label: "Open TypeSafe docs", hint: "↗", run: () => window.open("https://docs.typesafe.ai", "_blank", "noreferrer") },
  ];

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
        <div className="flex items-center gap-3">
          <StatusReadout telemetry={telemetry} running={running} />
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="press hidden h-7 items-center gap-2 border border-line px-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 hover:border-ink hover:text-ink sm:flex"
            aria-label="Open command palette"
          >
            Command <span className="kbd">⌘K</span>
          </button>
          {/* Reserve the badge's space before hydration so the header doesn't shift. */}
          <span
            className={`flex h-7 items-center border px-2 font-mono text-[11px] uppercase tracking-[0.14em] ${
              !hydrated ? "invisible border-line" : demoMode ? "border-pink text-pink" : "glow-teal border-teal text-teal"
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

      {/* Thesis strip: one line, with the reasoning one click away. */}
      <details className="group border-b border-line px-4 sm:px-6">
        <summary className="flex cursor-pointer select-none list-none flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5">
          <span className="chip !bg-pink !text-[#1e1e1e]">Decisions, not scores</span>
          <span className="text-sm text-ink-2">Separate, named checks. Each gets its own verdict and confidence.</span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-muted group-open:hidden">Why? ▾</span>
          <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.14em] text-muted group-open:inline">Close ▴</span>
        </summary>
        <div className="grid gap-4 pb-4 text-sm text-ink-2 sm:grid-cols-3">
          <p>
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">The problem</span>
            One vague &ldquo;is this good?&rdquo; gives a number nobody can argue with, and models are easy to flatter into a 7.
          </p>
          <p>
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">The approach</span>
            Each check is one specific question. Jev answers all of them in a single call with a probability per answer.
          </p>
          <p>
            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">What you get</span>
            A verdict, a confidence, and the sentence that drove it, per check, so you know exactly what to fix.
          </p>
        </div>
      </details>

      {/* Workspace: 1 col → 2 cols (lg) → 3 cols (2xl). Bottom padding leaves room for the mobile action bar. */}
      <div className="grid flex-1 gap-4 p-4 pb-24 sm:p-6 sm:pb-24 lg:grid-cols-2 lg:pb-6 2xl:grid-cols-12">
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
            <RunButton running={running} count={selectedAxes.length} onClick={() => void run()} className="hidden lg:flex" />
          </div>
        </div>

        <div className="lg:sticky lg:top-16 lg:self-start 2xl:col-span-5">
          <Window
            title="03 · Results"
            meta={summary ? `${summary.passed}/${summary.total} passed` : status === "running" ? "Working" : "Waiting"}
            bodyClassName={`lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto ${running ? "signal" : ""}`}
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

      {/* Mobile action bar: the primary action stays reachable while scrolling. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 p-3 backdrop-blur lg:hidden">
        <RunButton running={running} count={selectedAxes.length} onClick={() => void run()} />
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:px-6">
        <span>Clarity Judge · one request per run · every check answered in parallel</span>
        <a href="https://docs.typesafe.ai" target="_blank" rel="noreferrer" className="hover:text-pink">
          docs.typesafe.ai
        </a>
      </footer>
    </div>
  );
}

function RunButton({ running, count, onClick, className = "" }: { running: boolean; count: number; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={running}
      className={`press window flex w-full items-center justify-between gap-2 border border-pink bg-pink px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-[#1e1e1e] hover:bg-magenta hover:text-[#fefefe] disabled:cursor-not-allowed disabled:opacity-80 ${
        running ? "sheen" : ""
      } ${className}`}
    >
      <span>{running ? "Judging…" : `Run judgment · ${count} ${count === 1 ? "check" : "checks"}`}</span>
      <span className="kbd !border-[#1e1e1e]/40 !bg-transparent !text-[#1e1e1e]">⌘↵</span>
    </button>
  );
}
