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
        background: "#F9FAFB", // Very soft gray/off-white
        foreground: "#111827", // Dark charcoal for text
        primary: "#FFFFFF", // Pure white for cards
        secondary: "#F3F4F6", // Light gray for subtle backgrounds
        accent: "#0EA5E9", // Bright, friendly blue (like the screenshot)
        success: "#10B981", // Crisp green
        warning: "#FBBF24", // Cheerful yellow
        danger: "#EF4444", // Rose/Red
        muted: "#6B7280", // Medium gray for secondary text
        border: "#E5E7EB" // Soft border color
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'floating': '0 20px 40px -20px rgba(0,0,0,0.15)',
        'button': '0 4px 14px 0 rgba(14, 165, 233, 0.39)',
      }
    },
  },
  plugins: [],
};
export default config;
