import { socialImage } from "@/lib/social-image";

export const alt = "Clarity Judge — Decisions, not scores.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return socialImage("home");
}
