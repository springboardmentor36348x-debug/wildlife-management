/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pine: { 900: "#0F241E", 700: "#16302A", 500: "#1E4038" },
        moss: { 600: "#4A7C59", 500: "#5B8266", 100: "#EAF0EA" },
        sand: { 100: "#F3EFE4", 200: "#EDE8D8", 300: "#E4DFCF" },
        bark: "#3A2E27",
        amber: { 500: "#C08552" },
        rust: { 500: "#B4442E" },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};