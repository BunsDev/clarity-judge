export function ApiKeySetupGuide() {
  return (
    <details className="group rounded-lg border border-zinc-200 bg-white text-sm">
      <summary className="cursor-pointer select-none px-4 py-3 font-medium text-zinc-800 hover:bg-zinc-50">
        How to connect a real API key
      </summary>
      <div className="space-y-3 border-t border-zinc-200 px-4 py-4 text-zinc-700">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Get a TypeSafe API key at{" "}
            <a href="https://typesafe.ai" target="_blank" rel="noreferrer" className="text-indigo-700 underline">
              typesafe.ai
            </a>
            .
          </li>
          <li>
            In the project folder, copy the example env file:
            <pre className="mt-1 overflow-x-auto rounded bg-zinc-900 px-3 py-2 text-xs text-zinc-100">cp .env.local.example .env.local</pre>
          </li>
          <li>
            Open <code className="rounded bg-zinc-100 px-1">.env.local</code> and paste your key:
            <pre className="mt-1 overflow-x-auto rounded bg-zinc-900 px-3 py-2 text-xs text-zinc-100">TYPESAFE_API_KEY=your_key_here</pre>
          </li>
          <li>
            Restart the dev server (<code className="rounded bg-zinc-100 px-1">npm run dev</code>). This banner disappears when the key
            is picked up.
          </li>
        </ol>
        <p className="text-xs text-zinc-500">
          The key stays on the server. The browser only ever talks to this app&apos;s own <code>/api/judge</code> route.
        </p>
      </div>
    </details>
  );
}
