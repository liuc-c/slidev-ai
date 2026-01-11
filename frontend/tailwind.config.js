/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#0d59f2",
        "background-light": "#f5f6f8",
        "background-dark": "#0a0f18",
        "panel-dark": "#101623",
        "border-dark": "#314368"
      },
      fontFamily: {
        "display": ["Space Grotesk", "Noto Sans SC", "sans-serif"],
        "mono": ["Fira Code", "monospace"]
      }
    },
  },
  plugins: [],
}
