import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        background: "#FAFAFA",
        foreground: "#0A0A0A",
        brand: {
          green: "#00D964",
          red: "#FF3B30",
          dark: "#0A0A0A",
          light: "#FAFAFA",
          border: "#EEEEEE",
        },
      },
      borderRadius: {
        '2xl': '16px',
      },
      boxShadow: {
        'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
        'premium-hover': '0 30px 60px -15px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
export default config;
