import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./sanity/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0e0e0e",
          soft: "#1a1a1a",
        },
        paper: {
          DEFAULT: "#fafaf8",
          warm: "#f3f1ec",
        },
        stone: {
          subtle: "#8a8a85",
        },
      },
      letterSpacing: {
        widest: "0.3em",
      },
      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
      animation: {
        "fade-in": "fadeIn 700ms cubic-bezier(0.25, 1, 0.5, 1) both",
        "fade-up": "fadeUp 800ms cubic-bezier(0.25, 1, 0.5, 1) both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
