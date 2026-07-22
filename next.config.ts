import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output powers the desktop (Electron) build; harmless on Vercel.
  output: "standalone",
  // The setup route reads migration SQL from disk at runtime — make sure the
  // files ship inside the standalone bundle.
  outputFileTracingIncludes: {
    "/api/setup": ["./db/migrations/**/*"],
  },
  // Never ship local runtime config (contains DB credentials) in the bundle.
  outputFileTracingExcludes: {
    "*": ["./.kaizen/**", ".kaizen/**", "**/.kaizen/**"],
  },
};

export default nextConfig;
