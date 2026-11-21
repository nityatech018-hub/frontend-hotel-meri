/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#061830",
          deep: "#030d1c",
          soft: "#0b2242",
          foreground: "#f8f6f0",
        },
        gold: {
          DEFAULT: "#d4a84c",
          foreground: "#1a1202",
        },
        champagne: "#f8ebcc",
        ivory: "#faf8f5",
        success: {
          DEFAULT: "#22c55e",
          soft: "#dcfce7",
        },
        warning: {
          DEFAULT: "#f59e0b",
          soft: "#fef3c7",
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "'Times New Roman'", "serif"],
        sans: ["'Jost'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(212, 168, 76, 0.08)",
        gold: "0 0 25px rgba(212, 168, 76, 0.35)",
        lift: "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px -5px rgba(212, 168, 76, 0.25)",
      },
    },
  },
  plugins: [],
};
