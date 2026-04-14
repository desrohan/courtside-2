/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        court: {
          50:  '#e6f7ef',
          100: '#c0ebd7',
          200: '#96debc',
          300: '#6bd1a1',
          400: '#4bc78c',
          500: '#00A76F',
          600: '#009461',
          700: '#007F53',
          800: '#006B45',
          900: '#004B30',
          950: '#002E1D',
        },
        dark: {
          50: '#f5f6f8',
          100: '#ebedf0',
          200: '#d3d6dd',
          300: '#b0b5c0',
          400: '#878e9e',
          500: '#6b7280',
          600: '#545a67',
          700: '#454a54',
          800: '#3b3f48',
          900: '#24272e',
          950: '#161820',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 10px -5px rgba(0,0,0,0.04)',
        'elevated': '0 20px 40px -12px rgba(0,0,0,0.12)',
        'drawer': '-4px 0 24px rgba(0,0,0,0.12)',
        'glow': '0 0 20px rgba(0,167,111,0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
