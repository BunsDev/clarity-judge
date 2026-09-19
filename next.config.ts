import type { NextConfig } from "next";

/** Must match SITE_URL in lib/social.ts, which writes the canonical <link>. */
const CANONICAL_ORIGIN = (process.env.SITE_URL || "https://judge.jev.works").replace(/\/+$/, "");
const CANONICAL_HOST = CANONICAL_ORIGIN.replace(/^https?:\/\//, "");

/**
 * Hosts that serve this app but are not its home. Each redirects permanently to
 * the canonical origin, keeping path and query, so one address accumulates
 * search ranking and shared links never show a Vercel hostname.
 *
 * Listed exactly, never by pattern: per-deployment URLs such as
 * clarity-judge-<hash>-0xbuns.vercel.app and branch previews such as
 * clarity-judge-git-<branch>-0xbuns.vercel.app must keep serving their own
 * build, or a deployment could not be inspected before being promoted.
 */
const ALIAS_HOSTS = ["clarity-judge.vercel.app", "clarity-judge-0xbuns.vercel.app", "clarity-judge-git-main-0xbuns.vercel.app"];

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this folder even if a parent directory has its own lockfile.
  turbopack: { root: __dirname },

  async redirects() {
    return ALIAS_HOSTS.filter((host) => host !== CANONICAL_HOST).map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${CANONICAL_ORIGIN}/:path*`,
      // 308: permanent, and preserves the method so a POST to /api/judge still works.
      permanent: true,
    }));
  },
};

export default nextConfig;
