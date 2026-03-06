import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000';
  const enableProxy = mode !== 'production' && Boolean(proxyTarget);

  return {
    base: mode === 'production' ? '/admin/' : '/',
    server: {
      port: 3001,
      host: '0.0.0.0',
      fs: {
        allow: [path.resolve(__dirname, '..')],
      },
      proxy: enableProxy
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            },
            // 代理字体 CSS 和字体文件，避免 CORS 问题
            '/fonts': {
              target: 'https://karenepitaya.xyz',
              changeOrigin: true,
              secure: true,
            },
          }
        : undefined,
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
