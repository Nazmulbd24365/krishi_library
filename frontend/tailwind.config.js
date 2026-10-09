/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        farm: {
          50: '#f5f8f3',
          100: '#e6efe0',
          200: '#cde0c3',
          300: '#a7c896',
          400: '#7cab67',
          500: '#5a8f45',
          600: '#437234',
          700: '#365a2c',
          800: '#2d4826',
          900: '#1f5132',
          950: '#12261a',
        },
        earth: {
          50: '#faf7f2',
          100: '#f2ebe0',
          200: '#e4d5bf',
          300: '#d1b892',
          400: '#bd9a67',
          500: '#a9824b',
          600: '#8c683c',
          700: '#715233',
          800: '#5d442e',
          900: '#4e3a29',
        },
        gold: {
          400: '#d9b45a',
          500: '#c99a34',
          600: '#a87c22',
        },
        cream: '#faf8f1',
      },
      fontFamily: {
        sans: ['Inter', 'Hind Siliguri', 'Noto Sans Bengali', 'system-ui', 'sans-serif'],
        bn: ['Hind Siliguri', 'Noto Sans Bengali', 'system-ui', 'sans-serif'],
        display: ['"Hind Siliguri"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 12px rgba(31, 81, 50, 0.08)',
        card: '0 8px 30px rgba(31, 81, 50, 0.10)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
      maxWidth: {
        shell: '1440px',
        content: '1200px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
