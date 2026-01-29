module.exports = {
  content: [
    './index.html',
    './*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './services/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        canvas: 'rgb(var(--mt-color-bg) / <alpha-value>)',
        surface: 'rgb(var(--mt-color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--mt-color-surface-2) / <alpha-value>)',
        border: 'rgb(var(--mt-color-border) / <alpha-value>)',
        fg: 'rgb(var(--mt-color-fg) / <alpha-value>)',
        muted: 'rgb(var(--mt-color-muted) / <alpha-value>)',
        ring: 'var(--mt-ring)',

        primary: 'rgb(var(--mt-color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--mt-color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--mt-color-accent) / <alpha-value>)',
        success: 'rgb(var(--mt-color-success) / <alpha-value>)',
        danger: 'rgb(var(--mt-color-danger) / <alpha-value>)',
        warning: 'rgb(var(--mt-color-warning) / <alpha-value>)',
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
