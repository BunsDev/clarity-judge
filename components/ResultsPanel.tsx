"use client";

import type { AxisResult, JudgmentStatus, Summary } from "@/types/results";
import type { JevErrorPayload } from "@/types/jev";
import { AxisResultCard } from "./AxisResultCard";
import { SummaryBanner } from "./SummaryBanner";
import { SpinnerIcon, WarningIcon } from "./icons";

type Props = {
  status: JudgmentStatus;
  results: AxisResult[];
  summary: Summary | null;
  error: JevErrorPayload | null;
  threshold: number;
  onThresholdChange: (value: number) => void;
  onRetry: () => void;
  demoMode: boolean;
};

export function ResultsPanel({ status, results, summary, error, threshold, onThresholdChange, onRetry, demoMode }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-800">Results</h2>
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          Flag below
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={Math.round(threshold * 100)}
            onChange={(event) => onThresholdChange(Number(event.target.value) / 100)}
            className="w-24 accent-indigo-600"
            aria-label="Confidence threshold"
          />
          <span className="w-8 font-medium text-zinc-900">{Math.round(threshold * 100)}%</span>
        </label>
      </div>

      {status === "error" && error && (
        <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          <div className="flex items-start gap-2">
            <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold">{error.error}</p>
              {error.raw && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-rose-800">Raw error details</summary>
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-rose-100 p-2 font-mono text-[11px] text-rose-900">
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
                className="rounded-md bg-rose-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-800"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "running" && (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600" role="status">
          <SpinnerIcon className="h-4 w-4 text-indigo-600" />
          Asking Jev…
        </div>
      )}

      {status === "idle" && results.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          Pick your checks and press <span className="font-medium text-zinc-700">Run Judgment</span>.
        </div>
      )}

      {results.length > 0 && summary && (
        <div className={`space-y-3 ${status === "running" ? "opacity-60" : ""}`}>
          <SummaryBanner summary={summary} demoMode={demoMode} />
          {results.map((result) => (
            <AxisResultCard key={result.axis.id} result={result} threshold={threshold} />
          ))}
        </div>
      )}
    </section>
  );
}
