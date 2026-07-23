import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android wrapper: a thin native shell that loads your deployed Kaizen
 * instance in results-only mode (the `/m` entry sets that). Set
 * KAIZEN_APP_URL to your deployment before building — the CI workflow
 * does this for you.
 */
const base = (process.env.KAIZEN_APP_URL || "https://kaizen-crm-seven.vercel.app").replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "com.kaizen.crm",
  appName: "Kaizen CRM",
  webDir: "capacitor-shell",
  server: {
    // /m marks the device as a results-only client, then redirects home.
    url: `${base}/m`,
    androidScheme: "https",
  },
};

export default config;
