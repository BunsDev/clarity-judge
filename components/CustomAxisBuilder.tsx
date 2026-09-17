"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Axis } from "@/types/axis";

type Props = { onAdd: (axis: Axis) => void };

type Kind = "yes_no" | "choice";

/** Unique-enough id for a new custom axis (timestamp in base 36). */
function newAxisId(): string {
  return `custom-${Date.now().toString(36)}`;
}

/** Turn "Mixed / inconsistent" into "mixed_inconsistent" for the option key Jev sees. */
function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "option";
}

function Segment({ active, children, ...rest }: { active: boolean; children: React.ReactNode } & React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label {...rest} className={`chip${active ? " selected" : ""}`}>
      <Check size={13} strokeWidth={2.25} aria-hidden />
      {children}
    </label>
  );
}

export function CustomAxisBuilder({ onAdd }: Props) {
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

  function submit(event: React.FormEvent) {
    event.preventDefault();
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
  }

  return (
    <form onSubmit={submit}>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Is this on-brand?" maxLength={80} />
      </label>

      <fieldset className="chip-fieldset">
        <legend className="field-label">Answer type</legend>
        <div className="field-options segmented">
          {(["yes_no", "choice"] as Kind[]).map((value) => (
            <Segment key={value} active={kind === value}>
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} />
              {value === "yes_no" ? "Yes / No" : "Pick one"}
            </Segment>
          ))}
        </div>
      </fieldset>

      <label style={{ marginTop: 14 }}>
        Question to ask
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={kind === "yes_no" ? "Does this text sound like our brand voice?" : "Which audience is this text written for?"}
        />
      </label>
      {kind === "yes_no" && <span className="field-hint">Phrase it so that &ldquo;yes&rdquo; has one clear meaning.</span>}

      {kind === "yes_no" ? (
        <fieldset className="chip-fieldset">
          <legend className="field-label">A &ldquo;yes&rdquo; answer means</legend>
          <div className="field-options segmented">
            <Segment active={!yesIsIssue}>
              <input type="radio" name="yesMeans" checked={!yesIsIssue} onChange={() => setYesIsIssue(false)} />
              The text passes
            </Segment>
            <Segment active={yesIsIssue}>
              <input type="radio" name="yesMeans" checked={yesIsIssue} onChange={() => setYesIsIssue(true)} />
              There&apos;s a problem
            </Segment>
          </div>
        </fieldset>
      ) : (
        <>
          <label style={{ marginTop: 14 }}>
            Options (one per line)
            <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={3} placeholder={"Engineers\nExecutives\nGeneral public"} />
          </label>
          {parsedOptions.length > 0 && (
            <fieldset className="chip-fieldset">
              <legend className="field-label">
                Which options count as a problem? <span className="muted">(optional)</span>
              </legend>
              <div className="field-options">
                {parsedOptions.map((label) => {
                  const value = slugify(label);
                  const checked = issueOptions.includes(value);
                  return (
                    <Segment key={value} active={checked}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setIssueOptions((prev) => (checked ? prev.filter((v) => v !== value) : [...prev, value]))}
                      />
                      {label}
                    </Segment>
                  );
                })}
              </div>
            </fieldset>
          )}
        </>
      )}

      <label style={{ marginTop: 14 }}>
        What does &ldquo;good&rdquo; look like? <span className="muted">(optional)</span>
        <textarea
          value={goodLooksLike}
          onChange={(e) => setGoodLooksLike(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Short, warm, no corporate jargon, speaks directly to the reader."
        />
      </label>
      <span className="field-hint">Sent to Jev alongside the question as extra context. Custom checks are saved in this browser.</span>

      {error && (
        <p className="field-hint" role="alert" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}

      <div className="dialog-actions">
        <button type="submit" className="button primary">
          Save check
        </button>
        <button type="button" className="button quiet" onClick={reset}>
          Reset
        </button>
      </div>
    </form>
  );
}
