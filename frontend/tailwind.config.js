/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2',
        secondary: '#5FCF80',
        danger: '#E74C3C',
        warning: '#F39C12',
        info: '#3498DB',
      },
    },
  },
  plugins: [],
}