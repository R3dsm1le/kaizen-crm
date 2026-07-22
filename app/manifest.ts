import type { MetadataRoute } from "next";

/** PWA manifest — lets phones and desktops install Kaizen like a native app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kaizen CRM",
    short_name: "Kaizen",
    description: "A calm, AI-assisted CRM for solo consultants.",
    // Through /enter so an installed PWA always opens the app itself,
    // never the first-visit chooser page.
    start_url: "/enter",
    display: "standalone",
    background_color: "#fcfcfb",
    theme_color: "#4a54dd",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
