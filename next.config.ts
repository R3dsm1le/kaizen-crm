import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output powers the desktop (Electron) build; harmless on Vercel.
  output: "standalone",
  // Migration SQL is read from disk at runtime (setup route + the lazy
  // ensureMigrated on app pages) — ship it with every serverless function.
  outputFileTracingIncludes: {
    "/**": ["./db/migrations/**/*"],
  },
  // Never ship local runtime config (contains DB credentials) in the bundle.
  outputFileTracingExcludes: {
    "*": ["./.kaizen/**", ".kaizen/**", "**/.kaizen/**"],
  },
};

export default nextConfig;
