/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ff5722',
          dark: '#e64a19',
          light: '#ff8a65'
        },
        // Warm neutral scale driven by CSS variables so the same utilities
        // work in both light and dark themes.
        ink: {
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          50: 'rgb(var(--ink-50) / <alpha-value>)'
        },
        cream: 'rgb(var(--cream) / <alpha-value>)'
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
