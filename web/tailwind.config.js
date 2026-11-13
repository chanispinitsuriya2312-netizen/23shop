/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ff5722',
          dark: '#e64a19',
          light: '#ff8a65'
        },
        ink: {
          900: '#171310',
          800: '#2b2521',
          700: '#3f3833',
          600: '#57504a',
          500: '#6f6861',
          400: '#8f8881',
          300: '#b4aea6',
          200: '#d9d4cd',
          100: '#eceae6',
          50: '#f6f5f2'
        },
        cream: '#faf8f5'
      },
      fontFamily: {
        sans: ['Anuphan', 'Inter', 'Noto Sans Thai', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,19,16,.04), 0 12px 32px -18px rgba(23,19,16,.18)',
        lift: '0 18px 48px -20px rgba(23,19,16,.28)'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
