/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#F8F063',
          hover: '#E0D854',
          deep: '#C9C24A',
        },
        ink: {
          DEFAULT: 'rgb(0 0 0 / <alpha-value>)',
          900: 'rgb(10 10 10 / <alpha-value>)',
          800: 'rgb(23 23 23 / <alpha-value>)',
          700: 'rgb(38 38 38 / <alpha-value>)',
        },
        muted: {
          DEFAULT: '#949494',
          light: '#C4C4C4',
          dark: '#6E6E6E',
        },
      },
    },
  },
  plugins: [],
}
