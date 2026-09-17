"use client";

import { useEffect, useRef, useState } from "react";
import type { Summary } from "@/types/results";

type Props = { summary: Summary; simulated: boolean };

/** The one-line takeaway and the four totals, in the playground's metrics grid. */
export function SummaryMetrics({ summary, simulated }: Props) {
  const allClear = summary.issues === 0 && summary.flagged === 0 && summary.total > 0;
  return (
    <div className={`verdict-summary${allClear ? " clear" : ""}`}>
      <h2>{summary.takeaway}</h2>
      <p className="summary-note">{simulated ? "Simulated results, deterministic for this text." : "Verdicts from Jev. Flags follow the threshold below."}</p>
      <dl className="summary-metrics">
        <Stat label="checked" value={summary.total} />
        <Stat label="passed" value={summary.passed} tone={summary.passed > 0 ? "pass" : undefined} />
        <Stat label="issues" value={summary.issues} tone={summary.issues > 0 ? "issue" : undefined} />
        <Stat label="flagged" value={summary.flagged} tone={summary.flagged > 0 ? "flag" : undefined} />
      </dl>
    </div>
  );
}

/** Ticks from the previous value to the new one over ~450ms. Respects reduced motion. */
function useCountUp(target: number, durationMs = 450): number {
  const [value, setValue] = useState(target);
  const previous = useRef(target);
  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (from === target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "pass" | "issue" | "flag" }) {
  const shown = useCountUp(value);
  return (
    <div>
      <dd style={{ margin: 0 }}>
        <strong className={tone}>{shown}</strong>
      </dd>
      <dt>
        <span>{label}</span>
      </dt>
    </div>
  );
}
