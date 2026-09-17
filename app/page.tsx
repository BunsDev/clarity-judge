import { ClarityJudgeApp } from "@/components/ClarityJudgeApp";

// Check for the API key on every request rather than once at build time, so
// adding a key to a deployed app takes effect without a rebuild.
export const dynamic = "force-dynamic";

/**
 * Server component. It's the only place that looks at the server's API key,
 * and it only passes a boolean to the browser — never the key itself.
 */
export default function HomePage() {
  const serverHasKey = Boolean(process.env.TYPESAFE_API_KEY?.trim());
  return <ClarityJudgeApp serverHasKey={serverHasKey} />;
}
