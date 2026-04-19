import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        panel: "#14171c",
        edge: "#22262d",
        ink: "#e6e8eb",
        muted: "#8a8f98",
        accent: "#7cc4ff",
        good: "#5ecf8a",
        warn: "#f0b65a",
        bad: "#ff6b6b",
      },
    },
  },
  plugins: [],
};

export default config;
