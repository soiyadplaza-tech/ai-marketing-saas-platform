import type { MetadataRoute } from "next";

// Web App Manifest — makes FOYSAL IT installable on a phone ("Add to Home
// Screen"), which is the practical path to an app-like experience without a
// separate Play Store build.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FOYSAL IT — AI Lead Intelligence",
    short_name: "FOYSAL IT",
    description: "AI-powered lead intelligence, digital audit, outreach automation and sales management.",
    start_url: "/",
    display: "standalone",
    background_color: "#180420",
    theme_color: "#4f46e5",
    orientation: "portrait",
    icons: [
      { src: "/images/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/images/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
