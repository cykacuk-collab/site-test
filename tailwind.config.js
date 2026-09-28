/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        primary: '#555B56', // Muted dark gray-green (text, footers, headings)
        secondary: '#E8DDCC', // Warm sand/beige (buttons, highlights)
        accent: '#D5DDD5', //  Very pale mint green (accents, hero bg) or #EDF6ED
        beige: '#faf9f6', // Extremely soft off-white for the main body background
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
