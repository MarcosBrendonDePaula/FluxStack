// Eden Treaty API Client - Full Type Inference
import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/app'

/**
 * Get base URL dynamically
 */
export const getBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000'

  // Production: use current origin
  if (window.location.hostname !== 'localhost') {
    return window.location.origin
  }

  // Development: use backend server
  return 'http://localhost:3000'
}

/**
 * Get auth token from localStorage (optional)
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

/**
 * Create Eden Treaty client with authentication
 */
const client = treaty<App>(getBaseUrl(), {
  // Dynamic headers - executed for EVERY request automatically
  headers: () => {
    const token = getAuthToken()
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return undefined // Return undefined instead of empty object
  },

  // Custom fetch with logging and error handling
  fetch: async (url: string | URL | Request, init?: RequestInit) => {
    // Log in development
    if (import.meta.env.DEV) {
      const method = init?.method || 'GET'
      console.log(`🌐 API: ${method} ${url}`)
    }

    // Execute fetch
    const response = await fetch(url, init)

    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`📡 Response: ${url} - ${response.status}`)
    }

    // Auto-logout on 401
    if (response.status === 401) {
      console.warn('🔒 Token expired, redirecting to login...')
      localStorage.removeItem('accessToken')
      // window.location.href = '/login' // Uncomment if you have auth
    }

    return response
  }
})

/**
 * Export the API directly for full type inference
 * ⚠️ NEVER wrap this in apiCall() - it breaks type inference
 */
export const api = client.api

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  // Eden Treaty error format
  if (error && typeof error === 'object' && 'value' in error) {
    const edenError = error as { value?: { message?: string; userMessage?: string } }
    return edenError.value?.userMessage || edenError.value?.message || 'An error occurred'
  }

  // Standard Error
  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}
