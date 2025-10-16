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
  define: {
    __DEFINES__: JSON.stringify({}),
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __HMR_CONFIG_NAME__: JSON.stringify('vite.config.ts'),
    __BASE__: JSON.stringify('/'),
    __SERVER_HOST__: JSON.stringify('localhost'),
    __HMR_PROTOCOL__: JSON.stringify('ws'),
    __HMR_PORT__: JSON.stringify(5173),
    __HMR_HOSTNAME__: JSON.stringify('localhost'),
    __HMR_BASE__: JSON.stringify('/'),
    __HMR_DIRECT_TARGET__: JSON.stringify('localhost:5173'),
    __HMR_ENABLE_OVERLAY__: JSON.stringify(true),
    __HMR_TIMEOUT__: JSON.stringify(30000),
    __WS_TOKEN__: JSON.stringify(''),
  },
  root: 'app/client',
  server: {
    port: 5173,
    host: true,
    // Configuração explícita do HMR para evitar conflito com WebSocket do backend
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // Habilita proxy WebSocket para live components
      }
    }
  },
  build: {
    outDir: '../../dist/client'
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
