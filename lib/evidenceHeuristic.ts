import type { Axis } from "@/types/axis";
import type { Evidence } from "@/types/results";

/**
 * Local fallback for "which part of the text drove this verdict?"
 *
 * Jev returns verdicts and probabilities, not text spans. So when we can't get
 * evidence from the model, we pick the sentence that overlaps most with the
 * axis's keywords, pattern, and question words. It's approximate — the UI says so.
 */

const STOPWORDS = new Set([
  "a", "an", "the", "this", "that", "these", "those", "is", "are", "was", "were", "be",
  "does", "do", "did", "of", "to", "in", "on", "for", "with", "and", "or", "as", "at",
  "by", "it", "its", "text", "too", "such", "where", "which", "what", "how", "would",
  "should", "can", "will", "than", "then", "there", "their", "they", "you", "your",
  "not", "no", "yes", "any", "all", "more", "most", "very", "just", "also", "into",
  "from", "who", "whom", "when", "so", "if", "but", "e.g.", "eg", "i.e.", "ie",
]);

/** Split text into sentences. Simple on purpose; good enough for evidence picking. */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    // Split after . ! ? (optionally followed by closing quotes/brackets) or on blank lines.
    .split(/(?<=[.!?]["')\]]?)\s+|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

/** Score one sentence against an axis. Higher = more relevant. */
export function scoreSentence(sentence: string, axis: Axis): number {
  const lower = sentence.toLowerCase();
  let score = 0;

  // 1. Regex pattern hits are the strongest signal (e.g. every em dash).
  const pattern = axis.evidenceHint?.pattern;
  if (pattern) {
    try {
      const matches = sentence.match(new RegExp(pattern, "gi"));
      score += (matches?.length ?? 0) * 3;
    } catch {
      // A bad pattern in a custom axis shouldn't crash the app; just ignore it.
    }
  }

  // 2. Keyword/phrase hits (substring match so multi-word phrases work).
  for (const keyword of axis.evidenceHint?.keywords ?? []) {
    if (lower.includes(keyword.toLowerCase())) score += 2;
  }

  // 3. Weak signal: overlap between the question's words and the sentence.
  const sentenceTokens = new Set(tokenize(sentence));
  for (const token of new Set(tokenize(axis.question))) {
    if (sentenceTokens.has(token)) score += 1;
  }

  return score;
}

/**
 * Pick the most relevant sentence for an axis. Ties go to the earliest
 * sentence. If nothing matches at all, fall back to the first sentence.
 */
export function pickEvidence(text: string, axis: Axis): Evidence | null {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return null;

  let bestIndex = 0;
  let bestScore = -1;
  sentences.forEach((sentence, index) => {
    const score = scoreSentence(sentence, axis);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return { snippet: sentences[bestIndex], index: bestIndex, total: sentences.length, approximate: true };
}
