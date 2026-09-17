export function ApiKeySetupGuide() {
  return (
    <details className="group border border-line text-sm">
      <summary className="cursor-pointer select-none px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 hover:text-ink">
        Or set it in .env.local
      </summary>
      <div className="space-y-3 border-t border-line px-3 py-3 text-ink-2">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Get a TypeSafe API key at{" "}
            <a href="https://typesafe.ai" target="_blank" rel="noreferrer" className="text-pink underline decoration-pink/50 underline-offset-2 hover:decoration-pink">
              typesafe.ai
            </a>
            .
          </li>
          <li>
            Copy the example env file:
            <pre className="mt-1 overflow-x-auto border border-line bg-bg px-3 py-2 font-mono text-xs text-ink">cp .env.local.example .env.local</pre>
          </li>
          <li>
            Open <code className="font-mono text-ink">.env.local</code> and paste your key:
            <pre className="mt-1 overflow-x-auto border border-line bg-bg px-3 py-2 font-mono text-xs text-ink">TYPESAFE_API_KEY=your_key_here</pre>
          </li>
          <li>
            Restart the dev server (<code className="font-mono text-ink">npm run dev</code>).
          </li>
        </ol>
        <p className="font-mono text-[11px] text-muted">
          The key stays on the server. The browser only talks to this app&apos;s own /api/judge route.
        </p>
      </div>
    </details>
  );
}
