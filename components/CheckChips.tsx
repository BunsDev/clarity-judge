"use client";

import { Check, X } from "lucide-react";
import type { Axis } from "@/types/axis";

type Props = {
  builtInAxes: Axis[];
  customAxes: Axis[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onRemoveCustom: (id: string) => void;
};

/** The checks as toggle chips, the way the playground picks fields to extract. */
export function CheckChips({ builtInAxes, customAxes, selectedIds, onToggle, onRemoveCustom }: Props) {
  return (
    <div className="field-options" role="group" aria-label="Checks">
      {builtInAxes.map((axis) => (
        <Chip key={axis.id} axis={axis} selected={selectedIds.has(axis.id)} onToggle={onToggle} />
      ))}
      {customAxes.map((axis) => (
        <span className="chip-group" key={axis.id}>
          <Chip axis={axis} selected={selectedIds.has(axis.id)} onToggle={onToggle} />
          <button type="button" className="chip-remove" aria-label={`Remove ${axis.name}`} title="Remove this custom check" onClick={() => onRemoveCustom(axis.id)}>
            <X size={13} />
          </button>
        </span>
      ))}
    </div>
  );
}

function Chip({ axis, selected, onToggle }: { axis: Axis; selected: boolean; onToggle: (id: string) => void }) {
  return (
    <label className={`chip${selected ? " selected" : ""}`} title={axis.description}>
      <input type="checkbox" checked={selected} onChange={() => onToggle(axis.id)} />
      <Check size={13} strokeWidth={2.25} aria-hidden />
      {axis.name}
      <span className="chip-kind">{axis.kind === "yes_no" ? "y/n" : "pick"}</span>
    </label>
  );
}
