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
 * Applies the theme before first paint so there's no flash: the saved choice if
 * there is one, otherwise the system preference, otherwise dark. The toggle in
 * the header writes "light" or "dark" to localStorage.
 */
const themeScript = `(function(){try{var t=localStorage.getItem("clarity-judge:theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
