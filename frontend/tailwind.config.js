/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canopy: {
          50: "#f2f7f4",
          100: "#dcebe2",
          200: "#b8d7c5",
          300: "#8cbca4",
          400: "#5f9c81",
          500: "#417d64",
          600: "#2f634f",
          700: "#264f41",
          800: "#1e3f35",
          900: "#14342a",
          950: "#0b201a",
        },
        ochre: {
          400: "#d8a441",
          500: "#c08a2e",
          600: "#9c6c22",
        },
        bark: {
          50: "#f7f6f3",
          100: "#eeece5",
          800: "#3a352c",
          900: "#25221c",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      backgroundImage: {
        contour: "radial-gradient(circle at 1px 1px, rgba(20,52,42,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
}

