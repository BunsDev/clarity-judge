"use client";

import { useEffect, useRef, useState } from "react";
import type { Summary } from "@/types/results";

type Props = { summary: Summary; demoMode: boolean };

export function SummaryBanner({ summary, demoMode }: Props) {
  const allClear = summary.issues === 0 && summary.flagged === 0 && summary.total > 0;

  return (
    <div className={`window border ${allClear ? "border-teal" : "border-line-strong"} bg-panel-2`}>
      <p className="px-4 pt-4 pb-3 text-[15px] font-medium leading-snug text-ink">{summary.takeaway}</p>
      <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
        <Stat label="checked" value={summary.total} />
        <Stat label="passed" value={summary.passed} tone={summary.passed > 0 ? "text-teal" : undefined} />
        <Stat label="issues" value={summary.issues} tone={summary.issues > 0 ? "text-pink" : undefined} />
        <Stat label="flagged" value={summary.flagged} tone={summary.flagged > 0 ? "text-magenta" : undefined} />
      </dl>
      {demoMode && (
        <p className="border-t border-line px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          <span className="chip mr-2">Demo</span>Simulated results
        </p>
      )}
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

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const shown = useCountUp(value);
  return (
    <div className="border-r border-line px-4 py-2.5 last:border-r-0 sm:[&:nth-child(2)]:border-r max-sm:[&:nth-child(2)]:border-r-0">
      <dd className={`font-mono text-xl tabular-nums leading-none ${tone ?? "text-ink"}`}>{shown}</dd>
      <dt className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</dt>
    </div>
  );
}
