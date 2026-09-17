import type { DeployTarget } from "@/lib/env";

type Props = { deployTarget: DeployTarget };

const preClass = "mt-1 overflow-x-auto border border-line bg-bg px-3 py-2 font-mono text-xs text-ink";
const codeClass = "font-mono text-ink";

/** Instructions for setting the server-side key, tailored to where the app is running. */
export function ApiKeySetupGuide({ deployTarget }: Props) {
  const title =
    deployTarget === "local" ? "Or set it in .env.local" : deployTarget === "vercel" ? "Or set it on Vercel" : "Or set it on the server";

  return (
    <details className="group border border-line text-sm">
      <summary className="cursor-pointer select-none px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 hover:text-ink">
        {title}
      </summary>
      <div className="space-y-3 border-t border-line px-3 py-3 text-ink-2">
        <p>
          Get a TypeSafe API key at{" "}
          <a href="https://typesafe.ai" target="_blank" rel="noreferrer" className="text-pink underline decoration-pink/50 underline-offset-2 hover:decoration-pink">
            typesafe.ai
          </a>
          , then:
        </p>

        {deployTarget === "local" && (
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Copy the example env file:
              <pre className={preClass}>cp .env.local.example .env.local</pre>
            </li>
            <li>
              Open <code className={codeClass}>.env.local</code> and paste your key:
              <pre className={preClass}>TYPESAFE_API_KEY=your_key_here</pre>
            </li>
            <li>
              Restart the dev server (<code className={codeClass}>pnpm dev</code>).
            </li>
          </ol>
        )}

        {deployTarget === "vercel" && (
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              In the Vercel dashboard, open this project → <span className="text-ink">Settings → Environment Variables</span> and add{" "}
              <code className={codeClass}>TYPESAFE_API_KEY</code> for Production. Or from the repo:
              <pre className={preClass}>vercel env add TYPESAFE_API_KEY production</pre>
            </li>
            <li>
              Redeploy so the new variable is picked up:
              <pre className={preClass}>vercel --prod</pre>
            </li>
          </ol>
        )}

        {deployTarget === "hosted" && (
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Set <code className={codeClass}>TYPESAFE_API_KEY</code> in your host&apos;s environment settings.
            </li>
            <li>Restart or redeploy the app so it picks up the variable.</li>
          </ol>
        )}

        {deployTarget !== "local" && (
          <p className="border border-pink/40 bg-pink/5 px-3 py-2 text-xs leading-relaxed">
            A server key is shared by everyone who can open this URL, and every run spends its credits. For a public demo,
            leave the server key unset and let each visitor paste their own key above.
          </p>
        )}

        <p className="font-mono text-[11px] text-muted">
          The key stays on the server. The browser only talks to this app&apos;s own /api/judge route.
        </p>
      </div>
    </details>
  );
}
