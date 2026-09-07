/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f2f7f2",
          100: "#dfeee0",
          500: "#2f7a3c",
          600: "#256330",
          700: "#1c4d25",
          900: "#0f2a14",
        },
      },
    },
  },
  plugins: [],
}
