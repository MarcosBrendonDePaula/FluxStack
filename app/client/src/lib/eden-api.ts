// Eden Treaty API Client - Full Type Inference
import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/app'

/**
 * Get base URL dynamically
 */
export const getBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000'

  // Always use current origin - works for both dev and production
  return window.location.origin
}

/**
 * Get auth token from localStorage (optional)
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

/**
 * Create Eden Treaty client with authentication and logging
 * Based on official ElysiaJS Chan example
 */
export const api = treaty<App>(getBaseUrl(), {
  // Dynamic headers for every request
  headers(_path, _options) {
    const token = getAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : undefined
  },

  // Custom fetcher with logging and error handling
  // Use 'as any' to bypass Bun's strict fetch type (includes preconnect property)
  fetcher: (async (url, init) => {
    if (import.meta.env.DEV) {
      console.log(`🌐 ${init?.method ?? 'GET'} ${url}`)
    }

    const res = await fetch(url, init)

    if (import.meta.env.DEV) {
      console.log(`📡 ${url} → ${res.status}`)
    }

    // Auto-logout on 401
    if (res.status === 401) {
      console.warn('🔒 Token expired')
      localStorage.removeItem('accessToken')
      // window.location.href = '/login' // Uncomment if you have auth
    }

    return res
  }) as typeof fetch
}).api // ← expose the generated API object

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
