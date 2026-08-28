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
        ink: "#111111",
        "muted-ink": "#4a463e",
        paper: "#f3efe6",
        "field-paper": "#fbf9f4",
        "acid-yellow": "#f5c800",
        "electric-blue": "#0047ff",
        "signal-coral": "#e64323",
        "evidence-mint": "#28a745",
        "error-red": "#cc0000",
        white: "#ffffff",
      },
      fontFamily: {
        display: ['"League Gothic"', '"Bebas Neue"', 'Anton', 'Impact', 'sans-serif'],
        headline: ['"League Gothic"', '"Bebas Neue"', 'Anton', 'Impact', 'sans-serif'],
        title: ['"League Gothic"', '"Bebas Neue"', 'Anton', 'Impact', 'sans-serif'],
        sans: ['"Inter"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"Space Mono"', '"SFMono-Regular"', 'Menlo', 'Consolas', 'monospace'],
        serif: ['"Instrument Serif"', '"Georgia"', 'serif'],
      },
      boxShadow: {
        "action-lift": "4px 4px 0 #111111",
        "ticket-lift": "6px 6px 0 #111111",
        "selected-lift": "3px 3px 0 #111111",
        "card-lift": "4px 4px 0 #111111",
      },
      borderWidth: {
        '3': '3px',
      },
      borderRadius: {
        none: "0px",
      },
    },
  },
  plugins: [typography],
} satisfies Config;
