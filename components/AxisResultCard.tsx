import type { AxisResult } from "@/types/results";
import { confidenceBand, formatPercent, isFlagged } from "@/lib/results";
import { CheckIcon, FlagIcon, QuestionIcon, WarningIcon } from "./icons";

type Props = { result: AxisResult; threshold: number };

export function AxisResultCard({ result, threshold }: Props) {
  const flagged = isFlagged(result, threshold);
  const band = confidenceBand(result.confidence, threshold);

  // Verdict icon + colour: pass / issue / needs review. Icon shapes differ so
  // colour is never the only signal.
  const verdict = result.needsReview
    ? { icon: <QuestionIcon className="h-4 w-4" />, classes: "bg-zinc-100 text-zinc-700 border-zinc-300", label: "Needs review" }
    : result.isIssue
      ? { icon: <WarningIcon className="h-4 w-4" />, classes: "bg-amber-100 text-amber-900 border-amber-300", label: "Issue" }
      : { icon: <CheckIcon className="h-4 w-4" />, classes: "bg-emerald-100 text-emerald-900 border-emerald-300", label: "Pass" };

  const bar = {
    high: "bg-emerald-500",
    medium: "bg-amber-400",
    low: "bg-rose-500",
  }[band];

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900">{result.axis.name}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{result.axis.question}</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${verdict.classes}`}>
          {verdict.icon}
          {verdict.label}
        </span>
      </header>

      <div className="mt-3">
        <p className="text-base font-semibold text-zinc-900">
          {result.verdictLabel}
          {result.verdictDetail && <span className="font-normal text-zinc-600"> — {result.verdictDetail}</span>}
        </p>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600">
            Confidence: <span className="font-medium text-zinc-900">{result.needsReview ? "unknown" : formatPercent(result.confidence)}</span>
          </span>
          {flagged && (
            <span className="flex items-center gap-1 font-medium text-rose-700">
              <FlagIcon className="h-3.5 w-3.5" title="Low confidence" />
              Uncertain — double-check
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(result.confidence * 100)} aria-label="Confidence">
          <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${Math.round(result.confidence * 100)}%` }} />
        </div>
        {result.answer?.optionProbabilities && !result.needsReview && (
          <p className="pt-1 text-[11px] text-zinc-500">
            {result.axis.kind === "choice" &&
              result.axis.options
                .map((option) => `${option.label} ${formatPercent(result.answer?.optionProbabilities?.[option.value] ?? 0)}`)
                .join(" · ")}
          </p>
        )}
      </div>

      {result.evidence && (
        <figure className="mt-3 rounded-md border-l-2 border-zinc-300 bg-zinc-50 px-3 py-2">
          <blockquote className="text-sm italic leading-relaxed text-zinc-700">&ldquo;{result.evidence.snippet}&rdquo;</blockquote>
          <figcaption className="mt-1 text-[11px] text-zinc-500">
            {result.evidence.approximate ? "Approximate evidence — matched locally by keywords, not chosen by Jev." : "Evidence sentence picked by Jev."}
          </figcaption>
        </figure>
      )}
    </article>
  );
}
