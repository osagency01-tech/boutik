import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14231B",
        cream: "#F7F8F4",
        primary: { DEFAULT: "#0E8A52", dark: "#0A6B40", soft: "#E3F2EA" },
        mango: { DEFAULT: "#F6B932", soft: "#FDF3DC" },
        terra: { DEFAULT: "#E2674A", soft: "#FBEAE5" },
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,35,27,.04), 0 8px 24px rgba(20,35,27,.06)",
        lift: "0 2px 4px rgba(20,35,27,.05), 0 16px 40px rgba(20,35,27,.12)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
