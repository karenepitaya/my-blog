module.exports = {
  content: ['./index.html', './**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--theme-font)', 'monospace'],
        mono: ['var(--theme-font)', 'monospace'],
      },
    },
  },
  plugins: [],
};
