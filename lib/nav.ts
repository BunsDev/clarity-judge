import { Gavel, ListChecks, Route, type LucideIcon } from "lucide-react";

/** Pages in the sidebar. The judge is the workspace; the rest is reference. */
export type NavPage = { href: string; label: string; icon: LucideIcon; description: string };

export const navGroups: { id: string; label: string; pages: NavPage[] }[] = [
  {
    id: "workspace",
    label: "Workspace",
    pages: [{ href: "/", label: "Judge", icon: Gavel, description: "Run named checks against a piece of writing." }],
  },
  {
    id: "reference",
    label: "Reference",
    pages: [
      { href: "/checks", label: "Checks", icon: ListChecks, description: "The seven built-in checks and what each asks Jev." },
      { href: "/how-it-works", label: "How it works", icon: Route, description: "Text in, typed questions out, verdicts back." },
    ],
  },
];

export const navPages = navGroups.flatMap((group) => group.pages);

export const externalLinks = [
  { href: "https://jev.works", label: "TypeSafe playground" },
  { href: "https://docs.typesafe.ai", label: "Docs" },
];

export const GITHUB_URL = "https://github.com/BunsDev/clarity-judge";
