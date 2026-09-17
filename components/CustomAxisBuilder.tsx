"use client";

import { useState } from "react";
import type { Axis } from "@/types/axis";

type Props = {
  onAdd: (axis: Axis) => void;
  disabled?: boolean;
};

type Kind = "yes_no" | "choice";

/** Unique-enough id for a new custom axis (timestamp in base 36). */
function newAxisId(): string {
  return `custom-${Date.now().toString(36)}`;
}

/** Turn "Mixed / inconsistent" into "mixed_inconsistent" for the option key Jev sees. */
function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "option";
}

export function CustomAxisBuilder({ onAdd, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("yes_no");
  const [question, setQuestion] = useState("");
  const [goodLooksLike, setGoodLooksLike] = useState("");
  const [yesIsIssue, setYesIsIssue] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const [issueOptions, setIssueOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parsedOptions = optionsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  function reset() {
    setName("");
    setKind("yes_no");
    setQuestion("");
    setGoodLooksLike("");
    setYesIsIssue(false);
    setOptionsText("");
    setIssueOptions([]);
    setError(null);
  }

  function submit() {
    if (!name.trim()) return setError("Give the check a name.");
    if (!question.trim()) return setError("Write the question Jev should answer.");
    if (kind === "choice" && parsedOptions.length < 2) return setError("Add at least two options, one per line.");

    const base = {
      id: newAxisId(),
      name: name.trim(),
      description: goodLooksLike.trim() || question.trim(),
      question: question.trim(),
      goodLooksLike: goodLooksLike.trim() || undefined,
      builtIn: false,
      // Help the local evidence heuristic by looking for words from the question.
      evidenceHint: { keywords: [] },
    };

    const axis: Axis =
      kind === "yes_no"
        ? { ...base, kind: "yes_no", issueWhen: yesIsIssue, yesLabel: undefined, noLabel: undefined }
        : {
            ...base,
            kind: "choice",
            options: parsedOptions.map((label) => ({ value: slugify(label), label })),
            issueOptions: issueOptions.filter((value) => parsedOptions.some((label) => slugify(label) === value)),
          };

    onAdd(axis);
    reset();
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-600 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-50"
      >
        + Add a custom check
      </button>
    );
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-3 rounded-lg border border-indigo-200 bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">New custom check</h3>
        <button type="button" onClick={() => { reset(); setOpen(false); }} className="text-xs text-zinc-500 hover:underline">
          Cancel
        </button>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-700">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Is this on-brand?" className={inputClass} />
      </label>

      <fieldset className="space-y-1">
        <legend className="text-xs font-medium text-zinc-700">Answer type</legend>
        <div className="flex gap-2">
          {(["yes_no", "choice"] as Kind[]).map((value) => (
            <label
              key={value}
              className={`flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-center text-sm ${
                kind === value ? "border-indigo-500 bg-indigo-50 text-indigo-800" : "border-zinc-300 text-zinc-700"
              }`}
            >
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
              {value === "yes_no" ? "Yes / No" : "Pick one option"}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-700">Question to ask</span>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder={kind === "yes_no" ? "Does this text sound like our brand voice?" : "Which audience is this text written for?"}
          className={inputClass}
        />
        {kind === "yes_no" && <span className="text-[11px] text-zinc-500">Phrase it so that &ldquo;yes&rdquo; has an unambiguous meaning.</span>}
      </label>

      {kind === "yes_no" ? (
        <fieldset className="space-y-1">
          <legend className="text-xs font-medium text-zinc-700">A &ldquo;yes&rdquo; answer means…</legend>
          <div className="flex gap-2">
            <label className={`flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-center text-sm ${!yesIsIssue ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-zinc-300 text-zinc-700"}`}>
              <input type="radio" name="yesMeans" checked={!yesIsIssue} onChange={() => setYesIsIssue(false)} className="sr-only" />
              The text passes
            </label>
            <label className={`flex-1 cursor-pointer rounded-md border px-3 py-1.5 text-center text-sm ${yesIsIssue ? "border-amber-500 bg-amber-50 text-amber-800" : "border-zinc-300 text-zinc-700"}`}>
              <input type="radio" name="yesMeans" checked={yesIsIssue} onChange={() => setYesIsIssue(true)} className="sr-only" />
              There&apos;s a problem
            </label>
          </div>
        </fieldset>
      ) : (
        <>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-700">Options (one per line)</span>
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={3}
              placeholder={"Engineers\nExecutives\nGeneral public"}
              className={inputClass}
            />
          </label>
          {parsedOptions.length > 0 && (
            <fieldset className="space-y-1">
              <legend className="text-xs font-medium text-zinc-700">Which options count as a problem? (optional)</legend>
              <div className="flex flex-wrap gap-2">
                {parsedOptions.map((label) => {
                  const value = slugify(label);
                  const checked = issueOptions.includes(value);
                  return (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs ${checked ? "border-amber-500 bg-amber-50 text-amber-800" : "border-zinc-300 text-zinc-700"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setIssueOptions((prev) => (checked ? prev.filter((v) => v !== value) : [...prev, value]))}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
        </>
      )}

      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-700">What does &ldquo;good&rdquo; look like? (optional)</span>
        <textarea
          value={goodLooksLike}
          onChange={(e) => setGoodLooksLike(e.target.value)}
          rows={2}
          placeholder="Short, warm, no corporate jargon, speaks directly to the reader."
          className={inputClass}
        />
        <span className="text-[11px] text-zinc-500">Sent to Jev alongside the question as extra context.</span>
      </label>

      {error && <p className="text-xs text-rose-700">{error}</p>}

      <button type="submit" className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
        Save check
      </button>
    </form>
  );
}
