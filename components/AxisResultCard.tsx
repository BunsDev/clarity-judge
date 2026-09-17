import type { AxisResult } from "@/types/results";
import { confidenceBand, formatPercent, isFlagged } from "@/lib/results";
import { CheckIcon, FlagIcon, QuestionIcon, WarningIcon } from "./icons";

type Props = { result: AxisResult; threshold: number; index?: number };

export function AxisResultCard({ result, threshold, index = 0 }: Props) {
  const flagged = isFlagged(result, threshold);
  const band = confidenceBand(result.confidence, threshold);

  // Verdict state: icon shape + colour differ, so colour is never the only signal.
  const verdict = result.needsReview
    ? { icon: <QuestionIcon className="h-3.5 w-3.5" />, tone: "border-greyteal text-greyteal", fill: "bg-greyteal", label: "Review" }
    : result.isIssue
      ? { icon: <WarningIcon className="h-3.5 w-3.5" />, tone: "border-pink text-pink", fill: "bg-pink", label: "Issue" }
      : { icon: <CheckIcon className="h-3.5 w-3.5" />, tone: "border-teal text-teal", fill: "bg-teal", label: "Pass" };

  const confidenceTone = { high: "text-teal", medium: "text-ink", low: "text-pink" }[band];

  return (
    <article
      className={`rise-in border bg-panel ${flagged ? "border-line-strong" : "border-line"}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-ink">{result.axis.name}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{result.axis.question}</p>
        </div>
        <span className={`flex h-6 shrink-0 items-center gap-1.5 border px-2 font-mono text-[10px] uppercase tracking-[0.14em] ${verdict.tone}`}>
          {verdict.icon}
          {verdict.label}
        </span>
      </header>

      <div className="space-y-3 px-4 py-3">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-lg font-medium leading-tight tracking-tight text-ink">
            {result.verdictLabel}
            {result.verdictDetail && <span className="font-normal text-ink-2"> · {result.verdictDetail}</span>}
          </p>
          <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Confidence{" "}
            <span className={`text-xs tabular-nums ${result.needsReview ? "text-muted" : confidenceTone}`}>
              {result.needsReview ? "—" : formatPercent(result.confidence)}
            </span>
          </p>
        </div>

        {result.axis.kind === "yes_no" && !result.needsReview && result.answer?.probability !== undefined && (
          <YesNoStrip probability={result.answer.probability} threshold={threshold} fill={verdict.fill} />
        )}

        {result.axis.kind === "choice" && !result.needsReview && result.answer?.optionProbabilities && (
          <ul className="space-y-1.5">
            {result.axis.options.map((option) => {
              const p = result.answer?.optionProbabilities?.[option.value] ?? 0;
              const chosen = option.value === result.answer?.value;
              return (
                <li key={option.value} className="flex items-center gap-3">
                  <span className={`w-36 shrink-0 truncate font-mono text-[11px] ${chosen ? "chip" : "text-muted"}`} title={option.label}>
                    {option.label}
                  </span>
                  <SegmentTrack value={p} fill={chosen ? verdict.fill : "bg-line-strong"} />
                  <span className={`w-10 shrink-0 text-right font-mono text-xs tabular-nums ${chosen ? "text-ink" : "text-muted"}`}>{formatPercent(p)}</span>
                </li>
              );
            })}
          </ul>
        )}

        {flagged && (
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-pink">
            <FlagIcon className="h-3.5 w-3.5" title="Low confidence" />
            {result.needsReview ? "No usable answer · check by hand" : "Uncertain · double-check"}
          </p>
        )}

        {result.evidence && (
          <figure className="border-l-2 border-line-strong pl-3">
            <blockquote className="text-sm leading-relaxed text-ink-2">&ldquo;{result.evidence.snippet}&rdquo;</blockquote>
            <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Sentence {result.evidence.index + 1} of {result.evidence.total} ·{" "}
              {result.evidence.approximate ? "≈ approximate, matched locally" : "◆ picked by Jev"}
            </figcaption>
          </figure>
        )}
      </div>
    </article>
  );
}

/**
 * The actual answer to a yes/no question is a probability. Show it on a NO ↔ YES
 * strip with a marker, and hatch the uncertain middle zone — the band widens
 * and narrows live as the threshold slider moves.
 */
function YesNoStrip({ probability, threshold, fill }: { probability: number; threshold: number; fill: string }) {
  const pct = Math.round(probability * 100);
  const lo = Math.round((1 - threshold) * 100);
  const hi = Math.round(threshold * 100);
  return (
    <div className="space-y-1">
      <div className="relative h-4 border border-line-strong bg-bg" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Probability of yes">
        <div className="hatch absolute inset-y-0" style={{ left: `${lo}%`, width: `${Math.max(0, hi - lo)}%` }} aria-hidden />
        <div className={`absolute inset-y-0 left-0 ${fill} opacity-30`} style={{ width: `${pct}%` }} aria-hidden />
        <div
          className={`absolute inset-y-0 w-0.5 ${fill} ${fill === "bg-pink" ? "glow-pink" : fill === "bg-teal" ? "glow-teal" : ""}`}
          style={{ left: `calc(${pct}% - 1px)` }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        <span>No</span>
        <span className="text-ink-2">{pct}% yes</span>
        <span>Yes</span>
      </div>
    </div>
  );
}

/** Four-cell segmented track, like the bar charts on typesafe.ai. */
function SegmentTrack({ value, fill }: { value: number; fill: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="relative grid h-3 flex-1 grid-cols-4 gap-px" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="border border-line bg-panel-2" />
      ))}
      <div className={`absolute inset-y-0 left-0 ${fill}`} style={{ width: `${pct}%` }} aria-hidden />
    </div>
  );
}
