/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'verde-profundo': '#243D32',
        'negro-suave': '#171B18',
        'marfil-calido': '#F6F1E8',
        'blanco': '#FFFFFF',
        'dorado-suave': '#C6A66B',
        'terracota': '#B7795A',
        'gris-carbon': '#292B27',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}