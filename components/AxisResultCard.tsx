import type { AxisResult } from "@/types/results";
import { confidenceBand, formatPercent, isFlagged } from "@/lib/results";
import { CheckIcon, FlagIcon, QuestionIcon, WarningIcon } from "./icons";

type Props = { result: AxisResult; threshold: number };

export function AxisResultCard({ result, threshold }: Props) {
  const flagged = isFlagged(result, threshold);
  const band = confidenceBand(result.confidence, threshold);

  // Verdict state: icon shape + colour differ, so colour is never the only signal.
  const verdict = result.needsReview
    ? { icon: <QuestionIcon className="h-3.5 w-3.5" />, tone: "border-greyteal text-greyteal", label: "Review" }
    : result.isIssue
      ? { icon: <WarningIcon className="h-3.5 w-3.5" />, tone: "border-pink text-pink", label: "Issue" }
      : { icon: <CheckIcon className="h-3.5 w-3.5" />, tone: "border-teal text-teal", label: "Pass" };

  const fill = { high: "bg-teal", medium: "bg-greyteal", low: "bg-pink" }[band];
  const pct = Math.round(result.confidence * 100);

  return (
    <article className={`border bg-panel ${flagged ? "border-line-strong" : "border-line"}`}>
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-ink">{result.axis.name}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{result.axis.question}</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${verdict.tone}`}>
          {verdict.icon}
          {verdict.label}
        </span>
      </header>

      <div className="space-y-3 px-4 py-3">
        <p className="text-lg font-medium leading-tight tracking-tight text-ink">
          {result.verdictLabel}
          {result.verdictDetail && <span className="font-normal text-ink-2"> · {result.verdictDetail}</span>}
        </p>

        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Confidence</span>
            <div
              className="relative h-3.5 flex-1 border border-line-strong bg-bg"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="Confidence"
            >
              <div
                className={`absolute inset-y-0 left-0 ${fill} transition-[width] duration-300`}
                style={{
                  width: `${pct}%`,
                  backgroundImage: "repeating-linear-gradient(90deg, transparent 0 5px, var(--bg) 5px 6px)",
                }}
              />
            </div>
            <span className="w-10 text-right font-mono text-xs tabular-nums text-ink">{result.needsReview ? "—" : formatPercent(result.confidence)}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
            <span className="text-muted">
              {result.axis.kind === "choice" && result.answer?.optionProbabilities && !result.needsReview
                ? result.axis.options
                    .map((option) => `${option.label} ${formatPercent(result.answer?.optionProbabilities?.[option.value] ?? 0)}`)
                    .join(" · ")
                : ""}
            </span>
            {flagged && (
              <span className="flex items-center gap-1 text-pink">
                <FlagIcon className="h-3 w-3" title="Low confidence" />
                Uncertain · double-check
              </span>
            )}
          </div>
        </div>

        {result.evidence && (
          <figure className="border-l-2 border-line-strong pl-3">
            <blockquote className="text-sm leading-relaxed text-ink-2">&ldquo;{result.evidence.snippet}&rdquo;</blockquote>
            <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {result.evidence.approximate ? "≈ Approximate · matched locally, not chosen by Jev" : "◆ Sentence picked by Jev"}
            </figcaption>
          </figure>
        )}
      </div>
    </article>
  );
}
