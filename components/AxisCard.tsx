"use client";

import type { Axis } from "@/types/axis";
import { CheckIcon } from "./icons";

type Props = {
  axis: Axis;
  selected: boolean;
  onToggle: (id: string) => void;
  /** Only custom axes can be removed. */
  onRemove?: (id: string) => void;
  disabled?: boolean;
};

export function AxisCard({ axis, selected, onToggle, onRemove, disabled }: Props) {
  return (
    <div
      className={`group flex items-start gap-3 border px-3 py-2.5 transition ${
        selected ? "border-line-strong bg-panel-2" : "border-line bg-panel hover:border-line-strong"
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`${selected ? "Disable" : "Enable"} ${axis.name}`}
        onClick={() => onToggle(axis.id)}
        disabled={disabled}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition ${
          selected ? "border-ink bg-ink text-bg" : "border-line-strong bg-transparent text-transparent"
        } disabled:opacity-50`}
      >
        <CheckIcon className="h-3 w-3" />
      </button>

      <button type="button" onClick={() => onToggle(axis.id)} disabled={disabled} className="min-w-0 flex-1 text-left disabled:opacity-50">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={`text-sm font-medium ${selected ? "text-ink" : "text-ink-2"}`}>{axis.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {axis.kind === "yes_no" ? "[y/n]" : "[choice]"}
          </span>
          {!axis.builtIn && <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-magenta">[custom]</span>}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{axis.description || axis.question}</p>
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(axis.id)}
          disabled={disabled}
          aria-label={`Remove ${axis.name}`}
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-pink disabled:opacity-50"
        >
          Remove
        </button>
      )}
    </div>
  );
}
