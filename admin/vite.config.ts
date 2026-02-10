import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/admin/' : '/',
  server: {
    port: 3001,
    host: '0.0.0.0',
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
