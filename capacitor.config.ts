import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android wrapper: a thin native shell that loads your deployed Kaizen
 * instance. Set KAIZEN_APP_URL (or edit serverUrl below) to your
 * deployment before building — the CI workflow does this for you.
 */
const serverUrl = process.env.KAIZEN_APP_URL || "https://YOUR-DEPLOYMENT.vercel.app";

const config: CapacitorConfig = {
  appId: "com.kaizen.crm",
  appName: "Kaizen CRM",
  webDir: "capacitor-shell",
  server: {
    url: serverUrl,
    androidScheme: "https",
  },
};

export default config;
