/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a4bcfd',
          400: '#8098f9',
          500: '#667eea',
          600: '#5568d3',
          700: '#4553b8',
          800: '#3b4595',
          900: '#2d3475',
          DEFAULT: '#667eea',
        },
        accent: {
          50:  '#fff4ed',
          100: '#ffe6d5',
          200: '#feccaa',
          300: '#fdac74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          DEFAULT: '#f97316',
        },
        neutral: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          50:  '#ecfdf5',
          500: '#10b981',
          700: '#047857',
          DEFAULT: '#10b981',
        },
        warning: {
          50:  '#fffbeb',
          500: '#f59e0b',
          700: '#b45309',
          DEFAULT: '#f59e0b',
        },
        error: {
          50:  '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
          DEFAULT: '#ef4444',
        },
        // Keep legacy colors for backward compatibility
        text: {
          primary: '#172B4D',
          secondary: '#5E6C84',
          disabled: '#A5ADBA',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
        display: ['Inter', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(102, 126, 234, 0.3)',
        'glow-accent': '0 0 20px rgba(249, 115, 22, 0.3)',
      },
      animation: {
        blob: 'blob 7s infinite',
        shimmer: 'shimmer 2s infinite linear',
        'slide-in-up': 'slideInUp 0.6s ease-out',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        slideInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
