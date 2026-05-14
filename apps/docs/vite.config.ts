import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import vitePluginDocsLoader from './src/plugins/vite-plugin-docs-loader';

export default defineConfig({
  plugins: [
    react(),
    vitePluginDocsLoader({
      docsDir: path.resolve(__dirname, '../../docs'),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
  },
});
