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
 * Keep it simple - just auth headers
 */
const client = treaty<App>(getBaseUrl(), {
  headers() {
    const token = getAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : undefined
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
