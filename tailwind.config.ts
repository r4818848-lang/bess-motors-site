import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bm: {
          black: "#0b0f14",
          graphite: "#11151c",
          surface: "#11151c",
          card: "#151922",
          border: "rgba(255,255,255,0.16)",
          red: "#e10600",
          "red-glow": "#ff625c",
          accent: "#ff625c",
          "red-hover": "#c90a05",
          "red-active": "#a80804",
          heading: "#f8fafc",
          copy: "#c9d1d9",
          label: "#aeb6c2",
          silver: "#c9d1d9",
          muted: "#9aa4b2",
        },
      },
      fontFamily: {
        display: ["var(--font-bess-display)", "var(--font-inter)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 8px 24px rgba(0, 0, 0, 0.35)",
        "neon-sm": "0 4px 12px rgba(0, 0, 0, 0.25)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.45)",
        card: "0 1px 0 rgba(255,255,255,0.04)",
      },
      borderRadius: {
        bm: "12px",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(ellipse at 50% 0%, rgba(225, 6, 0, 0.06) 0%, transparent 55%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "scan-line": "scan-line 3s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
