import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A", // Very dark black/graphite
        foreground: "#E5E5E5", // Stark off-white
        primary: "#0A0A0A",
        secondary: "#141414", // Slightly lighter for panels
        accent: "#FF3300", // Safety Orange
        success: "#00FF66", // Neon Green
        warning: "#FFB300", // Construction Yellow
        danger: "#FF0033", // Stark Red
        muted: "#737373", // Utility Gray
        border: "#333333" // Sharp borders
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Roboto Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(255, 51, 0, 1)', // Harsh brutalist shadow
        'neo-sm': '2px 2px 0px 0px rgba(255, 51, 0, 1)',
      }
    },
  },
  plugins: [],
};
export default config;
