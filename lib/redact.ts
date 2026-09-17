/**
 * Strip anything that looks like an API key from text before it is shown or
 * stored. Used on error bodies so a misbehaving upstream response (or a typo
 * that puts the key in the wrong place) can never echo a secret onto screen.
 */
const SECRET_PATTERNS: RegExp[] = [
  /apikey_[A-Za-z0-9_]{30,}/g, // TypeSafe
  /\bsk-[A-Za-z0-9_-]{20,}/g, // OpenAI / Anthropic style
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/g, // GitHub
  /Bearer\s+[A-Za-z0-9._\-]{16,}/g, // any bearer token
];

export function redactSecrets(text: string | undefined): string | undefined {
  if (!text) return text;
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, (match) => `${match.slice(0, 4)}…[redacted]`);
  }
  return result;
}

/** Loose shape check so we can warn on obviously wrong input without ever storing it. */
export function looksLikeTypeSafeKey(value: string): boolean {
  return /^apikey_[A-Za-z0-9_]{30,}$/.test(value.trim());
}
