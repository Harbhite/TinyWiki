import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Exhaustive search for the API Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY ||
                   process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY ||
                   process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY ||
                   env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY ||
                   env.GOOGLE_API_KEY || env.VITE_GOOGLE_API_KEY ||
                   env.NEXT_PUBLIC_GEMINI_API_KEY || env.API_KEY || '';

    if (!apiKey) {
      console.warn("\x1b[33m%s\x1b[0m", "⚠️  WARNING: No Gemini API Key found in environment variables.");
      console.warn("Please set GEMINI_API_KEY, GOOGLE_API_KEY, or VITE_GEMINI_API_KEY in your Vercel project settings.");
    } else {
      console.log("\x1b[32m%s\x1b[0m", "✅ Gemini API Key found and configured.");
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Expose as standard process.env (for legacy/node compatibility)
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        // Expose as standard Vite env var
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
        // Also expose as a generic GEMINI_API_KEY on import.meta.env for convenience
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
