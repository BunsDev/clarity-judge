"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Axis } from "@/types/axis";
import type { JevErrorPayload } from "@/types/jev";
import { JevApiError } from "@/types/jev";
import type { AxisResult, JudgmentStatus } from "@/types/results";
import { BUILT_IN_AXES } from "@/lib/builtInAxes";
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
import { ApiKeySettings } from "./ApiKeySettings";
import { AxisSelector } from "./AxisSelector";
import { DemoModeBanner } from "./DemoModeBanner";
import { ResultsPanel } from "./ResultsPanel";
import { TextEditor } from "./TextEditor";
import { SpinnerIcon } from "./icons";

type Props = {
  /** Decided on the server from whether TYPESAFE_API_KEY is set. Never the key itself. */
  serverHasKey: boolean;
};

/**
 * The whole app's state lives here. Child components are presentational and
 * receive callbacks. Flow: edit text → pick axes → Run Judgment → results.
 */
export function ClarityJudgeApp({ serverHasKey }: Props) {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [customAxes, setCustomAxes] = useState<Axis[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(DEFAULT_SETTINGS.selectedAxisIds));
  const [threshold, setThreshold] = useState(DEFAULT_SETTINGS.threshold);
  const [status, setStatus] = useState<JudgmentStatus>("idle");
  const [results, setResults] = useState<AxisResult[]>([]);
  const [error, setError] = useState<JevErrorPayload | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const autoRan = useRef(false);

  // Load saved custom axes + settings once the component is on screen.
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

  // Persist changes after hydration.
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

  function removeCustomAxis(id: string) {
    setCustomAxes((prev) => prev.filter((a) => a.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setResults((prev) => prev.filter((r) => r.axis.id !== id));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Clarity Judge</h1>
          {hydrated && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                demoMode ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {demoMode ? "Demo mode" : apiKey ? "Live · browser key" : "Live · server key"}
            </span>
          )}
        </div>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Instead of one vague quality score, run your writing through separate, named checks. Each one gets its own
          verdict and confidence from TypeSafe&apos;s Jev model, so you can see exactly what to fix.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          {hydrated && demoMode && <DemoModeBanner />}
          {hydrated && (
            <ApiKeySettings
              serverHasKey={serverHasKey}
              hasBrowserKey={apiKey !== null}
              onSave={handleSaveApiKey}
              onClear={handleClearApiKey}
              disabled={running}
            />
          )}

          <TextEditor value={text} onChange={setText} onLoadSample={() => setText(SAMPLE_TEXT)} disabled={running} />

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

          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running && <SpinnerIcon className="h-4 w-4" />}
            {running ? "Judging…" : `Run Judgment (${selectedAxes.length} ${selectedAxes.length === 1 ? "check" : "checks"})`}
          </button>
        </div>

        <div className="md:sticky md:top-6 md:self-start">
          <ResultsPanel
            status={status}
            results={results}
            summary={summary}
            error={error}
            threshold={threshold}
            onThresholdChange={setThreshold}
            onRetry={() => void run()}
            demoMode={demoMode}
          />
        </div>
      </div>
    </div>
  );
}
