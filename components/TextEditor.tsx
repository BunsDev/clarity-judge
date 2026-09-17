"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onLoadSample: () => void;
  /** Called on ⌘/Ctrl + Enter inside the editor. */
  onRun: () => void;
  disabled?: boolean;
};

export function TextEditor({ value, onChange, onLoadSample, onRun, disabled }: Props) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full flex-col">
      <textarea
        id="editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onRun();
          }
        }}
        disabled={disabled}
        rows={14}
        aria-label="Text to judge"
        placeholder="Paste or type the text you want judged…"
        className="min-h-[16rem] w-full flex-1 resize-y bg-transparent px-4 py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted disabled:opacity-60"
      />
      <div className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        <span>
          {words} {words === 1 ? "word" : "words"} · {value.length.toLocaleString()} chars
        </span>
        <button type="button" onClick={onLoadSample} disabled={disabled} className="text-ink-2 hover:text-pink disabled:opacity-50">
          Load sample
        </button>
      </div>
    </div>
  );
}
