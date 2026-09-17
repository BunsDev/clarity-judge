export function DemoModeBanner() {
  return (
    <div role="status" className="flex items-start gap-3 border border-pink bg-pink/10 px-3 py-2.5 text-sm text-ink">
      <span className="mt-0.5 shrink-0 bg-pink px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#1e1e1e]">
        Demo mode
      </span>
      <p className="text-ink-2">
        No API key set. Showing simulated results. Everything works, but the verdicts are made up. Add a key below to
        get real judgments from Jev.
      </p>
    </div>
  );
}
