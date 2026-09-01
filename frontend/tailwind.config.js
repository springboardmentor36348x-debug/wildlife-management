/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#0f2b1d",
          900: "#123a25",
          800: "#16472e",
          700: "#1c5c3a",
          600: "#237548",
          500: "#2f9159",
          400: "#4bb377",
          100: "#e3f3e8",
          50: "#f2f9f4",
        },
        wild: {
          950: "#0f2b1d",
          900: "#123a25",
          800: "#16472e",
          700: "#1c5c3a",
          600: "#237548",
          500: "#2f9159",
          400: "#4bb377",
          100: "#e3f3e8",
          50: "#f2f9f4",
        },
        surface: {
          DEFAULT: "#f8faf8",
          border: "#e2e8e2",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 44, 28, 0.06), 0 1px 3px 0 rgba(16, 44, 28, 0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};