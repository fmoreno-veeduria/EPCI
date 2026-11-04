import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Tres páginas independientes: portada, módulo «Aprende con Tula» y módulo «Explora la encuesta».
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  build: {
    rollupOptions: {
      input: {
        home: path.resolve(__dirname, 'index.html'),
        aprende: path.resolve(__dirname, 'aprende/index.html'),
        explora: path.resolve(__dirname, 'explora/index.html'),
      },
    },
  },
  server: { proxy: { '/api': 'http://localhost:8085' } },
});
