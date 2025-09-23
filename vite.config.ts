import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

const __dirname = import.meta.dir

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'app/client',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: '../../dist/client'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './app/client/src'),
      '@/core': resolve(__dirname, './core'),
      '@/app': resolve(__dirname, './app'),
      '@/config': resolve(__dirname, './config'),
      '@/shared': resolve(__dirname, './app/shared'),
      '@/components': resolve(__dirname, './app/client/src/components'),
      '@/utils': resolve(__dirname, './app/client/src/utils'),
      '@/hooks': resolve(__dirname, './app/client/src/hooks'),
      '@/assets': resolve(__dirname, './app/client/src/assets'),
      '@/lib': resolve(__dirname, './app/client/src/lib'),
      '@/types': resolve(__dirname, './app/client/src/types')
    }
  }
})
