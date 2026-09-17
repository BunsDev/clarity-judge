import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this folder even if a parent directory has its own lockfile.
  turbopack: { root: __dirname },
};

export default nextConfig;
