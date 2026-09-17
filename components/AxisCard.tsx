"use client";

import { useState } from "react";
import type { Axis } from "@/types/axis";
import { CheckIcon, ChevronIcon } from "./icons";

type Props = {
  axis: Axis;
  selected: boolean;
  onToggle: (id: string) => void;
  /** Only custom axes can be removed. */
  onRemove?: (id: string) => void;
  disabled?: boolean;
};

/**
 * One check. Collapsed: name and type only. Expanded: what it looks for,
 * the exact question Jev is asked, and the options for choice checks.
 */
export function AxisCard({ axis, selected, onToggle, onRemove, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const detailsId = `axis-details-${axis.id}`;

  return (
    <div
      className={`border transition-[border-color,background-color] duration-150 ${
        selected ? "border-line-strong bg-panel-2" : "border-line bg-panel hover:border-line-strong"
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`${selected ? "Disable" : "Enable"} ${axis.name}`}
          onClick={() => onToggle(axis.id)}
          disabled={disabled}
          className={`press flex h-4 w-4 shrink-0 items-center justify-center border ${
            selected ? "border-ink bg-ink text-bg" : "border-line-strong bg-transparent text-transparent"
          } disabled:opacity-50`}
        >
          <CheckIcon className="h-3 w-3" />
        </button>

        <button type="button" onClick={() => onToggle(axis.id)} disabled={disabled} className="min-w-0 flex-1 text-left disabled:opacity-50">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`text-sm font-medium ${selected ? "text-ink" : "text-ink-2"}`}>{axis.name}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{axis.kind === "yes_no" ? "[y/n]" : "[choice]"}</span>
            {!axis.builtIn && <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-magenta">[custom]</span>}
          </span>
        </button>

        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(axis.id)}
            disabled={disabled}
            aria-label={`Remove ${axis.name}`}
            className="press shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-pink disabled:opacity-50"
          >
            Remove
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={detailsId}
          aria-label={`${open ? "Hide" : "Show"} details for ${axis.name}`}
          className="press flex h-6 w-6 shrink-0 items-center justify-center border border-transparent text-muted hover:border-line hover:text-ink"
        >
          <ChevronIcon className={`h-3.5 w-3.5 transition-[rotate] duration-150 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div id={detailsId} className="space-y-2 border-t border-line px-3 py-2.5 pl-10 text-xs">
          <p className="leading-relaxed text-ink-2">{axis.description}</p>
          <p className="leading-relaxed text-muted">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Asks Jev · </span>
            {axis.question}
          </p>
          {axis.kind === "choice" && (
            <ul className="flex flex-wrap gap-1.5 pt-0.5">
              {axis.options.map((option) => (
                <li
                  key={option.value}
                  className={`border px-1.5 py-0.5 font-mono text-[10px] ${
                    axis.issueOptions.includes(option.value) ? "border-pink/50 text-pink" : "border-line text-muted"
                  }`}
                  title={axis.issueOptions.includes(option.value) ? "Counts as a problem" : "Counts as a pass"}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
          {axis.kind === "yes_no" && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              A &ldquo;yes&rdquo; counts as {axis.issueWhen ? <span className="text-pink">a problem</span> : <span className="text-teal">a pass</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
