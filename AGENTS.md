# Agent guide — Clarity Judge

These instructions apply across this repository unless a more specific AGENTS.md applies. Read README.md, package.json, relevant tests, and the implementation before editing.

## Purpose and scope

Clarity Judge is an independent community writing evaluator using separate Jev questions, not a text-generation service, factual verifier, or universal writing score. Preserve explainable per-check outcomes, uncertainty, and source evidence. Do not add rewriting, autonomous actions, telemetry, or paid provider calls as incidental cleanup.

## Toolchain and layout

Use pnpm with the exact `packageManager` version in package.json and install with `pnpm install --frozen-lockfile`. Keep pnpm-lock.yaml as the only dependency lockfile. The preinstall guard permits pnpm; do not document the opposite. Preserve the existing hook installation and secret scanner. Do not upgrade dependencies or change the declared Node floor during unrelated documentation work.

- `lib/builtInAxes.ts`: built-in check definitions and polarity.
- `lib/judge.ts`: browser orchestration, question construction, answer mapping, evidence, and telemetry.
- `lib/jevClient.ts`: server-side provider adapter and normalization.
- `lib/mockJevClient.ts`: deterministic local demo transport.
- `lib/evidenceHeuristic.ts` and `lib/results.ts`: evidence and summary calculations.
- `lib/storage.ts`, `lib/redact.ts`, `lib/errors.ts`: persistence and error handling.
- `app/api/judge/route.ts`: server boundary and key handling.
- `components/Shell.tsx`: sidebar, topbar, key dialog, and the shared shell state; `components/JudgeWorkspace.tsx`: judgment state; other components render/edit checks and results.
- `types/`: shared contracts; `scripts/`: secret scans and Git hooks.

## Behavioral invariants

Each enabled check maps to a typed question: `noul` for Yes/No, `choice` for named options. Preserve stable ids, declared answer options, and the check's problem-answer polarity. Missing or malformed answers remain Needs review, not passing checks. Changing the display threshold should recompute flags locally rather than silently trigger provider calls.

Keep mock and live results visibly distinct. Simulated values must not be reported as model-quality measurements. Binary confidence is derived as `max(p, 1 - p)`; do not silently reinterpret it as the provider's choice confidence or calibrated correctness.

The main verdict batch and optional evidence-selection batch are different requests. Evidence selection is bounded to the existing sentence candidates; never generate or fabricate a source quote. Heuristic evidence must remain labeled approximate. A selected sentence is not verified causal attribution. Preserve the distinction between evidence lookup failure and primary judgment failure.

Document telemetry honestly: the existing primary-response usage does not include optional evidence-call usage. Do not claim one API request per complete run or complete billing accounting without implementing and testing that behavior.

## Credentials and privacy

Keep server environment keys out of client bundles, responses, model state, URLs, logs, and NEXT_PUBLIC_ variables. Browser keys are a separate user-supplied input sent through the same-origin header. Preserve override precedence, masking, redaction, and key removal.

Browser localStorage is not a vault. Live runs send writing to the provider, and public server keys can incur visitor-driven spend. Use synthetic text and placeholder credentials in fixtures and screenshots. Never commit real keys or bypass secret scanning to land a change. Security controls reduce risk; do not describe masking or scanning as an absolute guarantee.

## Verification

```sh
pnpm check:secrets
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Automated tests should use mocks, not shared TypeSafe credits. Cover answer mapping, issue polarity, malformed answers, threshold boundaries, evidence fallback, provider errors, redaction, and persistence when relevant. For UI changes, inspect custom checks, both modes, keyboard interaction, themes, narrow screens, and key lifecycle.

Report commands actually run, their results, and any skipped checks or environment limits. Do not claim static checks prove live API behavior. Keep README.md and CONTRIBUTING.md aligned with the implementation; keep CLAUDE.md as `@AGENTS.md`. Preserve the generated Next.js block below.

`repository-metadata.json` records intended About text/topics only. Do not treat it as an applied GitHub settings change, create release tags, publish packages, or change licensing/visibility unless requested.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
