/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 5000,
    projects: [
      {
        name: 'frontend',
        testMatch: ['**/app/client/**/*.{test,spec}.{js,ts,jsx,tsx}', '**/tests/unit/app/client/**/*.{test,spec}.{js,ts,jsx,tsx}'],
        environment: 'jsdom'
      },
      {
        name: 'backend',
        testMatch: ['**/core/**/*.{test,spec}.{js,ts}', '**/app/server/**/*.{test,spec}.{js,ts}', '**/tests/unit/app/controllers/**/*.{test,spec}.{js,ts}', '**/tests/integration/**/*.{test,spec}.{js,ts}'],
        environment: 'node'
      }
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