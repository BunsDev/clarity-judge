"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onLoadSample: () => void;
  disabled?: boolean;
};

export function TextEditor({ value, onChange, onLoadSample, disabled }: Props) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="editor" className="text-sm font-semibold text-zinc-800">
          Your text
        </label>
        <button
          type="button"
          onClick={onLoadSample}
          disabled={disabled}
          className="text-xs font-medium text-indigo-700 hover:underline disabled:opacity-50"
        >
          Load sample text
        </button>
      </div>
      <textarea
        id="editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={10}
        placeholder="Paste or type the text you want judged…"
        className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-zinc-50"
      />
      <p className="text-xs text-zinc-500">
        {words} {words === 1 ? "word" : "words"} · {value.length.toLocaleString()} characters
      </p>
    </section>
  );
}
