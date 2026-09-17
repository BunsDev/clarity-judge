import { WarningIcon } from "./icons";

export function DemoModeBanner() {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-semibold">Demo mode</span> — no API key set. Showing simulated results. Everything
        works, but the verdicts are made up. Add a key to get real judgments from Jev.
      </p>
    </div>
  );
}
