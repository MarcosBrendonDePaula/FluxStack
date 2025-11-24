/**
 * Vite SSR Configuration
 * This config is used to build the server-side rendering bundle
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ['process'],
      globals: {
        Buffer: false,
        global: true,
        process: true,
      },
    })
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  root: 'app/client',
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: '../../dist/server',
    rollupOptions: {
      output: {
        entryFileNames: 'entry-server.js'
      }
    }
  },
  resolve: {
    alias: [
      { find: 'fluxstack', replacement: resolve(__dirname, './core/client/fluxstack') },
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
