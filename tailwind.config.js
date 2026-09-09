/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#0d0d0f',
        'card-dark': '#161618',
        'card-hover': '#1a1a1c',
        'entrada': '#7ED957',
        'saida': '#FF6B6B',
        'diario': '#FF69B4',
        'economia': '#ADFF2F',
        'cartao': '#9D4EDD',
      },
      fontFamily: {
        'sans': ['system-ui', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
