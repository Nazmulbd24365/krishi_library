import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');

  return {
    plugins: [
      react(),
      {
        // Replace the canonical/OG placeholder with the configured public site URL.
        // When VITE_SITE_URL is not set, root-relative URLs are emitted instead of
        // accidentally baking localhost into production HTML.
        name: 'sail-site-url',
        transformIndexHtml(html: string) {
          return html.replaceAll('__SITE_URL__', siteUrl);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: 'http://localhost:4000', changeOrigin: true },
        '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  };
});
