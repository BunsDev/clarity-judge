"use client";

import { ChevronDown, FileText, ListChecks, Plus } from "lucide-react";
import type { Axis } from "@/types/axis";
import { splitSentences } from "@/lib/evidenceHeuristic";
import { CheckChips } from "./CheckChips";
import { CustomAxisBuilder } from "./CustomAxisBuilder";
import { RunButton } from "./ui";

type Props = {
  text: string;
  onText: (value: string) => void;
  onLoadSample: () => void;
  builtInAxes: Axis[];
  customAxes: Axis[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onAddCustom: (axis: Axis) => void;
  onRemoveCustom: (id: string) => void;
  demoMode: boolean;
  running: boolean;
  onRun: () => void;
  /** Keyboard shortcut shown on the run button, e.g. "⌘ ↵". */
  runHint: string;
};

/** Left panel: the text, the checks to run, and the run button. */
export function SourcePanel({
  text,
  onText,
  onLoadSample,
  builtInAxes,
  customAxes,
  selectedIds,
  onToggle,
  onSelectAll,
  onAddCustom,
  onRemoveCustom,
  demoMode,
  running,
  onRun,
  runHint,
}: Props) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = splitSentences(text).length;
  const total = builtInAxes.length + customAxes.length;
  const selected = selectedIds.size;
  const allSelected = selected === total && total > 0;

  return (
    <section className="panel" aria-labelledby="source-title">
      <div className="panel-heading">
        <div>
          <FileText size={18} strokeWidth={1.5} />
          <h2 id="source-title">Your writing</h2>
        </div>
        <button type="button" className="button quiet" disabled={running} onClick={onLoadSample}>
          Load sample
        </button>
      </div>

      <div className="panel-content grow">
        <fieldset disabled={running} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "flex", flexDirection: "column", flex: 1 }}>
          <label className="field-label" htmlFor="judge-text">
            Paste the text to judge
          </label>
          <textarea
            id="judge-text"
            className="document-input"
            value={text}
            maxLength={150_000}
            spellCheck={false}
            placeholder="Paste or type the text you want judged…"
            onChange={(event) => onText(event.target.value)}
          />
          <div className="input-meta">
            <span>
              {words} {words === 1 ? "word" : "words"} · {sentences} {sentences === 1 ? "sentence" : "sentences"}
            </span>
            <span>{text.length.toLocaleString()} chars</span>
          </div>

          <div className="field-label" style={{ marginTop: 20 }}>
            <ListChecks size={14} />
            Checks to run
            <span className="count" style={{ marginLeft: "auto" }}>
              {selected}/{total} on
            </span>
          </div>
          <CheckChips builtInAxes={builtInAxes} customAxes={customAxes} selectedIds={selectedIds} onToggle={onToggle} onRemoveCustom={onRemoveCustom} />
          <div className="chip-actions">
            <span className="field-hint" style={{ margin: 0 }}>
              Each check is one closed question. Open the Checks page to read what each one asks.
            </span>
            <button type="button" className="button quiet" onClick={() => onSelectAll(!allSelected)}>
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>

          <details className="disclosure card">
            <summary>
              <Plus size={14} />
              Add a custom check
              <ChevronDown size={14} className="marker" style={{ marginLeft: "auto" }} />
            </summary>
            <div className="disclosure-body">
              <CustomAxisBuilder onAdd={onAddCustom} />
            </div>
          </details>

          <div className="method-note">
            <span>
              01<strong>Ask Jev</strong>
            </span>
            <span>
              02<strong>Read the verdicts</strong>
            </span>
            <p>
              Every selected check goes out as one typed question in a single batched request. Yes/No checks come back as a probability; option checks
              as a pick with a probability per option.
            </p>
          </div>
        </fieldset>
      </div>

      <div className="panel-bottom">
        <span className="muted">
          {selected} {selected === 1 ? "check" : "checks"} · 1 verdict request{demoMode ? " · simulated" : " · plus an optional evidence request"}
        </span>
        <RunButton busy={running} disabled={!text.trim() || selected === 0} onClick={onRun} hint={runHint}>
          Run judgment
        </RunButton>
      </div>
    </section>
  );
}
