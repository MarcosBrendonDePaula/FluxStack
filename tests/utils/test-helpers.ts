import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Custom render function that can include providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, {
  // Add any providers here (e.g., ThemeProvider, QueryClient, etc.)
  ...options,
})

export * from '@testing-library/react'
export { customRender as render }

// Test utilities
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

export const createMockUser = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date(),
  ...overrides
})

export const createMockRequest = (url: string, options: RequestInit = {}) => 
  new Request(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

// Mock API helpers
export const mockApiSuccess = <T>(data: T) => ({
  data,
  status: 200,
  ok: true
})

export const mockApiError = (message: string, status = 400) => ({
  error: message,
  status,
  ok: false
})

// Environment helpers
export const setTestEnv = (vars: Record<string, string>) => {
  Object.entries(vars).forEach(([key, value]) => {
    process.env[key] = value
  })
}

export const resetTestEnv = (keys: string[]) => {
  keys.forEach(key => {
    delete process.env[key]
  })
}