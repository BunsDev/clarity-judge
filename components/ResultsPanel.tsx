"use client";

import type { AxisResult, JudgmentStatus, Summary } from "@/types/results";
import type { JevErrorPayload } from "@/types/jev";
import { AxisResultCard } from "./AxisResultCard";
import { SummaryBanner } from "./SummaryBanner";
import { WarningIcon } from "./icons";

type Props = {
  status: JudgmentStatus;
  results: AxisResult[];
  summary: Summary | null;
  error: JevErrorPayload | null;
  threshold: number;
  onThresholdChange: (value: number) => void;
  onRetry: () => void;
  demoMode: boolean;
  /** Increments per run so cards re-animate on each new judgment. */
  runId: number;
};

export function ResultsPanel({ status, results, summary, error, threshold, onThresholdChange, onRetry, demoMode, runId }: Props) {
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
        <span className="hidden sm:inline">Hatched zone = uncertain</span>
      </div>

      <div className="space-y-3 p-3">
        {status === "error" && error && (
          <div role="alert" className="border border-pink bg-pink/10 p-4 text-sm text-ink">
            <div className="flex items-start gap-3">
              <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium">{error.error}</p>
                {error.raw && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2">Raw error</summary>
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap border border-line bg-bg p-2 font-mono text-[11px] text-ink-2">
                      {error.status ? `HTTP ${error.status} · ` : ""}
                      {error.code}
                      {"\n"}
                      {error.raw}
                    </pre>
                  </details>
                )}
                <button
                  type="button"
                  onClick={onRetry}
                  className="press bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bg hover:bg-pink hover:text-[#1e1e1e]"
                >
                  Retry
                </button>
              </div>
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
              <AxisResultCard key={`${runId}-${result.axis.id}`} result={result} threshold={threshold} index={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
