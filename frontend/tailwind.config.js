/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black:        '#0a0a0a',
          'black-light': '#141414',
          'black-mid':  '#1e1e1e',
          'black-soft': '#2a2a2a',
          yellow:       '#F5C518',
          'yellow-light': '#FFD700',
          'yellow-muted': '#F59E0B',
          'yellow-pale': '#FEF3C7',
          red:          '#DC2626',
          'red-light':  '#EF4444',
          'red-pale':   '#FEE2E2',
          white:        '#FFFFFF',
          'white-soft': '#F5F5F5',
          gray:         '#9CA3AF',
          'gray-dark':  '#6B7280',
          'gray-border': '#2a2a2a',
          success:      '#10B981',
          'success-pale': '#D1FAE5',
          info:         '#3B82F6',
          'info-pale':  '#DBEAFE',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(245, 197, 24, 0.15)',
        'glow-red':    '0 0 20px rgba(220, 38, 38, 0.15)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
      },
    },
  },
  plugins: [],
}
