import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The setup route reads migration SQL from disk at runtime — make sure the
  // files ship inside the serverless bundle.
  outputFileTracingIncludes: {
    "/api/setup": ["./db/migrations/**/*"],
  },
  // Never ship local runtime config (contains DB credentials) in any bundle.
  outputFileTracingExcludes: {
    "*": ["./.kaizen/**", ".kaizen/**", "**/.kaizen/**"],
  },
};

export default nextConfig;
