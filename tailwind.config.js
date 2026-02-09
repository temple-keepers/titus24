/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Soft romantic palette for young Caribbean women
        brand: {
          50: '#FFF5F7',
          100: '#FFE8ED',
          200: '#FFD1DB',
          300: '#FFB0C1',
          400: '#F78DA7',
          500: '#E8668A',
          600: '#D44D73',
          700: '#B83A5E',
          800: '#972F4D',
          900: '#6D2238',
          950: '#3F1320',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E6EDE6',
          200: '#CEDACE',
          300: '#AAC4AA',
          400: '#82A882',
          500: '#5E8C5E',
          600: '#4A734A',
          700: '#3C5C3C',
          800: '#334A33',
          900: '#2B3D2B',
        },
        gold: {
          400: '#F5C563',
          500: '#E6AD3E',
          600: '#C99225',
        },
        blush: {
          50: '#FFF8F6',
          100: '#FFF0EB',
          200: '#FFE0D6',
          300: '#FFCABC',
          400: '#FFB0A0',
        },
        surface: {
          dark: '#1A1215',
          'dark-raised': '#241A1E',
          'dark-overlay': '#2E2226',
          light: '#FFFBF9',
          'light-raised': '#FFFFFF',
          'light-overlay': '#FFF5F1',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(232, 102, 138, 0.08)',
        'soft-lg': '0 8px 32px rgba(232, 102, 138, 0.12)',
        'glow-pink': '0 0 24px rgba(232, 102, 138, 0.1)',
        'glow-sage': '0 0 24px rgba(130, 168, 130, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.45s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
