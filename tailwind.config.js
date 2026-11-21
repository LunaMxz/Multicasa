/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/views/**/*.ejs', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        // Paleta tomada del PSD: ajusta aquí y se actualiza todo el sitio
        brand: { DEFAULT: '#1b5a8f', dark: '#0f3f6b', light: '#3a7bb5' },
        accent: '#e8821c',
        leaf: '#6aa52a',
      },
    },
  },
  plugins: [],
};
