import type { Telemetry } from "@/types/results";

type Props = { telemetry: Telemetry | null; running: boolean };

/** Header readout of the last run: model, latency, tokens. Reads like an instrument. */
export function StatusReadout({ telemetry, running }: Props) {
  const cells: { label: string; value: string }[] = running
    ? [
        { label: "model", value: telemetry?.model ?? "—" },
        { label: "latency", value: "…" },
        { label: "tokens", value: "…" },
      ]
    : telemetry
      ? [
          { label: "model", value: telemetry.model },
          { label: "latency", value: `${telemetry.latencyMs} ms` },
          { label: "tokens", value: telemetry.inputTokens !== undefined ? telemetry.inputTokens.toLocaleString() : "—" },
        ]
      : [
          { label: "model", value: "—" },
          { label: "latency", value: "—" },
          { label: "tokens", value: "—" },
        ];

  return (
    <dl className="hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] md:flex" aria-label="Last run">
      {cells.map((cell) => (
        <div key={cell.label} className="flex items-baseline gap-1.5">
          <dt className="text-muted">{cell.label}</dt>
          <dd className={`tabular-nums ${running ? "text-pink" : "text-ink-2"}`}>{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}
