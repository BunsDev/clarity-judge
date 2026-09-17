/**
 * Copies scripts/pre-commit into .git/hooks so the secret scanner runs before
 * every commit. Runs automatically via the `prepare` npm script; harmless when
 * there's no .git directory (e.g. inside a deployment build).
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

let gitDir;
try {
  gitDir = execSync("git rev-parse --git-dir", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {
  process.exit(0); // not a git checkout
}

const hooksDir = `${gitDir}/hooks`;
if (!existsSync(hooksDir)) mkdirSync(hooksDir, { recursive: true });
const target = `${hooksDir}/pre-commit`;
copyFileSync("scripts/pre-commit", target);
chmodSync(target, 0o755);
console.log(`✓ Installed pre-commit secret check at ${target}`);
