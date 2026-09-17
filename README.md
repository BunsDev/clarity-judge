# Clarity Judge

Evaluate writing against **separate, named checks** with TypeSafe AI's Jev: hedging, em dash overuse, clarity, filler phrases, tone, passive voice, and actionability. Inspect each verdict, confidence signal, and supporting sentence rather than relying on one opaque overall score.

This is an **independent community project** under `BunsDev`, not an official TypeSafe product. It evaluates supplied writing; it does not generate a rewrite or establish that a passage is factually correct.

[Contributing](CONTRIBUTING.md) · [Agent guide](AGENTS.md) · [TypeSafe API reference](https://docs.typesafe.ai/api)

## Start with the no-key demo

Use the pnpm version pinned in [package.json](package.json), currently `10.34.5`, and keep `pnpm-lock.yaml` as the only dependency lockfile. The manifest declares Node.js `>=20`; use a version supported by the installed Next.js dependency as well. Node.js 22+ is a practical development baseline.

```sh
git clone https://github.com/BunsDev/clarity-judge.git
cd clarity-judge
# Activate the pnpm version declared in package.json.
# Where Corepack is installed, `corepack enable` enables its shims.
pnpm install --frozen-lockfile
pnpm dev
```

Open the address printed by Next.js, normally `http://localhost:3000`. Without a key, the app uses deterministic local mock results, clearly labeled as demo mode. They demonstrate the interface, not Jev's measured performance. The install guard permits **pnpm**, not npm or Yarn; do not create a second lockfile.

### Connect Jev

Obtain a key from the [TypeSafe console](https://console.typesafe.ai), then configure it on your own development server:

```sh
cp .env.local.example .env.local
# Edit .env.local and set TYPESAFE_API_KEY, then restart `pnpm dev`.
```

Alternatively, use the app's API key panel. A browser key overrides the server environment key; without either, the app stays in demo mode. Live requests go through this app's `/api/judge` endpoint to TypeSafe, not directly from the browser to the provider.

## Try a judgment

The editor starts with a deliberately hedgy sample. Choose the checks to run, then press **Run Judgment**, or use `⌘/Ctrl + Enter` in the editor. Each enabled check becomes a separate typed question, submitted in one primary batch.

| Check | What it asks about |
| --- | --- |
| Hedging language | Unnecessary qualification of claims. |
| Em dash usage | Excessive reliance on em dashes. |
| Clarity up front | Whether the main point appears early. |
| Filler phrases | Words and phrases that add little substance. |
| Tone consistency | The passage's tone category. |
| Passive voice overuse | Whether passive constructions obscure the message. |
| Actionability | Whether the reader has clear next steps. |

These are editable writing preferences, not universal rules: a hedge may accurately express uncertainty, and passive voice can be appropriate. Check the actual text before acting on a verdict.

Results show a plain-language verdict, confidence, a relevant sentence, and an uncertainty flag. The default flagging threshold is 70%; moving it re-evaluates flags locally without a new model call. Problematic and uncertain cards expand first; **Expand all** exposes the rest. The summary counts outcomes from the individual checks rather than providing an independent model-generated grade.

The interface follows the TypeSafe playground at [jev.works](https://jev.works): a sidebar with the judge and two reference pages (**Checks**, which lists every built-in question, and **How it works**), a topbar with the last run's latency and token readout, the API key dialog, and the theme switch. Use `⌘K` / `Ctrl+K` for the command palette and `⌘↵` / `Ctrl+Enter` to run. Narrow screens stack the two panels and move the sidebar behind a menu button.

## Add a custom check

Choose **Add a custom check**, then provide a name, question, and answer type: Yes/No or a fixed list of options. Declare which answers count as a problem; optionally describe what a good result looks like. Custom checks are stored in that browser's localStorage.

Keep questions narrow enough to judge from the supplied text. For built-in additions, edit `lib/builtInAxes.ts`; request construction, results, and summaries derive from those definitions. Keep ids stable and test both the answer mapping and the issue polarity.

## What the model returns

Jev answers structured questions rather than writing a critique. This app uses `noul` for Yes/No and `choice` for named options. The server adapter uses TypeSafe's `state`, `model`, and `questions` wire format with `jev-latest`; see `lib/jevClient.ts` and the API reference above.

For a Yes/No question, the provider returns the probability of “yes.” The app displays `max(p, 1 - p)` as the probability of the selected binary answer: 0.92 becomes 92%, while 0.5 becomes 50%. For choice questions, it uses the returned confidence value. These signals are not a guarantee of correctness, calibrated accuracy, or factual verification.

Missing or malformed answers remain **Needs review**. They must not silently become passing checks.

### Evidence and request counts

The primary request batches the enabled writing checks. When live evidence selection is enabled and the passage has 2–100 sentences, the app can make **one additional batched request** asking Jev to select sentence ids. Otherwise, or if that extra request fails, a local heuristic picks a likely sentence and labels it **approximate**.

Evidence always comes from the supplied text, not a generated quotation. A model-selected sentence is a relevance judgment, not proof of the model's causal reasoning or of the verdict's truth. Evidence lookup failure does not replace a failed primary judgment with a success.

At this revision, the token readout in `lib/judge.ts` uses the primary classification response; it does **not** aggregate usage from the optional evidence request. Demo token values are estimates. Do not treat the header as a complete billing ledger.

## API keys and privacy

A server `TYPESAFE_API_KEY` stays on the server; the client receives only configuration status. Do not put credentials in `NEXT_PUBLIC_` variables, checked-in files, screenshots, URLs, or model input.

A key entered in the browser is stored in localStorage and sent as the `x-typesafe-api-key` header to this deployment's `/api/judge` endpoint. The masked field reduces accidental screen exposure, but localStorage is not encrypted by the app and remains accessible to scripts on the origin and anyone with access to the browser profile. Users must trust the deployment handling their key. Remove browser keys on shared machines.

Live judgment sends the submitted writing and checks to TypeSafe. Use synthetic text for demonstrations and consider confidentiality before submitting unpublished or sensitive material. A public deployment configured with a server key lets visitor requests spend that key's credits: add appropriate access controls, request limits, and provider-side budgets, or leave the server key unset for a no-key demo.

### Repository safeguards

The install-time `prepare` script installs the repository's Git hooks. The secret scanner supports staged-change checks and tracked-file scans; the repository also contains a CI workflow. Run `pnpm check:secrets` before sharing changes. Redaction helpers mask key-shaped strings in errors, and `.env.local` is gitignored.

These are safeguards, not a guarantee that every credential or private sentence will be detected. Review diffs and exports manually. If a key is exposed, revoke or rotate it at the provider rather than only deleting the visible copy.

## Errors

| Result | What to check |
| --- | --- |
| 401 / rejected key | The browser override and server key configuration. |
| 402 / no credits | The account's billing or credit state. |
| 429 / rate limit | Provider retry guidance; avoid rapid repeated requests. |
| 529 or 503 / overloaded | Retry later rather than fabricating a result. |
| Needs review on a card | Missing or malformed data for that check. |

The UI provides actionable error messages and an expandable upstream response. Treat diagnostic text as potentially sensitive even after redaction.

## Project map

| Path | Responsibility |
| --- | --- |
| `components/Shell.tsx`, `components/ShellContext.tsx` | Sidebar, topbar, demo banner, theme, and the key state shared with every page. |
| `components/JudgeWorkspace.tsx` | Client state and the judgment workflow. |
| `components/SourcePanel.tsx`, `components/CheckChips.tsx`, `components/CustomAxisBuilder.tsx` | Text input, built-in and custom check selection. |
| `components/ApiKeyDialog.tsx` | The only place a key is typed; masked, never displayed again. |
| `components/BrandMark.tsx`, `app/icon.svg`, `app/apple-icon.tsx` | The Clarity Judge mark, drawn once and reused for the sidebar and icons. |
| `lib/social.ts`, `lib/social-image.tsx`, `app/**/opengraph-image.tsx` | Per-page metadata and generated social preview images. |
| `app/checks/page.tsx`, `app/how-it-works/page.tsx` | Reference pages generated from the check definitions. |
| `components/ResultsPanel.tsx`, `components/AxisResultCard.tsx` | Result, evidence, and uncertainty presentation. |
| `lib/builtInAxes.ts` | Named built-in checks. |
| `lib/judge.ts` | Browser orchestration, answer mapping, and optional evidence selection. |
| `lib/jevClient.ts`, `app/api/judge/route.ts` | Provider adapter and server endpoint. |
| `lib/mockJevClient.ts`, `lib/evidenceHeuristic.ts` | Local simulation and approximate evidence. |
| `lib/results.ts`, `lib/storage.ts`, `lib/redact.ts`, `lib/errors.ts` | Summaries, storage, redaction, and error presentation. |
| `types/` | Check, provider, and result contracts. |
| `scripts/` | Secret scanner and Git-hook installation. |

## Development checks

```sh
pnpm check:secrets
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm start` serves a production build. Automated tests should use mocks rather than consume real API credits. For interface changes, also check both modes, custom-check persistence, result thresholds, key removal, error states, keyboard controls, themes, and narrow screens.

## Related community projects

[TypeSafe AI Playground](https://github.com/BunsDev/typesafe-ai-playground) explores Jev experiments; [Jev Tool & Model Router](https://github.com/BunsDev/typesafe-router) separates route selection from execution; [TypeSafe UI](https://github.com/BunsDev/typesafe-ui) provides reusable interface components. These are separate repositories, not an automatically integrated product suite.

The proposed GitHub About description and discovery topics are recorded in [repository-metadata.json](repository-metadata.json). That file does not update GitHub settings automatically.
