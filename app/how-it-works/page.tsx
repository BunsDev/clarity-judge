import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound, Sigma } from "lucide-react";
import { Heading } from "@/components/ui";
import { pageMetadata } from "@/lib/social";

export const metadata: Metadata = pageMetadata("how-it-works");

const steps = [
  {
    title: "You pick the checks",
    body: "Each check is one specific question with a fixed answer shape. Seven ship with the app; you can add your own.",
  },
  {
    title: "Checks become typed questions",
    body: "Yes/No checks become noul questions, option checks become choice questions. The text goes along as Jev's state.",
  },
  {
    title: "One batched verdict request",
    body: "The browser posts to this app's own /api/judge route, which forwards to Jev with the server key or the key saved in your browser.",
  },
  {
    title: "Answers are normalised",
    body: "A probability per Yes/No, a pick plus per-option probabilities per choice. Anything missing or malformed becomes Needs review, never a pass.",
  },
  {
    title: "Evidence is picked",
    body: "In live mode a second, optional request asks Jev which sentence drove each answer. If that fails, or in demo mode, a local keyword match picks one and labels it approximate.",
  },
  {
    title: "The summary is built",
    body: "Passes, issues, and low-confidence flags are counted and the takeaway line is written. Moving the threshold recomputes flags locally, with no new request.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="workspace compact-lab">
      <Heading
        title={
          <>
            Text in, <span>verdicts back.</span>
          </>
        }
        description="Jev doesn't write anything. It reads your text once and answers every check in the same request with structured values and probabilities."
      >
        <Link href="/" className="button">
          Open the judge <ArrowRight size={14} />
        </Link>
      </Heading>

      <ol className="steps">
        {steps.map((step, i) => (
          <li key={step.title}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="two-up">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <Sigma size={18} strokeWidth={1.5} />
              <h2>Confidence</h2>
            </div>
          </div>
          <div className="panel-content prose">
            <p>
              For <b>pick one</b> checks Jev returns a confidence value directly. For <b>Yes/No</b> checks it returns only the probability of yes, so the app
              derives confidence as how far that probability sits from a coin flip:
            </p>
            <pre>confidence = max(p, 1 − p)</pre>
            <p>
              A probability of 0.92 is 92% confident. A probability of 0.5 is 50%, genuinely unsure, and always flagged at the default threshold of 70%.
              Confidence is Jev&apos;s probability for its own answer, not a measure of whether that answer is right.
            </p>
            <p>
              The topbar shows latency measured in the browser and the verdict request&apos;s input tokens as Jev reported them. The optional evidence request
              is not counted, so treat it as a readout, not a bill.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <KeyRound size={18} strokeWidth={1.5} />
              <h2>Keys and privacy</h2>
            </div>
          </div>
          <div className="panel-content prose">
            <p>
              The server key is read only in the server layout and API route and reaches the browser as a single true/false. A key you save in the browser
              lives in localStorage, is masked while you type, is never displayed again, and travels only as a header to this app&apos;s own route.
            </p>
            <p>
              Live runs send your text to TypeSafe. Demo mode sends nothing anywhere: the answers are seeded from the text and the question, so the same
              input always gives the same simulated result.
            </p>
            <p>
              Error messages pass through a redaction step that masks anything key-shaped, and a pre-commit hook plus CI scan the repo for credentials.
              Those controls reduce risk; nothing here is an absolute guarantee.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
