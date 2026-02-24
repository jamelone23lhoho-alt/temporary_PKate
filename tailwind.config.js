/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#1a1a1a',
        white: '#ffffff',
        grey: '#b0b0b0',
        beige: '#e8ddd3',
        latte: '#a89080',
        cream: '#f5f0eb',
        bg: '#f9f6f2',
        accent: '#8b7355',
        'accent-hover': '#705d45',
        danger: '#c0392b',
        'danger-light': '#fdf0ee',
        success: '#27ae60',
        'success-light': '#edf9f0',
        info: '#2c6ea0',
        'info-light': '#ebf0f5',
        'text-primary': '#1a1a1a',
        'text-secondary': '#6b6560',
        'text-muted': '#a09890',
        border: '#e8e2dc',
      },
      fontFamily: {
        sans: ['Poppins', 'Noto Sans Thai', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
