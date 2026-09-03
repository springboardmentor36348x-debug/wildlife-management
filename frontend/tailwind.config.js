/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          50: '#f2f8f5',
          100: '#e1eff6',
          200: '#c5e2d6',
          300: '#9acbb5',
          400: '#69ab8f',
          500: '#468e71',
          600: '#347259',
          700: '#2b5c49',
          800: '#244b3c',
          900: '#1e3e33',
          950: '#10231d',
        }
      }
    },
  },
  plugins: [],
}
