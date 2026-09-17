import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { getDeployTarget } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Clarity Judge", template: "%s · Clarity Judge" },
  description: "Multi-axis writing quality checker powered by TypeSafe's Jev model.",
};

// The shell needs to know whether a server key exists on every request, not
// once at build time, so adding a key to a deployment takes effect immediately.
export const dynamic = "force-dynamic";

/**
 * Applies the theme before first paint so there's no flash: the saved choice if
 * there is one, otherwise the system preference.
 */
const themeScript = `try{var t=localStorage.getItem("clarity-judge:theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The only place the server key is looked at, and only as a boolean.
  const serverHasKey = Boolean(process.env.TYPESAFE_API_KEY?.trim());
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Shell serverHasKey={serverHasKey} deployTarget={getDeployTarget()}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
