import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AudioLines, CircleHelp, Eraser, Eye, EyeOff, ListTodo, Minus, Plus, type LucideIcon } from "lucide-react";
import { BUILT_IN_AXES } from "@/lib/builtInAxes";
import { Heading } from "@/components/ui";
import { pageMetadata } from "@/lib/social";

export const metadata: Metadata = pageMetadata("checks");

const icons: Record<string, LucideIcon> = {
  hedging: CircleHelp,
  em_dashes: Minus,
  clarity: Eye,
  filler: Eraser,
  tone: AudioLines,
  passive_voice: EyeOff,
  actionability: ListTodo,
};

/** The built-in checks, as data. Everything here comes from lib/builtInAxes.ts. */
export default function ChecksPage() {
  const yesNo = BUILT_IN_AXES.filter((a) => a.kind === "yes_no");
  const choice = BUILT_IN_AXES.filter((a) => a.kind === "choice");
  return (
    <div className="workspace compact-lab">
      <Heading
        title={
          <>
            Seven questions, <span>not one score.</span>
          </>
        }
        description="Each built-in check is one closed question for Jev. Yes/No checks come back as a probability; option checks as a pick with a probability per option. Add your own from the judge."
      >
        <Link href="/" className="button">
          Open the judge <ArrowRight size={14} />
        </Link>
      </Heading>

      <div className="section-heading">
        <h2>
          Yes / No <span className="count">{yesNo.length}</span>
        </h2>
        <p>Jev returns the probability that the answer is yes. The check decides which answer counts as a problem.</p>
      </div>
      <div className="card-grid">
        {yesNo.map((axis) => {
          const Icon = icons[axis.id] ?? CircleHelp;
          if (axis.kind !== "yes_no") return null;
          return (
            <article className="ref-card" key={axis.id}>
              <div className="ref-card-top">
                <Icon size={20} strokeWidth={1.5} />
                <span className="count">y/n</span>
              </div>
              <h3>{axis.name}</h3>
              <p>{axis.description}</p>
              <p className="asked">
                <b>Asks:</b> {axis.question}
              </p>
              <div className="ref-card-flow">
                Yes → <b>{axis.yesLabel ?? "Yes"}</b>
                {axis.issueWhen ? " (issue)" : " (pass)"}
                <br />
                No → <b>{axis.noLabel ?? "No"}</b>
                {axis.issueWhen ? " (pass)" : " (issue)"}
              </div>
            </article>
          );
        })}
      </div>

      <div className="section-heading">
        <h2>
          Pick one <span className="count">{choice.length}</span>
        </h2>
        <p>Jev chooses one option and returns a probability for every option plus a confidence in the pick.</p>
      </div>
      <div className="card-grid">
        {choice.map((axis) => {
          const Icon = icons[axis.id] ?? CircleHelp;
          if (axis.kind !== "choice") return null;
          return (
            <article className="ref-card" key={axis.id}>
              <div className="ref-card-top">
                <Icon size={20} strokeWidth={1.5} />
                <span className="count">pick</span>
              </div>
              <h3>{axis.name}</h3>
              <p>{axis.description}</p>
              <p className="asked">
                <b>Asks:</b> {axis.question}
              </p>
              <div className="ref-card-flow">
                {axis.options.map((option) => (
                  <span key={option.value}>
                    <b>{option.label}</b>
                    {axis.issueOptions.includes(option.value) ? " (issue)" : " (pass)"}
                    <br />
                  </span>
                ))}
              </div>
            </article>
          );
        })}
        <article className="ref-card" style={{ borderStyle: "dashed" }}>
          <div className="ref-card-top">
            <Plus size={20} strokeWidth={1.5} />
            <span className="count">yours</span>
          </div>
          <h3>Custom checks</h3>
          <p>
            Write your own question, choose Yes/No or a list of options, and say which answer counts as a problem. They&apos;re saved in this browser and run
            alongside the built-ins.
          </p>
          <div className="ref-card-flow">
            <Link href="/" className="button quiet small" style={{ marginLeft: -6 }}>
              Add one in the judge <ArrowRight size={12} />
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
