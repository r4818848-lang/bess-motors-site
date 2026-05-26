import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bm: {
          black: "#0a0a0a",
          graphite: "#141414",
          card: "#1a1a1a",
          border: "#2a2a2a",
          red: "#e10600",
          "red-glow": "#ff1a1a",
          silver: "#c0c0c0",
          muted: "#888888",
        },
      },
      fontFamily: {
        // Orbitron has no Cyrillic subset → Cyrillic headings rendered as tofu.
        // Use Inter for display to ensure RU/UK text is readable everywhere.
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(225, 6, 0, 0.4), 0 0 40px rgba(225, 6, 0, 0.15)",
        "neon-sm": "0 0 10px rgba(225, 6, 0, 0.35)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(225,6,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(225,6,0,0.03) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(ellipse at 50% 0%, rgba(225, 6, 0, 0.15) 0%, transparent 60%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "scan-line": "scan-line 3s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
