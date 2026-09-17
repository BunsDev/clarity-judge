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
  onRetry: () => void;
  demoMode: boolean;
};

export function ResultsPanel({ status, results, summary, error, threshold, onRetry, demoMode }: Props) {
  return (
    <div className="space-y-3">
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
                className="bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition hover:bg-pink hover:text-[#1e1e1e]"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "running" && (
        <div className="flex items-center gap-2 border border-line px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2" role="status">
          <SpinnerIcon className="h-3.5 w-3.5 text-pink" />
          Asking Jev
        </div>
      )}

      {status === "idle" && results.length === 0 && (
        <div className="border border-dashed border-line-strong px-4 py-12 text-center">
          <p className="text-sm text-ink-2">Pick your checks and press</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink">Run judgment</p>
        </div>
      )}

      {results.length > 0 && summary && (
        <div className={`space-y-3 transition-opacity ${status === "running" ? "opacity-50" : ""}`}>
          <SummaryBanner summary={summary} demoMode={demoMode} />
          {results.map((result) => (
            <AxisResultCard key={result.axis.id} result={result} threshold={threshold} />
          ))}
        </div>
      )}
    </div>
  );
}
