import { JudgeWorkspace } from "@/components/JudgeWorkspace";
import { pageMetadata } from "@/lib/social";

export const metadata = pageMetadata("home");

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <JudgeWorkspace />;
}
