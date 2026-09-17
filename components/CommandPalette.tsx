"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

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

type Props = { open: boolean; onClose: () => void; commands: Command[] };

/** ⌘K palette: a filtered list with arrow-key navigation, in a native dialog. */
export function CommandPalette({ open, onClose, commands }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.group} ${c.label}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!open && el.open) el.close();
  }, [open]);

  // Keep the active row in view; at the top, show the first group label too.
  useEffect(() => {
    if (active === 0) listRef.current?.scrollTo({ top: 0 });
    else listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, filtered]);

  const clampedActive = Math.min(active, Math.max(0, filtered.length - 1));

  function runAt(index: number) {
    const command = filtered[index];
    if (!command) return;
    command.run();
    if (!command.keepOpen) onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="app-dialog palette"
      aria-label="Command palette"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="palette-input">
        <Search size={16} />
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
            } else if (event.key === "Home") {
              event.preventDefault();
              setActive(0);
            } else if (event.key === "End") {
              event.preventDefault();
              setActive(Math.max(0, filtered.length - 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              runAt(clampedActive);
            }
          }}
          placeholder="Type a command…"
          aria-label="Search commands"
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls="palette-options"
          aria-activedescendant={filtered.length ? `palette-option-${clampedActive}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        <span className="kbd">esc</span>
      </div>
      <ul ref={listRef} id="palette-options" className="palette-list" role="listbox" aria-label="Commands">
        {filtered.length === 0 && <li className="palette-empty">No matches</li>}
        {filtered.map((command, index) => {
          const isActive = index === clampedActive;
          const showGroup = index === 0 || filtered[index - 1].group !== command.group;
          return (
            <li key={command.id} role="presentation">
              {showGroup && <div className="palette-group">{command.group}</div>}
              <button type="button" id={`palette-option-${index}`} role="option" aria-selected={isActive} data-index={index} tabIndex={-1} onMouseEnter={() => setActive(index)} onClick={() => runAt(index)}>
                <span>{command.label}</span>
                {command.hint && <span className="palette-hint">{command.hint}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}
