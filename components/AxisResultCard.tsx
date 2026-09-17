"use client";

import { ChevronDown, CircleCheck, CircleHelp, Flag, TriangleAlert } from "lucide-react";
import type { AxisResult } from "@/types/results";
import { formatPercent, isFlagged } from "@/lib/results";

type Props = {
  result: AxisResult;
  threshold: number;
  index?: number;
  expanded: boolean;
  onToggle: () => void;
};

type Outcome = "issue" | "pass" | "review";

/**
 * One verdict. Collapsed: badge, name, verdict line, confidence. Expanded: the
 * probability track, the evidence sentence, and the exact question asked.
 */
export function AxisResultCard({ result, threshold, index = 0, expanded, onToggle }: Props) {
  const flagged = isFlagged(result, threshold);
  const outcome: Outcome = result.needsReview ? "review" : result.isIssue ? "issue" : "pass";
  const badge = {
    issue: { icon: <TriangleAlert size={13} />, label: "Issue" },
    pass: { icon: <CircleCheck size={13} />, label: "Pass" },
    review: { icon: <CircleHelp size={13} />, label: "Review" },
  }[outcome];
  const yesProbability = result.axis.kind === "yes_no" && !result.needsReview ? result.answer?.probability : undefined;

  return (
    <details
      className="result-card rise-in"
      data-outcome={outcome}
      open={expanded}
      onToggle={(event) => {
        if (event.currentTarget.open !== expanded) onToggle();
      }}
      style={{ "--i": index } as React.CSSProperties}
    >
      <summary>
        <span className="outcome-badge" data-outcome={outcome}>
          {badge.icon}
          {badge.label}
        </span>
        <span className="result-name">
          <h3>{result.axis.name}</h3>
          <p>
            {result.verdictLabel}
            {result.verdictDetail ? ` · ${result.verdictDetail}` : ""}
          </p>
        </span>
        {flagged && !result.needsReview && (
          <span className="flag-icon">
            <Flag size={13} aria-hidden />
            <span className="sr-only">Low confidence</span>
          </span>
        )}
        <span className={`result-score${result.needsReview ? " na" : flagged ? " low" : ""}`}>{result.needsReview ? "—" : formatPercent(result.confidence)}</span>
        <ChevronDown size={15} className="marker" aria-hidden />
      </summary>

      <div className="result-body">
        {!result.needsReview && (
          <div>
            <div className="input-meta" style={{ margin: "0 0 6px" }}>
              <span>{yesProbability !== undefined ? "Probability of “yes”" : "Confidence in the pick"}</span>
              <span>{yesProbability !== undefined ? formatPercent(yesProbability) : formatPercent(result.confidence)}</span>
            </div>
            <div
              className="probability-track"
              role="meter"
              aria-label={`${yesProbability !== undefined ? "Probability of yes" : "Confidence"} for ${result.axis.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((yesProbability ?? result.confidence) * 100)}
              aria-valuetext={`${formatPercent(yesProbability ?? result.confidence)}${flagged ? ", under the threshold" : ""}`}
            >
              {yesProbability !== undefined && (
                <span className="zone" style={{ left: `${Math.round((1 - threshold) * 100)}%`, width: `${Math.max(0, Math.round((2 * threshold - 1) * 100))}%` }} aria-hidden />
              )}
              <span className={outcome === "issue" ? "bad" : "good"} style={{ width: `${Math.round((yesProbability ?? result.confidence) * 100)}%` }} />
            </div>
            {yesProbability !== undefined && (
              <div className="input-meta" style={{ marginTop: 6 }}>
                <span>No</span>
                <span>Hatched zone = under the threshold</span>
                <span>Yes</span>
              </div>
            )}
          </div>
        )}

        {result.axis.kind === "choice" && !result.needsReview && result.answer?.optionProbabilities && (
          <div className="candidate-list">
            {result.axis.options.map((option) => (
              <span key={option.value} className={option.value === result.answer?.value ? "chosen" : ""} title={option.description}>
                {option.label} · {formatPercent(result.answer?.optionProbabilities?.[option.value] ?? 0)}
              </span>
            ))}
          </div>
        )}

        {flagged && (
          <p className="flag-line">
            <Flag size={13} />
            {result.needsReview ? "No usable answer came back. Check this one by hand." : "Under the threshold. Worth a second look."}
          </p>
        )}

        {result.evidence && (
          <figure className="evidence-quote">
            <blockquote>&ldquo;{result.evidence.snippet}&rdquo;</blockquote>
            <figcaption>
              Sentence {result.evidence.index + 1} of {result.evidence.total} · {result.evidence.approximate ? "approximate, matched locally by keywords" : "picked by Jev"}
            </figcaption>
          </figure>
        )}

        <p className="asked">
          <b>Asked:</b> {result.axis.question}
        </p>
      </div>
    </details>
  );
}
