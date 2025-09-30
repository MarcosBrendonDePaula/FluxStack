// Eden Treaty API Client - Full Type Inference
import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/app'

// Get base URL dynamically
const getBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000'
  
  // In production, use current origin
  if (window.location.hostname !== 'localhost') {
    return window.location.origin
  }
  
  // In development, use backend server (port 3000 for integrated mode)
  return 'http://localhost:3000'
}

// Create Eden Treaty client with proper typing
const client = treaty<App>(getBaseUrl())

// Export the client's API directly to get proper type inference
export const api = client.api

// Enhanced error handling with retry and recovery strategies
import { 
  ClientAPIError, 
  NetworkError, 
  TimeoutError, 
  withRetry, 
  withFallback, 
  CircuitBreaker,
  getDefaultUserMessage,
  type RetryOptions,
  type FallbackOptions
} from './errors'

// Legacy interface for backward compatibility
export interface APIError {
  message: string
  status: number
  code?: string
  details?: any
}

// Legacy class for backward compatibility
export class APIException extends Error {
  status: number
  code?: string
  details?: any

  constructor(error: APIError) {
    super(error.message)
    this.name = 'APIException'
    this.status = error.status
    this.code = error.code
    this.details = error.details
  }
}

// Global circuit breaker for API calls
const apiCircuitBreaker = new CircuitBreaker(5, 60000, 60000)

// Enhanced API call wrapper with retry and recovery
export async function apiCall<T>(
  apiPromise: Promise<any>,
  options: {
    retry?: Partial<RetryOptions>
    fallback?: FallbackOptions<T>
    timeout?: number
    useCircuitBreaker?: boolean
  } = {}
): Promise<T> {
  const { retry, fallback, timeout = 30000, useCircuitBreaker = true } = options

  const executeCall = async (): Promise<T> => {
    // Add timeout to the API call
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(timeout))
      }, timeout)
    })

    try {
      const result = await Promise.race([apiPromise, timeoutPromise])
      const { data, error } = result
      
      if (error) {
        const correlationId = error.value?.correlationId
        
        throw new ClientAPIError(
          error.value?.message || 'API Error',
          error.value?.code || 'API_ERROR',
          error.status,
          error.value?.details || error.value,
          correlationId,
          error.value?.userMessage
        )
      }
      
      return data
    } catch (error) {
      // Handle different types of errors
      if (error instanceof ClientAPIError || error instanceof TimeoutError) {
        throw error
      }
      
      if (error instanceof Error) {
        // Check if it's a network error
        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new NetworkError(error.message)
        }
        
        throw new ClientAPIError(
          error.message,
          'NETWORK_ERROR',
          0,
          undefined,
          undefined,
          'Unable to connect to the server. Please check your connection.'
        )
      }
      
      throw new ClientAPIError(
        'Unknown error occurred',
        'UNKNOWN_ERROR',
        500,
        error
      )
    }
  }

  // Wrap with circuit breaker if enabled
  const callWithCircuitBreaker = useCircuitBreaker 
    ? () => apiCircuitBreaker.execute(executeCall)
    : executeCall

  // Apply retry logic if specified
  const callWithRetry = retry 
    ? () => withRetry(callWithCircuitBreaker, retry)
    : callWithCircuitBreaker

  // Apply fallback if specified
  if (fallback) {
    return withFallback(callWithRetry, fallback)
  }

  return callWithRetry()
}

// Simplified API call for basic usage (backward compatibility)
export async function simpleApiCall(apiPromise: Promise<any>) {
  return apiCall(apiPromise)
}

// Specialized API calls for different scenarios
export async function criticalApiCall<T>(apiPromise: Promise<any>): Promise<T> {
  return apiCall(apiPromise, {
    retry: {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 30000
    },
    timeout: 60000,
    useCircuitBreaker: true
  })
}

export async function backgroundApiCall<T>(
  apiPromise: Promise<any>, 
  fallbackValue: T
): Promise<T> {
  return apiCall(apiPromise, {
    retry: {
      maxRetries: 2,
      baseDelay: 1000
    },
    fallback: {
      fallbackValue,
      showFallbackMessage: false
    },
    timeout: 15000,
    useCircuitBreaker: false
  })
}

export async function userActionApiCall<T>(apiPromise: Promise<any>): Promise<T> {
  return apiCall(apiPromise, {
    retry: {
      maxRetries: 3,
      baseDelay: 1000,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    },
    timeout: 30000,
    useCircuitBreaker: true
  })
}

// User-friendly error messages (enhanced)
export function getErrorMessage(error: unknown): string {
  if (error instanceof ClientAPIError) {
    return error.getUserFriendlyMessage()
  }
  
  if (error instanceof APIException) {
    return getDefaultUserMessage(error.code || 'UNKNOWN_ERROR', error.status)
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// Error recovery utilities
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ClientAPIError) {
    return error.isRetryable
  }
  
  if (error instanceof APIException) {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
    return retryableStatusCodes.includes(error.status)
  }
  
  return false
}

export function shouldShowErrorToUser(error: unknown): boolean {
  if (error instanceof ClientAPIError) {
    // Don't show technical errors to users
    const technicalCodes = ['DATABASE_ERROR', 'EXTERNAL_SERVICE_ERROR', 'INTERNAL_SERVER_ERROR']
    return !technicalCodes.includes(error.code)
  }
  
  return true
}

// Circuit breaker utilities
export function getCircuitBreakerState(): string {
  return apiCircuitBreaker.getState()
}

export function resetCircuitBreaker(): void {
  apiCircuitBreaker.reset()
}