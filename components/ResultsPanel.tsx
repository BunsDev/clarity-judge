"use client";

import { useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { isFlagged } from "@/lib/results";
import { explainError } from "@/lib/errors";
import type { AxisResult, JudgmentStatus, Summary } from "@/types/results";
import type { JevErrorPayload } from "@/types/jev";
import { AxisResultCard } from "./AxisResultCard";
import { SummaryMetrics } from "./SummaryMetrics";
import { Empty, Export } from "./ui";

type Props = {
  status: JudgmentStatus;
  results: AxisResult[];
  summary: Summary | null;
  error: JevErrorPayload | null;
  /** True when the text or checks changed after the last run. */
  stale: boolean;
  threshold: number;
  onThresholdChange: (value: number) => void;
  onRetry: () => void;
  onChangeKey: () => void;
  demoMode: boolean;
  /** True when the results on screen came from the mock, whatever the mode is now. */
  resultsSimulated: boolean;
  /** Increments per run so cards re-animate and disclosure defaults reset. */
  runId: number;
  exportData: unknown;
};

/** Right panel: the verdicts, one card per check, plus the threshold. */
export function ResultsPanel({ status, results, summary, error, stale, threshold, onThresholdChange, onRetry, onChangeKey, demoMode, resultsSimulated, runId, exportData }: Props) {
  const explained = error ? explainError(error) : null;

  // Progressive disclosure: issues and flagged checks start open, passes closed.
  // Any manual toggle or expand/collapse-all overrides that until the next run.
  const [override, setOverride] = useState<{ runId: number; ids: Set<string> } | null>(null);
  const defaultOpen = (r: AxisResult) => r.isIssue || r.needsReview || isFlagged(r, threshold);
  const isOpen = (r: AxisResult) => (override && override.runId === runId ? override.ids.has(r.axis.id) : defaultOpen(r));
  const allOpen = results.length > 0 && results.every(isOpen);

  function toggleOne(id: string) {
    const ids = new Set(results.filter(isOpen).map((r) => r.axis.id));
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    setOverride({ runId, ids });
  }
  function setAll(open: boolean) {
    setOverride({ runId, ids: open ? new Set(results.map((r) => r.axis.id)) : new Set() });
  }

  const running = status === "running";

  return (
    <section className="panel" aria-labelledby="results-title">
      <div className="panel-heading">
        <div>
          <h2 id="results-title">Verdicts</h2>
          {summary && (
            <span className={`count ${summary.issues === 0 && summary.flagged === 0 ? "good" : "accent"}`}>
              {summary.passed}/{summary.total} passed
            </span>
          )}
        </div>
        <Export data={exportData} name="clarity-judge.json" />
      </div>

      <div className="panel-content scroll" aria-live="polite">
        {status === "error" && error && explained && (
          <div className="error-note" role="alert">
            <strong>
              {explained.title}
              {error.status ? ` · HTTP ${error.status}` : ""}
            </strong>
            {explained.detail}
            {explained.actions.length > 0 && (
              <div className="run-actions">
                {explained.actions.map((action) =>
                  action.kind === "link" ? (
                    <a key={action.label} className="button primary" href={action.href} target="_blank" rel="noreferrer">
                      {action.label} ↗
                    </a>
                  ) : (
                    <button
                      key={action.label}
                      type="button"
                      className={`button${action.kind === "retry" ? " primary" : ""}`}
                      onClick={action.kind === "retry" ? onRetry : onChangeKey}
                    >
                      {action.label}
                    </button>
                  ),
                )}
              </div>
            )}
            {error.raw && (
              <details className="disclosure">
                <summary>
                  <ChevronDown size={14} className="marker" />
                  Raw response <span className="count">{error.code}</span>
                </summary>
                <pre className="criteria-preview">{error.raw}</pre>
              </details>
            )}
          </div>
        )}

        {stale && !running && <p className="notice">The text or checks changed. Run again for an up-to-date judgment.</p>}

        {running && (
          <p className="status-line" role="status">
            <LoaderCircle size={14} className="spin" />
            Asking Jev · all checks in one batched verdict request
          </p>
        )}

        {status === "idle" && results.length === 0 && (
          <Empty title="Nothing judged yet.">Pick your checks and press Run judgment to see a verdict, a confidence, and the evidence for each one.</Empty>
        )}

        {results.length > 0 && summary && (
          <div style={{ opacity: running ? 0.5 : 1, transition: "opacity 150ms" }}>
            <SummaryMetrics summary={summary} simulated={resultsSimulated} />

            <div className="results-toolbar">
              <span className="muted">
                {results.length} {results.length === 1 ? "check" : "checks"} · issues and low-confidence checks start open
              </span>
              <button type="button" className="button quiet small" onClick={() => setAll(!allOpen)}>
                {allOpen ? "Collapse all" : "Expand all"}
              </button>
            </div>

            <div className="evidence-list">
              {results.map((result, i) => (
                <AxisResultCard
                  key={`${runId}-${result.axis.id}`}
                  result={result}
                  threshold={threshold}
                  index={i}
                  expanded={isOpen(result)}
                  onToggle={() => toggleOne(result.axis.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="threshold">
          <label htmlFor="judge-threshold">
            Flag anything under <strong>{Math.round(threshold * 100)}%</strong>
          </label>
          <input
            id="judge-threshold"
            type="range"
            min={50}
            max={95}
            step={5}
            value={Math.round(threshold * 100)}
            onChange={(event) => onThresholdChange(Number(event.target.value) / 100)}
          />
          <div className="input-meta">
            <span>Trust more answers</span>
            <span>Ask for a second look sooner</span>
          </div>
        </div>
      </div>

      <p className="panel-footnote">
        Confidence is Jev&apos;s probability for its own answer, not a guarantee of accuracy. Flags update instantly without a new request.
        {demoMode ? " Demo results are simulated." : ""}
      </p>
    </section>
  );
}
