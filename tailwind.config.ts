import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        linen: "#F7F5EF",
        sage: {
          50: "#F1F5EE",
          100: "#DFE9D6",
          300: "#AFC79B",
          500: "#5E7A4A",
          700: "#3A4E2C",
          900: "#212D18",
        },
        chalk: "#FFFFFF",
        citrus: "#E7A93C",
        ink: "#22281F",
        slate: "#5A625A",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
