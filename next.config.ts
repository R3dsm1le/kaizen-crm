import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
