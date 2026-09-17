"use client";

import { useState } from "react";
import { isFlagged } from "@/lib/results";

import type { AxisResult, JudgmentStatus, Summary } from "@/types/results";
import type { JevErrorPayload } from "@/types/jev";
import { AxisResultCard } from "./AxisResultCard";
import { SummaryBanner } from "./SummaryBanner";
import { explainError } from "@/lib/errors";
import { WarningIcon } from "./icons";

type Props = {
  status: JudgmentStatus;
  results: AxisResult[];
  summary: Summary | null;
  error: JevErrorPayload | null;
  threshold: number;
  onThresholdChange: (value: number) => void;
  onRetry: () => void;
  /** Jump to the API key banner (used by auth errors). */
  onChangeKey: () => void;
  demoMode: boolean;
  /** Increments per run so cards re-animate on each new judgment. */
  runId: number;
};

export function ResultsPanel({ status, results, summary, error, threshold, onThresholdChange, onRetry, onChangeKey, demoMode, runId }: Props) {
  const explained = error ? explainError(error) : null;

  // Progressive disclosure: by default, issues and flagged checks are open and
  // passes are closed. Any manual toggle or "expand/collapse all" overrides that
  // until the next run (the override is keyed by runId).
  const [override, setOverride] = useState<{ runId: number; ids: Set<string> } | null>(null);
  const defaultOpen = (r: AxisResult) => r.isIssue || r.needsReview || isFlagged(r, threshold);
  const isOpen = (r: AxisResult) => (override && override.runId === runId ? override.ids.has(r.axis.id) : defaultOpen(r));
  const currentOpenIds = () => new Set(results.filter(isOpen).map((r) => r.axis.id));
  const allOpen = results.length > 0 && results.every(isOpen);

  function toggleOne(id: string) {
    const ids = currentOpenIds();
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    setOverride({ runId, ids });
  }
  function setAll(open: boolean) {
    setOverride({ runId, ids: open ? new Set(results.map((r) => r.axis.id)) : new Set() });
  }
  return (
    <div>
      {/* Toolbar: the threshold is a results-view setting, so it lives here rather than in the title bar. */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        <label className="flex items-center gap-2">
          <span>Flag below</span>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={Math.round(threshold * 100)}
            onChange={(event) => onThresholdChange(Number(event.target.value) / 100)}
            className="h-1 w-24"
            aria-label="Confidence threshold"
          />
          <span className="w-8 text-xs tabular-nums text-ink">{Math.round(threshold * 100)}%</span>
        </label>
        {results.length > 0 ? (
          <button type="button" onClick={() => setAll(!allOpen)} className="press text-ink-2 hover:text-ink">
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        ) : (
          <span className="hidden sm:inline">Hatched zone = uncertain</span>
        )}
      </div>

      <div className="space-y-3 p-3">
        {status === "error" && error && explained && (
          <div role="alert" className="window border border-pink bg-panel">
            <div className="titlebar flex h-7 items-center gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.14em] !bg-pink !text-[#1e1e1e]">
              <WarningIcon className="h-3.5 w-3.5" />
              <span>Run failed{error.status ? ` · HTTP ${error.status}` : ""}</span>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <p className="text-base font-medium leading-snug text-ink">{explained.title}</p>
              <p className="leading-relaxed text-ink-2">{explained.detail}</p>
              {explained.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {explained.actions.map((action) =>
                    action.kind === "link" ? (
                      <a
                        key={action.label}
                        href={action.href}
                        target="_blank"
                        rel="noreferrer"
                        className="press bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bg hover:bg-pink hover:text-[#1e1e1e]"
                      >
                        {action.label} ↗
                      </a>
                    ) : (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.kind === "retry" ? onRetry : onChangeKey}
                        className={`press px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] ${
                          action.kind === "retry"
                            ? "border border-ink text-ink hover:bg-ink hover:text-bg"
                            : "border border-line text-ink-2 hover:border-ink hover:text-ink"
                        }`}
                      >
                        {action.label}
                      </button>
                    ),
                  )}
                </div>
              )}
              {error.raw && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink">
                    Raw response · {error.code}
                  </summary>
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap border border-line bg-bg p-2 font-mono text-[11px] text-ink-2">{error.raw}</pre>
                </details>
              )}
            </div>
          </div>
        )}

        {status === "running" && (
          <div className="border border-line bg-panel-2 p-3" role="status" aria-live="polite">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
              <span>Asking Jev</span>
              <span className="text-muted">one request · all checks in parallel</span>
            </div>
            <div className="loader-blocks mt-2 h-3 w-full border border-line-strong" aria-hidden />
          </div>
        )}

        {status === "idle" && results.length === 0 && (
          <div className="border border-dashed border-line-strong px-4 py-12 text-center">
            <p className="text-sm text-ink-2">Pick your checks and press</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink">Run judgment</p>
          </div>
        )}

        {results.length > 0 && summary && (
          <div className={`space-y-3 transition-opacity duration-150 ${status === "running" ? "opacity-50" : ""}`}>
            <SummaryBanner summary={summary} demoMode={demoMode} />
            {results.map((result, i) => (
              <AxisResultCard
                key={`${runId}-${result.axis.id}`}
                result={result}
                threshold={threshold}
                index={i + 1}
                expanded={isOpen(result)}
                onToggle={() => toggleOne(result.axis.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
