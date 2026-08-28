import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#11100d",
        "muted-ink": "#4f4a42",
        paper: "#f4eedf",
        "field-paper": "#fffdf7",
        "acid-yellow": "#f5d800",
        "electric-blue": "#1539d6",
        "signal-coral": "#f05037",
        "evidence-mint": "#cbe9d9",
        "error-red": "#951c13",
        white: "#ffffff",
      },
      fontFamily: {
        display: ['"League Gothic AT"', '"Arial Narrow"', "Impact", "sans-serif"],
        headline: ['"League Gothic AT"', '"Arial Narrow"', "Impact", "sans-serif"],
        title: ['"League Gothic AT"', '"Arial Narrow"', "Impact", "sans-serif"],
        sans: ['"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
        mono: ['"SFMono-Regular"', "Consolas", '"Liberation Mono"', "monospace"],
      },
      boxShadow: {
        "action-lift": "6px 7px 0 #11100d",
        "ticket-lift": "8px 9px 0 #11100d",
        "selected-lift": "5px 5px 0 #11100d",
        "card-lift": "4px 5px 0 #11100d",
      },
      borderRadius: {
        none: "0px",
      },
    },
  },
  plugins: [typography],
} satisfies Config;
