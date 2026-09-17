"use client";

import type { Axis } from "@/types/axis";
import { AxisCard } from "./AxisCard";
import { CustomAxisBuilder } from "./CustomAxisBuilder";

type Props = {
  builtInAxes: Axis[];
  customAxes: Axis[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onAddCustom: (axis: Axis) => void;
  onRemoveCustom: (id: string) => void;
  disabled?: boolean;
};

export function AxisSelector({
  builtInAxes,
  customAxes,
  selectedIds,
  onToggle,
  onSelectAll,
  onAddCustom,
  onRemoveCustom,
  disabled,
}: Props) {
  const total = builtInAxes.length + customAxes.length;
  const allSelected = selectedIds.size === total && total > 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">
          Checks to run <span className="font-normal text-zinc-500">({selectedIds.size} of {total})</span>
        </h2>
        <button
          type="button"
          onClick={() => onSelectAll(!allSelected)}
          disabled={disabled}
          className="text-xs font-medium text-indigo-700 hover:underline disabled:opacity-50"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="space-y-2">
        {builtInAxes.map((axis) => (
          <AxisCard key={axis.id} axis={axis} selected={selectedIds.has(axis.id)} onToggle={onToggle} disabled={disabled} />
        ))}
      </div>

      {customAxes.length > 0 && (
        <div className="space-y-2">
          <h3 className="pt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Your custom checks</h3>
          {customAxes.map((axis) => (
            <AxisCard
              key={axis.id}
              axis={axis}
              selected={selectedIds.has(axis.id)}
              onToggle={onToggle}
              onRemove={onRemoveCustom}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <CustomAxisBuilder onAdd={onAddCustom} disabled={disabled} />
    </section>
  );
}
