import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ember — stay close, every day",
    short_name: "Ember",
    description:
      "A live widget for couples. Daily prompts, photos, thumb kisses, and a flame you grow together.",
    start_url: "/",
    display: "standalone",
    background_color: "#08070c",
    theme_color: "#ff7a45",
    orientation: "portrait",
    categories: ["lifestyle", "social"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
