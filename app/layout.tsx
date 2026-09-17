import type { Metadata } from "next";
import { Host_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const host = Host_Grotesk({ variable: "--font-host", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jb", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Clarity Judge",
  description: "Multi-axis writing quality checker powered by TypeSafe's Jev model.",
};

/**
 * Applies the saved theme before first paint so there's no flash. Dark is the
 * default; the toggle in the header writes "light" or "dark" to localStorage.
 */
const themeScript = `(function(){try{var t=localStorage.getItem("clarity-judge:theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${host.variable} ${mono.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <main>{children}</main>
      </body>
    </html>
  );
}
