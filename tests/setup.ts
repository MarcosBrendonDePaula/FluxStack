import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { act } from 'react'

// Fix React.act for React 19
global.React = { act }

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Global test setup
beforeAll(() => {
  // Setup global test environment
  console.log('🧪 Setting up test environment...')
  
  // Handle unhandled rejections to prevent CI failures
  // Specifically for esbuild TextEncoder errors in CI
  const originalUnhandledRejection = process.listeners('unhandledRejection')
  process.removeAllListeners('unhandledRejection')
  
  process.on('unhandledRejection', (reason: any) => {
    // Only suppress esbuild TextEncoder errors
    if (reason?.message?.includes('TextEncoder') && reason?.message?.includes('esbuild')) {
      console.warn('⚠️ Suppressed esbuild TextEncoder error in test environment')
      return
    }
    
    // Re-throw other unhandled rejections
    throw reason
  })
})

afterAll(() => {
  // Cleanup global test environment
  console.log('🧹 Cleaning up test environment...')
})

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.FRONTEND_PORT = '5174'
process.env.BACKEND_PORT = '3002'