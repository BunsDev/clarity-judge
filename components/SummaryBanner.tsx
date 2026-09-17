import type { Summary } from "@/types/results";
import { CheckIcon, FlagIcon, WarningIcon } from "./icons";

type Props = { summary: Summary; demoMode: boolean };

export function SummaryBanner({ summary, demoMode }: Props) {
  const allClear = summary.issues === 0 && summary.flagged === 0 && summary.total > 0;

  return (
    <div
      className={`rounded-lg border p-4 ${
        allClear ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-sm font-medium leading-snug text-zinc-900">{summary.takeaway}</p>
      <dl className="mt-3 flex flex-wrap gap-2 text-xs">
        <Stat label="checked" value={summary.total} />
        <Stat label="passed" value={summary.passed} icon={<CheckIcon className="h-3.5 w-3.5" />} tone="good" />
        <Stat label="issues found" value={summary.issues} icon={<WarningIcon className="h-3.5 w-3.5" />} tone={summary.issues > 0 ? "bad" : "neutral"} />
        <Stat label="low confidence" value={summary.flagged} icon={<FlagIcon className="h-3.5 w-3.5" />} tone={summary.flagged > 0 ? "warn" : "neutral"} />
      </dl>
      {demoMode && <p className="mt-2 text-[11px] text-zinc-500">Simulated results (demo mode).</p>}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: "neutral" | "good" | "bad" | "warn";
}) {
  const tones = {
    neutral: "border-zinc-200 bg-zinc-50 text-zinc-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-800",
    bad: "border-rose-200 bg-rose-50 text-rose-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${tones[tone]}`}>
      {icon}
      <dd className="font-semibold">{value}</dd>
      <dt>{label}</dt>
    </div>
  );
}
