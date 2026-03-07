/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C09A3A',
          light: '#D4B06A',
          dark: '#8B6914',
          muted: '#C09A3A26',
        },
        rc: {
          dark: '#0F172A',
          dark2: '#1e293b',
          dark3: '#334155',
          dark4: '#0c1520',
        },
        primary: {
          DEFAULT: '#0a7ea4',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0a7ea4',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
