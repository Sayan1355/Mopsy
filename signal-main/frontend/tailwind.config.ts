import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0D12",
        foreground: "#E8E8E8",
        primary: "#E8E8E8",
        secondary: "#161922", // slightly lighter than bg for panels
        accent: "#D9FF3F", // neon lime/yellow
        warning: "#FFB84D",
        danger: "#FF4D4D",
        muted: "#545864",
        border: "#2A2D3A"
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'], // Body
        display: ['"Space Grotesk"', 'sans-serif'], // Headings
        mono: ['"JetBrains Mono"', 'monospace'], // Numbers/Data
      },
      boxShadow: {
        'none': 'none',
      },
      borderRadius: {
        'sm': '2px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px', // Never above 10px
        'xl': '10px',
        '2xl': '10px',
        '3xl': '10px',
        'full': '10px' // cap rounding
      }
    },
  },
  plugins: [],
};
export default config;
