/**
 * Copies scripts/pre-commit and scripts/pre-push into .git/hooks so the secret
 * scanner runs before every commit and again before every push. Runs automatically via the `prepare` script on `pnpm install`; harmless when
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
for (const hook of ["pre-commit", "pre-push"]) {
  const target = `${hooksDir}/${hook}`;
  copyFileSync(`scripts/${hook}`, target);
  chmodSync(target, 0o755);
  console.log(`✓ Installed ${hook} secret check at ${target}`);
}
