# Clarity Judge

A small, beginner-friendly web app that checks a piece of writing against **separate, named quality checks** — hedging, em dash overuse, filler phrases, passive voice, clarity, tone, and actionability — each answered by [TypeSafe AI's Jev model](https://typesafe.ai) with its own verdict and confidence score. You can also write your own checks.

It works out of the box in **demo mode** (no API key needed) and switches to real Jev calls the moment you add a key.

## Why separate checks instead of one score?

Asking a model "is this good?" gets you a number that's easy to game and hard to trust. Nobody can tell you *why* it's a 7.

Asking "does this text unnecessarily hedge its claims?" gets you a yes or a no, a confidence, and a sentence you can point at. That's how Diogo Almeida (TypeSafe cofounder) describes judging his own writing: a list of concrete rules rather than a vibe. Clarity Judge turns each rule into one question for Jev, runs them all at once, and shows you each answer on its own.

## What Jev is (in one paragraph)

Jev doesn't write text. You give it some text (TypeSafe calls this the "state") plus a list of typed questions, and it answers every question in a single fast call with structured values. Clarity Judge uses two question types:

- **Yes / No** questions — Jev returns the probability (0 to 1) that the answer is "yes".
- **Pick one** questions — Jev returns the chosen option, a probability for every option, and a confidence value.

All the questions in one run go out in one request, so seven checks cost one round trip.

## Setup

**Prerequisites:** Node.js 20 or newer.

```bash
git clone <this-repo-url> clarity-judge
cd clarity-judge
npm install
npm run dev
```

Open http://localhost:3000. That's demo mode — you'll see a yellow banner and simulated results. Everything is clickable.

### Connecting a real API key

1. Get a key at [typesafe.ai](https://typesafe.ai) (Jev is in early access; join the waitlist there).
2. Copy the example env file and paste your key in:

   ```bash
   cp .env.local.example .env.local
   # then edit .env.local so it reads:
   # TYPESAFE_API_KEY=your_key_here
   ```

3. Restart the dev server (`Ctrl+C`, then `npm run dev` again). The banner disappears and the badge in the header switches to **Live · server key**.

Prefer not to touch files? Paste the key into the **API key** panel in the app instead — see [API keys and keeping them secret](#api-keys-and-keeping-them-secret).

The key is read on the server only. The browser talks to this app's own `/api/judge` route, never to TypeSafe directly.

## Try it: the built-in sample

The editor is pre-loaded with a deliberately hedgy paragraph:

> I think we should probably consider moving the launch to next quarter — at least, that's sort of my current read on things. The data — which, to be fair, is still a little incomplete — seems to suggest that onboarding conversion might be somewhat lower than we'd perhaps hoped. …

Press **Run Judgment**. In demo mode the sample text gives this (results are simulated but deterministic, so you'll see exactly these numbers):

| Check | Verdict | Confidence |
|---|---|---|
| Hedging language | Yes — Hedges too much | 100% |
| Em dash usage | Yes — Overuses em dashes | 100% |
| Clarity up front | Yes — Main point is clear early | 93% |
| Filler phrases | Yes — Contains filler | 100% |
| Tone consistency | Casual | 62% ⚑ flagged |
| Passive voice overuse | Yes — Leans on passive voice | 75% |
| Actionability | Clear next steps | 86% |

with the summary *"3 of 7 checks passed. Review hedging language, em dash usage, filler phrases, and passive voice overuse. 1 check is low-confidence and worth a second look."*

With a real key the verdicts are Jev's own and will differ — you'd expect it to be harsher on clarity and actionability for this paragraph than the demo is.

Each card shows:

- the **verdict** in plain words, with a ✓ / ⚠ / ? icon (the icon shape changes as well as the colour, so it works without colour vision)
- **Confidence** as a percentage and a bar
- an **evidence sentence** — the part of your text most relevant to that check
- a **flag** ("Uncertain — double-check") when confidence is under the threshold. The default is 70%; drag the slider in the results header to change it. Flags update instantly without re-running.

## Adding your own checks

Click **+ Add a custom check** under the built-in list. You choose:

- a name (e.g. "Is this on-brand?")
- the answer type: Yes / No, or a list of options you type in
- the question to send to Jev
- which answer counts as a problem (so the summary's "issues found" number makes sense)
- optionally, a description of what "good" looks like — this is sent to Jev as extra context

Custom checks are saved in your browser (localStorage) so they're there next time. Nothing is sent anywhere except to Jev when you run a judgment.

## How the code is organised

```
app/
  page.tsx               Server component: reads the API key → passes demoMode to the client app
  layout.tsx             Page shell, fonts, metadata
  api/judge/route.ts     POST endpoint the browser calls; forwards to Jev (or the mock)
components/
  ClarityJudgeApp.tsx    All the state lives here; other components are presentational
  TextEditor.tsx         Textarea + word count + "Load sample"
  AxisSelector.tsx       Built-in + custom checks with toggles
  AxisCard.tsx           One toggle row
  CustomAxisBuilder.tsx  The "add a custom check" form
  ResultsPanel.tsx       Summary + result cards + loading / error / empty states
  AxisResultCard.tsx     Verdict, confidence bar, evidence, flag
  SummaryBanner.tsx      Totals and the one-line takeaway
  DemoModeBanner.tsx     Yellow "no key" banner
  ApiKeySettings.tsx     Masked API-key field (never displays the key)
  ApiKeySetupGuide.tsx   Collapsible .env.local setup steps
  icons.tsx              Tiny inline SVG icons
lib/
  builtInAxes.ts         The 7 default checks, defined as data — add a new one here
  jevClient.ts           The real TypeSafe API call (server-side only)
  mockJevClient.ts       Demo-mode stand-in: plausible, seeded, no network
  judge.ts               Glue: axes → questions → answers → results
  evidenceHeuristic.ts   Picks the most relevant sentence when Jev can't tell us
  results.ts             Summary maths, flagging, confidence bands
  storage.ts             localStorage helpers (custom axes, settings, browser key)
  redact.ts              Masks key-shaped strings in error output
scripts/
  check-secrets.mjs      Secret scanner (pre-commit + CI)
  pre-commit             Git hook installed by `npm install`
  sampleText.ts          The pre-loaded paragraph
types/
  axis.ts, jev.ts, results.ts
```

### How a judgment run works

1. `ClarityJudgeApp` collects the text and the switched-on checks and calls `runJudgment()` in `lib/judge.ts`.
2. Each check becomes one Jev question (`axisToQuestion`). Yes/No checks become `noul` questions; option checks become `choice` questions.
3. **Demo mode:** `mockJevClient.ts` answers locally. The mock leans toward "yes" when the text contains that check's keywords, so the sample paragraph gives sensible-looking results.
   **Live mode:** the browser POSTs to `/api/judge`, which calls `callJev()` in `lib/jevClient.ts`. That builds TypeSafe's wire format:

   ```json
   {
     "state": "<your text>",
     "model": "jev-latest",
     "questions": {
       "hedging": { "type": "noul", "instructions": "Does this text unnecessarily hedge…?", "criteria": { "true": "…", "false": "…" } },
       "tone":    { "type": "choice", "instructions": "What is the overall tone…?", "criteria": { "formal": "…", "casual": "…", "mixed": "…" } }
     }
   }
   ```

4. Answers are normalised into one shape (`JevAnswer`). A missing or malformed answer is marked `needsReview` instead of crashing the run.
5. Evidence: Jev returns verdicts, not text spans. In live mode the app makes one extra batched request asking Jev *which sentence* most influenced each answer (a `choice` question whose options are the numbered sentences). If that's unavailable, or in demo mode, a local keyword heuristic picks a likely sentence and labels it **approximate**.
6. `buildSummary()` counts passes, issues, and low-confidence flags, and writes the takeaway line.

### A note on confidence

For "pick one" questions Jev returns a confidence value directly. For Yes/No questions it returns only the probability of "yes", so the app derives confidence as **how far that probability is from a coin flip**: `max(p, 1 - p)`. A probability of 0.92 is 92% confident; 0.5 is 50% (genuinely unsure, always flagged at the default threshold).

## API keys and keeping them secret

There are two ways to give the app a key. Either way, the key is only ever sent to this app's own `/api/judge` route, which forwards it to TypeSafe.

1. **`.env.local` (recommended on your own machine).** Copy `.env.local.example`, paste the key, restart the dev server. The file is gitignored. The server reads it; the browser only learns a true/false "a key exists".
2. **In the browser.** Open the **API key** panel at the top of the page and paste the key into the password field. It's dots while you type, it's never displayed again after saving, and there's no "show" button — so it's safe to have the app open on a shared screen. It persists in that browser's localStorage and is sent as a request header. A browser key overrides the server key. Anyone using the same browser profile could read localStorage, so on a shared computer prefer option 1. **Remove key from this browser** wipes it.

### Guard rails against leaking a key

- **Pre-commit hook.** `npm install` installs `scripts/pre-commit` into `.git/hooks`. It runs `scripts/check-secrets.mjs --staged`, which blocks the commit if any *added* line looks like a credential (TypeSafe `apikey_…`, OpenAI/GitHub/AWS/Slack tokens, private-key blocks, or `TYPESAFE_API_KEY=` with a real value) or if any `.env*` file other than `.env.local.example` is staged. Findings are printed masked, never in full.
- **CI.** `.github/workflows/ci.yml` runs the same scanner over every tracked file, then lint, typecheck, tests, and build, on every push and pull request.
- **Manual scan.** `npm run check:secrets` at any time.
- **Redaction.** Error messages shown in the UI pass through `lib/redact.ts`, which masks anything key-shaped, so even a misbehaving upstream error can't put the key on screen. Nothing on the server logs the key.
- **`.gitignore`** already covers `.env*`, with an explicit exception for `.env.local.example`.

If a key does slip out somewhere (a screenshot, a pasted chat), rotate it at typesafe.ai and update `.env.local`.

## Errors you might see

| Message | What it means |
|---|---|
| *You've hit the API rate limit, try again in a moment.* | TypeSafe returned HTTP 429. Wait a few seconds and press **Retry**. |
| *TypeSafe rejected the API key.* | HTTP 401. Check the key you saved in the browser, or `.env.local` (then restart the dev server). |
| *Your TypeSafe organization has no API credits.* | HTTP 402. The key is valid but the account has no balance. Add credits at console.typesafe.ai/settings/billing. |
| *TypeSafe is overloaded right now.* | HTTP 529/503. Retry shortly. |
| *Needs review* on a single card | Jev's answer for that check was missing or malformed. The rest of the run is fine. |

Every error box has a **Retry** button and a "Raw error details" section with the exact response, so nothing fails silently.

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # production build
npm start          # serve the production build
npm test           # unit tests (vitest) for the lib/ helpers and the API route
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run check:secrets  # scan tracked files for anything that looks like a credential
```

## Extending it

- **New built-in check:** add an object to `lib/builtInAxes.ts`. That's it — the UI, request building, and summary all read from that list.
- **Use the official SDK instead of `fetch`:** TypeSafe ships `@typesafe-ai/sdk`. `lib/jevClient.ts` is the only file that would change.
- **Deploy:** it's a standard Next.js app. On Vercel (or anywhere else), set the `TYPESAFE_API_KEY` environment variable and deploy.
