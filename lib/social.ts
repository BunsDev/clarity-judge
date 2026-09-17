import type { Metadata } from "next";

/**
 * Per-page titles and descriptions, shared by the <head> metadata and the
 * generated social preview images in lib/social-image.tsx.
 */

export const SITE_URL = "https://clarity-judge.vercel.app";

export const SOCIAL_PAGES = {
  home: {
    path: "/",
    title: "Decisions, not scores.",
    description: "Separate, named writing checks. Each one is a closed question for Jev, answered with its own verdict, confidence, and evidence.",
    category: "WRITING · JUDGED BY TYPESAFE JEV",
    panel: "Verdicts",
    rows: [
      ["Hedging language", "Issue", "100%"],
      ["Clarity up front", "Pass", "93%"],
      ["Tone consistency", "Flag", "62%"],
    ],
    result: "3 of 7 checks passed",
  },
  checks: {
    path: "/checks",
    title: "Seven questions, not one score.",
    description: "Every built-in check is one closed question for Jev, with a fixed answer shape and a declared problem answer. Add your own.",
    category: "REFERENCE · CHECKS",
    panel: "Built-in checks",
    rows: [
      ["Hedging language", "y/n", "yes = issue"],
      ["Tone consistency", "pick", "mixed = issue"],
      ["Actionability", "pick", "vague = issue"],
    ],
    result: "7 built-in · custom welcome",
  },
  "how-it-works": {
    path: "/how-it-works",
    title: "Text in, verdicts back.",
    description: "Checks become typed questions, one batched request goes to Jev, answers come back as probabilities, and evidence is picked.",
    category: "REFERENCE · HOW IT WORKS",
    panel: "Pipeline",
    rows: [
      ["Checks → typed questions", "01", ""],
      ["One batched verdict request", "02", ""],
      ["Probabilities → verdicts", "03", ""],
    ],
    result: "confidence = max(p, 1 − p)",
  },
} as const;

export type SocialPage = keyof typeof SOCIAL_PAGES;

export function pageMetadata(key: SocialPage): Metadata {
  const p = SOCIAL_PAGES[key];
  const image = `${p.path === "/" ? "" : p.path}/opengraph-image`;
  const title = key === "home" ? "Clarity Judge" : p.title;
  return {
    title: key === "home" ? { absolute: "Clarity Judge · Decisions, not scores." } : title,
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: {
      title: key === "home" ? "Clarity Judge" : `${p.title} · Clarity Judge`,
      description: p.description,
      url: p.path,
      siteName: "Clarity Judge",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: `Clarity Judge — ${p.title} ${p.description}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: key === "home" ? "Clarity Judge" : `${p.title} · Clarity Judge`,
      description: p.description,
      images: [image],
    },
  };
}
