import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub out unused Supabase submodules to exclude them from the bundle.
      // The app only uses auth + postgrest; realtime, storage, and functions
      // are dead weight (~300 KB raw) pulled in by the SupabaseClient constructor.
      '@supabase/realtime-js': path.resolve(__dirname, './src/lib/stubs/supabase-realtime-stub.ts'),
      '@supabase/storage-js': path.resolve(__dirname, './src/lib/stubs/supabase-storage-stub.ts'),
      '@supabase/functions-js': path.resolve(__dirname, './src/lib/stubs/supabase-functions-stub.ts'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
        },
      },
    },
  },
})
