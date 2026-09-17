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
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
        selected ? "border-indigo-300 bg-indigo-50/60" : "border-zinc-200 bg-white"
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={`${selected ? "Disable" : "Enable"} ${axis.name}`}
        onClick={() => onToggle(axis.id)}
        disabled={disabled}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
          selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 bg-white text-transparent"
        } disabled:opacity-50`}
      >
        <CheckIcon className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onToggle(axis.id)}
        disabled={disabled}
        className="min-w-0 flex-1 text-left disabled:opacity-50"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-900">{axis.name}</span>
          <span className="rounded-full border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {axis.kind === "yes_no" ? "Yes / No" : "Choice"}
          </span>
          {!axis.builtIn && (
            <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700">
              Custom
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{axis.description || axis.question}</p>
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(axis.id)}
          disabled={disabled}
          aria-label={`Remove ${axis.name}`}
          className="shrink-0 rounded px-1.5 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-rose-600 disabled:opacity-50"
        >
          Remove
        </button>
      )}
    </div>
  );
}
