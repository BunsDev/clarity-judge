import type { Axis } from "@/types/axis";

/**
 * The seven built-in judgment axes, defined as data rather than code.
 * To add a new built-in check, append an object here — nothing else needs to change.
 *
 * Each yes/no axis says which answer counts as a problem (`issueWhen`), so the
 * summary can count "issues found" correctly: for "hedging", a *yes* is bad;
 * for "clarity", a *no* is bad.
 */
export const BUILT_IN_AXES: Axis[] = [
  {
    id: "hedging",
    kind: "yes_no",
    builtIn: true,
    name: "Hedging language",
    description: "Softens strong claims with words like might, perhaps, sort of.",
    question:
      "Does this text unnecessarily hedge or soften its claims with words like 'might', 'perhaps', 'somewhat', 'I think', or 'sort of'?",
    criteria: {
      true: "The writer weakens clear claims with qualifiers that add no real information.",
      false: "Claims are stated directly, or hedges are justified by genuine uncertainty.",
    },
    issueWhen: true,
    yesLabel: "Hedges too much",
    noLabel: "States claims directly",
    evidenceHint: {
      keywords: [
        "might", "maybe", "perhaps", "somewhat", "sort of", "kind of", "i think",
        "probably", "arguably", "it seems", "seems to", "a bit", "a little",
        "not totally sure", "possibly", "could", "we'd",
      ],
    },
  },
  {
    id: "em_dashes",
    kind: "yes_no",
    builtIn: true,
    name: "Em dash usage",
    description: "Leans on em dashes (—) where a comma, period, or parentheses would do.",
    question:
      "Does this text overuse em dashes (—) where simpler punctuation such as commas or periods would work better?",
    criteria: {
      true: "Em dashes appear frequently, often several per paragraph, breaking the flow of sentences.",
      false: "Em dashes are absent or used sparingly for deliberate emphasis.",
    },
    issueWhen: true,
    yesLabel: "Overuses em dashes",
    noLabel: "Punctuation is fine",
    evidenceHint: { pattern: "—|--" },
  },
  {
    id: "clarity",
    kind: "yes_no",
    builtIn: true,
    name: "Clarity up front",
    description: "Is the main point obvious within the first two sentences?",
    question: "Is the main point of this text clear within the first two sentences?",
    criteria: {
      true: "A reader knows what the text is about, or what is being asked, after two sentences.",
      false: "The opening is vague, buried in caveats, or the main point arrives late.",
    },
    issueWhen: false,
    yesLabel: "Main point is clear early",
    noLabel: "Main point isn't clear early",
    evidenceHint: { keywords: ["should", "we need", "the point", "in short", "decision", "recommend"] },
  },
  {
    id: "filler",
    kind: "yes_no",
    builtIn: true,
    name: "Filler phrases",
    description: "Phrases that add words but no meaning.",
    question:
      "Does this text contain filler phrases that add no meaning, such as 'at the end of the day', 'it is important to note', or 'it's worth mentioning'?",
    criteria: {
      true: "Throat-clearing phrases appear that could be deleted without losing anything.",
      false: "Every phrase carries information.",
    },
    issueWhen: true,
    yesLabel: "Contains filler",
    noLabel: "No filler found",
    evidenceHint: {
      keywords: [
        "at the end of the day", "it is important to note", "it's important to note",
        "it's worth mentioning", "it is worth mentioning", "needless to say", "in order to",
        "basically", "actually", "anyway", "as a matter of fact", "at this point in time",
        "at some point", "to be fair",
      ],
    },
  },
  {
    id: "tone",
    kind: "choice",
    builtIn: true,
    name: "Tone consistency",
    description: "Is the register formal, casual, or an inconsistent mix?",
    question: "What is the overall tone of this text?",
    options: [
      { value: "formal", label: "Formal", description: "Professional register throughout; no slang or chatty asides." },
      { value: "casual", label: "Casual", description: "Relaxed, conversational register throughout." },
      { value: "mixed", label: "Mixed / inconsistent", description: "Switches between formal and casual, e.g. corporate phrasing next to slang." },
    ],
    issueOptions: ["mixed"],
    evidenceHint: { keywords: ["anyway", "sort of", "kind of", "hereby", "pursuant", "collectively", "gonna", "lol"] },
  },
  {
    id: "passive_voice",
    kind: "yes_no",
    builtIn: true,
    name: "Passive voice overuse",
    description: "Hides who did what ('mistakes were made').",
    question: "Does this text rely too heavily on passive voice, hiding who is responsible for actions?",
    criteria: {
      true: "Several sentences use passive constructions where an active subject would be clearer.",
      false: "Sentences mostly name who did what.",
    },
    issueWhen: true,
    yesLabel: "Leans on passive voice",
    noLabel: "Mostly active voice",
    evidenceHint: { pattern: "\\b(was|were|is|are|been|being|be)\\s+(\\w+ed|made|done|taken|given|seen|known)\\b" },
  },
  {
    id: "actionability",
    kind: "choice",
    builtIn: true,
    name: "Actionability",
    description: "Does the reader know what to do next? Handy for emails and meeting notes.",
    question: "How clearly does this text state the next steps or actions the reader should take?",
    options: [
      { value: "clear_next_steps", label: "Clear next steps", description: "Specific actions, owners, or deadlines are stated." },
      { value: "vague_next_steps", label: "Vague next steps", description: "Actions are mentioned but without specifics, e.g. 'figure it out at some point'." },
      { value: "no_next_steps", label: "No next steps", description: "The text describes a situation but asks for nothing." },
    ],
    issueOptions: ["vague_next_steps", "no_next_steps"],
    evidenceHint: { keywords: ["next steps", "let me know", "by friday", "action", "todo", "will", "please", "deadline", "figure out"] },
  },
];

export const BUILT_IN_AXIS_IDS = BUILT_IN_AXES.map((axis) => axis.id);
