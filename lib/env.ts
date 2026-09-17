/**
 * Where is this app running? Decided on the server and passed to the browser
 * as a plain string, so the UI can give the right instructions for setting
 * the server-side API key.
 *
 *   local  → `npm run dev` on your machine: use .env.local
 *   vercel → deployed on Vercel: use a project environment variable
 *   hosted → any other production host: use its environment settings
 */
export type DeployTarget = "local" | "vercel" | "hosted";

export function getDeployTarget(): DeployTarget {
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) return "vercel";
  if (process.env.NODE_ENV === "production") return "hosted";
  return "local";
}
