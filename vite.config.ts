
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// FIX: Import `process` to provide proper TypeScript types for `process.cwd()`.
import process from 'process';

// https://vitejs.dev/config/
// FIX: Modified Vite config to expose `process.env.API_KEY` to the client,
// aligning with the Gemini API guidelines for key management.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});
