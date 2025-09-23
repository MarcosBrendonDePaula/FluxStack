/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom', // Use jsdom for React components
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 5000,
    include: [
      '**/__tests__/**/*.{js,ts,jsx,tsx}',
      '**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    environmentMatchGlobs: [
      // Use node environment for backend/server tests  
      ['**/core/**/*.test.{js,ts}', 'node'],
      ['**/app/server/**/*.test.{js,ts}', 'node'],
      ['**/controllers/**/*.test.{js,ts}', 'node'],
      // Use jsdom for frontend/React tests
      ['**/app/client/**/*.test.{js,ts,jsx,tsx}', 'jsdom'],
      ['**/client/**/*.test.{js,ts,jsx,tsx}', 'jsdom']
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/coverage/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/core': resolve(__dirname, './core'),
      '@/app': resolve(__dirname, './app'),
      '@/config': resolve(__dirname, './config'),
      '@/shared': resolve(__dirname, './app/shared'),
      '@/tests': resolve(__dirname, './tests')
    }
  }
})