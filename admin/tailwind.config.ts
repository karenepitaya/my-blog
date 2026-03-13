import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif SC"', 'Songti SC', 'SimSun', 'Georgia', 'serif'],
      },
      animation: {
        'spring-bounce': 'spring-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'spring-bounce': {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
