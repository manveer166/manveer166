import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08070c",
        panel: "#13111a",
        panel2: "#1a1722",
        edge: "#2a2434",
        ink: "#f4ecff",
        muted: "#9b91ad",
        ember: "#ff7a45",
        ember2: "#ffb14a",
        spark: "#ff4d8d",
        violet: "#8b5cf6",
        sky: "#6cd4ff",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "ui-serif", "Georgia", "serif"],
      },
      animation: {
        flicker: "flicker 3s ease-in-out infinite",
        pulse2: "pulse2 1.6s ease-in-out infinite",
        sparkle: "sparkle 2.4s ease-in-out infinite",
        rise: "rise 6s linear infinite",
        breath: "breath 4.5s ease-in-out infinite",
        slow_spin: "slow_spin 18s linear infinite",
      },
      keyframes: {
        flicker: {
          "0%,100%": { transform: "scale(1) rotate(-1deg)", opacity: "1" },
          "50%": { transform: "scale(1.06) rotate(1deg)", opacity: ".92" },
        },
        pulse2: {
          "0%,100%": { transform: "scale(1)", opacity: ".9" },
          "50%": { transform: "scale(1.18)", opacity: "1" },
        },
        sparkle: {
          "0%,100%": { opacity: "0", transform: "scale(.4)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        rise: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "20%": { opacity: ".8" },
          "100%": { transform: "translateY(-180px)", opacity: "0" },
        },
        breath: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        slow_spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
