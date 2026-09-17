#!/usr/bin/env node
/**
 * Secret scanner. Fails (exit 1) if anything that looks like a credential is
 * about to be committed or is already tracked.
 *
 *   node scripts/check-secrets.mjs --staged   # pre-commit: scan staged changes only
 *   node scripts/check-secrets.mjs            # CI / manual: scan every tracked file
 *
 * No dependencies on purpose, so it runs before `npm install` finishes and in CI.
 */
import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const PATTERNS = [
  { name: "TypeSafe API key", regex: /apikey_[A-Za-z0-9_]{30,}/ },
  { name: "OpenAI-style key", regex: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { name: "GitHub token", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: "Private key block", regex: /-----BEGIN (?:RSA |OPENSSH |EC |DSA |PGP )?PRIVATE KEY/ },
  {
    name: "TYPESAFE_API_KEY with a real value",
    regex: /TYPESAFE_API_KEY\s*[=:]\s*["']?(?!your_key_here|<|\$|$)[A-Za-z0-9_]{16,}/,
  },
];

/** Files that legitimately contain the patterns above (this scanner, lockfiles). */
const SKIP_PATHS = [/^scripts\/check-secrets\.mjs$/, /package-lock\.json$/, /\.lock$/];

/**
 * Paths that should never be uploaded, whatever they contain: local tool
 * state, build output, credentials files, private keys, OS cruft.
 */
const BLOCKED_PATHS = [
  { name: "Vercel project link", regex: /(^|\/)\.vercel(\/|$)/ },
  { name: "build output", regex: /(^|\/)(\.next|out|dist|build)(\/|$)/ },
  { name: "dependencies", regex: /(^|\/)node_modules(\/|$)/ },
  { name: "private key file", regex: /\.(pem|key|p12|pfx|jks|keystore)$|(^|\/)id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/ },
  { name: "credentials file", regex: /(^|\/)(\.npmrc|\.pypirc|\.netrc|\.aws\/credentials|\.git-credentials|credentials\.json|service-account.*\.json|\.htpasswd)$/ },
  { name: "OS / editor cruft", regex: /(^|\/)(\.DS_Store|Thumbs\.db)$/ },
  { name: "database / dump", regex: /\.(sqlite|sqlite3|db|sql\.gz|dump)$/ },
];

/** Anything above this size is almost certainly not source and should not be uploaded by accident. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function blockedPathReason(path) {
  const hit = BLOCKED_PATHS.find((b) => b.regex.test(path));
  return hit ? hit.name : null;
}

function sh(command) {
  return execSync(command, { encoding: "utf8" });
}

function isEnvFile(path) {
  const base = path.split("/").pop() ?? "";
  return base.startsWith(".env") && !base.endsWith(".example");
}

const staged = process.argv.includes("--staged");
const findings = [];

if (staged) {
  const files = sh("git diff --cached --name-only --diff-filter=ACMR").split("\n").filter(Boolean);
  for (const file of files) {
    if (isEnvFile(file)) findings.push({ file, line: 0, name: "env file staged for commit", text: file });
    const reason = blockedPathReason(file);
    if (reason) findings.push({ file, line: 0, name: `${reason} staged for commit`, text: file });
    try {
      const size = statSync(file).size;
      if (size > MAX_FILE_BYTES) findings.push({ file, line: 0, name: "oversized file staged", text: `${(size / 1048576).toFixed(1)} MB` });
    } catch {
      // deleted in the index; nothing to size
    }
  }
  // Only scan ADDED lines so old, already-reviewed content doesn't block commits.
  const diff = sh("git diff --cached --unified=0 --no-color");
  let currentFile = null;
  let lineNo = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      currentFile = line.slice(4).replace(/^b\//, "");
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunk) {
      lineNo = Number(hunk[1]);
      continue;
    }
    if (!line.startsWith("+") || !currentFile) continue;
    if (!SKIP_PATHS.some((p) => p.test(currentFile))) scan(currentFile, line.slice(1), lineNo);
    lineNo++;
  }
} else {
  const files = sh("git ls-files").split("\n").filter(Boolean);
  for (const file of files) {
    if (isEnvFile(file)) findings.push({ file, line: 0, name: "env file tracked by git", text: file });
    const reason = blockedPathReason(file);
    if (reason) findings.push({ file, line: 0, name: `${reason} tracked by git`, text: file });
    if (SKIP_PATHS.some((p) => p.test(file))) continue;
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue; // deleted or unreadable
    }
    if (content.includes("\u0000")) continue; // binary
    content.split("\n").forEach((text, i) => scan(file, text, i + 1));
  }
}

function scan(file, text, line) {
  for (const { name, regex } of PATTERNS) {
    const match = text.match(regex);
    if (match) findings.push({ file, line, name, text: mask(match[0]) });
  }
}

/** Never print the secret itself — just enough to locate it. */
function mask(value) {
  return value.length <= 8 ? "****" : `${value.slice(0, 4)}…${value.slice(-3)} (${value.length} chars)`;
}

if (findings.length > 0) {
  console.error(`\n✖ ${staged ? "Commit" : "Push"} blocked: possible secrets or files that must not be uploaded.\n`);
  for (const f of findings) {
    console.error(`  ${f.file}${f.line ? `:${f.line}` : ""}  ${f.name}  →  ${f.text}`);
  }
  console.error("\nMove secrets into .env.local (gitignored) and reference them via process.env. Add local-only paths to .gitignore.\n");
  process.exit(1);
}

console.log(`✓ No secrets found (${staged ? "staged changes" : "all tracked files"}).`);
