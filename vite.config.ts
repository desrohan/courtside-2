import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load all env vars (with empty prefix) so we can map both
  // VITE_-prefixed (local .env) and plain-named (Vercel) vars.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Safely expose only the specific vars the browser needs.
      // Falls back from plain name → VITE_ prefix so both .env styles work.
      'import.meta.env.SUPABASE_URL':      JSON.stringify(env.SUPABASE_URL      ?? env.VITE_SUPABASE_URL),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.CHAT_API_URL':      JSON.stringify(env.CHAT_API_URL      ?? env.VITE_CHAT_API_URL),
      'import.meta.env.CHAT_APP_ID':       JSON.stringify(env.CHAT_APP_ID       ?? env.VITE_CHAT_APP_ID),
    },
    server: {
      proxy: {
        '/api': {
          target: 'https://courtside-2.vercel.app',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
