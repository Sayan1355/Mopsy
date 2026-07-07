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
        background: "#030712", // Very dark slate/blue
        foreground: "#F9FAFB",
        primary: "#111827",
        secondary: "#1F2937",
        accent: "#3B82F6", // Vivid blue
        "accent-glow": "rgba(59, 130, 246, 0.5)",
        success: "#10B981", // Emerald
        warning: "#F59E0B", // Amber
        danger: "#EF4444", // Rose
        muted: "#6B7280",
        border: "rgba(255,255,255,0.08)"
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af633 0deg, #a853ba33 180deg, #e92a6733 360deg)',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
      }
    },
  },
  plugins: [],
};
export default config;
