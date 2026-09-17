"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Command = {
  id: string;
  label: string;
  /** Mono hint on the right, e.g. "on" / "off" / "⌘↵". */
  hint?: string;
  group: string;
  run: () => void;
  /** Keep the palette open after running (for toggles). */
  keepOpen?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  commands: Command[];
};

/**
 * ⌘K palette. No dependencies: a filtered list with arrow-key navigation.
 * Everything the app can do is reachable from the keyboard here.
 */
export function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.group} ${c.label}`.toLowerCase().includes(q));
  }, [commands, query]);

  // Reset and focus when opened.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Keep the active row in view.
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, filtered]);

  if (!open) return null;

  const clampedActive = Math.min(active, Math.max(0, filtered.length - 1));

  function runAt(index: number) {
    const command = filtered[index];
    if (!command) return;
    command.run();
    if (!command.keepOpen) {
      onClose();
      setQuery("");
    }
  }

  return (
    <div className="scrim fixed inset-0 z-40 flex items-start justify-center px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="window w-full max-w-xl border border-line-strong bg-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="titlebar flex h-7 items-center justify-between px-3 font-mono text-[11px] uppercase tracking-[0.14em]">
          <span>Command</span>
          <span className="opacity-70">esc to close</span>
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, filtered.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              runAt(clampedActive);
            }
          }}
          placeholder="Type a command…"
          aria-label="Search commands"
          className="w-full border-b border-line bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-muted"
        />
        <ul ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 && <li className="px-4 py-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted">No matches</li>}
          {filtered.map((command, index) => {
            const isActive = index === clampedActive;
            const showGroup = index === 0 || filtered[index - 1].group !== command.group;
            return (
              <li key={command.id} role="option" aria-selected={isActive}>
                {showGroup && <p className="px-4 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{command.group}</p>}
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => runAt(index)}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-sm ${
                    isActive ? "bg-panel-2 text-ink" : "text-ink-2"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 ${isActive ? "bg-pink glow-pink" : "bg-line-strong"}`} aria-hidden />
                    {command.label}
                  </span>
                  {command.hint && <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{command.hint}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
