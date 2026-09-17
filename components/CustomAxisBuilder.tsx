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

const inputClass =
  "w-full border border-line bg-bg px-2.5 py-1.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-ink";
const labelClass = "font-mono text-[10px] uppercase tracking-[0.14em] text-muted";

function Segment({ active, tone = "ink", children, ...rest }: { active: boolean; tone?: "ink" | "teal" | "pink"; children: React.ReactNode } & React.LabelHTMLAttributes<HTMLLabelElement>) {
  const activeClass = { ink: "border-ink bg-ink text-bg", teal: "border-teal bg-teal/15 text-teal", pink: "border-pink bg-pink/15 text-pink" }[tone];
  return (
    <label
      {...rest}
      className={`flex-1 cursor-pointer border px-3 py-1.5 text-center font-mono text-[11px] uppercase tracking-[0.12em] transition ${
        active ? activeClass : "border-line text-ink-2 hover:border-line-strong"
      }`}
    >
      {children}
    </label>
  );
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
      evidenceHint: { keywords: [] },
    };

    const axis: Axis =
      kind === "yes_no"
        ? { ...base, kind: "yes_no", issueWhen: yesIsIssue }
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
        className="w-full border border-dashed border-line-strong px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 transition hover:border-pink hover:text-pink disabled:opacity-50"
      >
        + Add a custom check
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-3 border border-line-strong bg-panel-2 p-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">New custom check</h3>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>

      <label className="block space-y-1">
        <span className={labelClass}>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Is this on-brand?" className={inputClass} />
      </label>

      <fieldset className="space-y-1">
        <legend className={labelClass}>Answer type</legend>
        <div className="flex gap-1.5">
          {(["yes_no", "choice"] as Kind[]).map((value) => (
            <Segment key={value} active={kind === value}>
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
              {value === "yes_no" ? "Yes / No" : "Pick one"}
            </Segment>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-1">
        <span className={labelClass}>Question to ask</span>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder={kind === "yes_no" ? "Does this text sound like our brand voice?" : "Which audience is this text written for?"}
          className={inputClass}
        />
        {kind === "yes_no" && <span className="block text-[11px] text-muted">Phrase it so that &ldquo;yes&rdquo; has one clear meaning.</span>}
      </label>

      {kind === "yes_no" ? (
        <fieldset className="space-y-1">
          <legend className={labelClass}>A &ldquo;yes&rdquo; answer means</legend>
          <div className="flex gap-1.5">
            <Segment active={!yesIsIssue} tone="teal">
              <input type="radio" name="yesMeans" checked={!yesIsIssue} onChange={() => setYesIsIssue(false)} className="sr-only" />
              The text passes
            </Segment>
            <Segment active={yesIsIssue} tone="pink">
              <input type="radio" name="yesMeans" checked={yesIsIssue} onChange={() => setYesIsIssue(true)} className="sr-only" />
              There&apos;s a problem
            </Segment>
          </div>
        </fieldset>
      ) : (
        <>
          <label className="block space-y-1">
            <span className={labelClass}>Options (one per line)</span>
            <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={3} placeholder={"Engineers\nExecutives\nGeneral public"} className={inputClass} />
          </label>
          {parsedOptions.length > 0 && (
            <fieldset className="space-y-1">
              <legend className={labelClass}>Which options count as a problem? (optional)</legend>
              <div className="flex flex-wrap gap-1.5">
                {parsedOptions.map((label) => {
                  const value = slugify(label);
                  const checked = issueOptions.includes(value);
                  return (
                    <label
                      key={value}
                      className={`cursor-pointer border px-2 py-1 font-mono text-[11px] transition ${
                        checked ? "border-pink bg-pink/15 text-pink" : "border-line text-ink-2 hover:border-line-strong"
                      }`}
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
        <span className={labelClass}>What does &ldquo;good&rdquo; look like? (optional)</span>
        <textarea
          value={goodLooksLike}
          onChange={(e) => setGoodLooksLike(e.target.value)}
          rows={2}
          placeholder="Short, warm, no corporate jargon, speaks directly to the reader."
          className={inputClass}
        />
        <span className="block text-[11px] text-muted">Sent to Jev alongside the question as extra context.</span>
      </label>

      {error && <p className="text-xs text-pink">{error}</p>}

      <button
        type="submit"
        className="w-full bg-ink px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition hover:bg-pink hover:text-[#1e1e1e]"
      >
        Save check
      </button>
    </form>
  );
}
