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
    <div className="space-y-2">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        <span>Built in</span>
        <button type="button" onClick={() => onSelectAll(!allSelected)} disabled={disabled} className="press text-ink-2 hover:text-pink disabled:opacity-50">
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="space-y-1.5">
        {builtInAxes.map((axis) => (
          <AxisCard key={axis.id} axis={axis} selected={selectedIds.has(axis.id)} onToggle={onToggle} disabled={disabled} />
        ))}
      </div>

      {customAxes.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Yours</p>
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

      <div className="pt-1">
        <CustomAxisBuilder onAdd={onAddCustom} disabled={disabled} />
      </div>
    </div>
  );
}
