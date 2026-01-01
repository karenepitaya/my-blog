module.exports = {
  content: ['./index.html', './**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--theme-font)', 'monospace'],
        mono: ['var(--theme-font)', 'monospace'],
      },
      colors: {
        primary: '#bd93f9',
        secondary: '#8be9fd',
        accent: '#ff79c6',
        success: '#50fa7b',
        danger: '#ff5555',
        warning: '#ffb86c',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        'bounce-slow': 'bounce-slow 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
