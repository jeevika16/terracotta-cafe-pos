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
        cafe: {
          primary: "#A63D26",
          accent: "#C65F43",
          peach: "#FFF0E7",
          cream: "#FFF9F5",
          surface: "#FFFDFB",
          text: "#352B28",
          border: "#F0E4DD",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "serif"],
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
      boxShadow: {
        'cafe-sm': '0 2px 8px -2px rgba(166, 61, 38, 0.08)',
        'cafe-md': '0 6px 20px -4px rgba(166, 61, 38, 0.12)',
        'cafe-lg': '0 12px 32px -6px rgba(166, 61, 38, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
