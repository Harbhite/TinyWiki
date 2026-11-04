import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pdfExportHandler from './api/export-pdf.js';

// Vite automatically exposes VITE_* env vars to the client via import.meta.env,
// so no manual `define` is needed for VITE_GEMINI_API_KEY.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    {
      name: 'tinywiki-pdf-api',
      configureServer(server) {
        server.middlewares.use('/api/export-pdf', pdfExportHandler);
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
