/**
 * A judgment "axis" is one specific, named check we run against the text —
 * for example "Does this hedge too much?" Each axis becomes exactly one Jev
 * question. Keeping checks separate and explicit is the whole point of this app:
 * a vague "is this good?" score is easy to game and hard to trust, while a
 * concrete question has a concrete answer you can argue with.
 */

type AxisBase = {
  /** Stable id. Built-ins use short slugs; custom axes get a generated id. */
  id: string;
  /** Short label shown in the UI, e.g. "Hedging language". */
  name: string;
  /** One-line explanation shown under the name. */
  description: string;
  /** The question text sent to Jev. */
  question: string;
  /** Optional: what a "good" text looks like for this axis. Sent to Jev as context. */
  goodLooksLike?: string;
  /** True for the 7 shipped axes; false for user-created ones. */
  builtIn: boolean;
  /**
   * Hints for the local evidence heuristic (used when Jev can't tell us which
   * sentence mattered). Words/phrases to look for, and an optional regex.
   */
  evidenceHint?: {
    keywords?: string[];
    /** A regex source string (kept as a string so axes stay JSON-serialisable). */
    pattern?: string;
  };
};

export type YesNoAxis = AxisBase & {
  kind: "yes_no";
  /** Which answer counts as a problem. `true` = a "yes" is bad (e.g. "hedges too much"). */
  issueWhen: boolean;
  /** Optional friendlier wording for each verdict, e.g. "Hedges too much". */
  yesLabel?: string;
  noLabel?: string;
  /** Optional clarification of the yes/no boundary, passed to Jev. */
  criteria?: { true: string; false: string };
};

export type ChoiceOption = {
  /** The key Jev picks, e.g. "mixed". */
  value: string;
  /** Human label, e.g. "Mixed / inconsistent". */
  label: string;
  /** Optional description sent to Jev to sharpen the boundary between options. */
  description?: string;
};

export type ChoiceAxis = AxisBase & {
  kind: "choice";
  options: ChoiceOption[];
  /** Option values that count as a problem, e.g. ["mixed"]. */
  issueOptions: string[];
};

export type Axis = YesNoAxis | ChoiceAxis;
