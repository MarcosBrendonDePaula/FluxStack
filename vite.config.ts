import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    nodePolyfills({
      // Para adicionar polyfills específicos do Node.js
      include: ['process'],
      // Polyfill de globals específicos
      globals: {
        Buffer: false, // Não precisamos de Buffer
        global: true,
        process: true,
      },
    })
  ],
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
    alias: [
      { find: '@/core', replacement: resolve(__dirname, './core') },
      { find: '@', replacement: resolve(__dirname, './app/client/src') },
      { find: '@/app', replacement: resolve(__dirname, './app') },
      { find: '@/config', replacement: resolve(__dirname, './config') },
      { find: '@/shared', replacement: resolve(__dirname, './app/shared') },
      { find: '@/components', replacement: resolve(__dirname, './app/client/src/components') },
      { find: '@/utils', replacement: resolve(__dirname, './app/client/src/utils') },
      { find: '@/hooks', replacement: resolve(__dirname, './app/client/src/hooks') },
      { find: '@/assets', replacement: resolve(__dirname, './app/client/src/assets') },
      { find: '@/lib', replacement: resolve(__dirname, './app/client/src/lib') },
      { find: '@/types', replacement: resolve(__dirname, './app/client/src/types') }
    ]
  }
})
