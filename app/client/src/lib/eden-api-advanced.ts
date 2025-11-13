/**
 * Advanced API utilities (optional)
 *
 * ⚠️ WARNING: Only use these utilities if you REALLY need them.
 * For most cases, use the simple `api` from eden-api.ts directly.
 *
 * These utilities can break type inference if misused.
 */

import {
  ClientAPIError,
  NetworkError,
  TimeoutError,
  withRetry,
  withFallback,
  CircuitBreaker,
  type RetryOptions,
  type FallbackOptions
} from './errors'

/**
 * Global circuit breaker for critical API calls
 */
export const apiCircuitBreaker = new CircuitBreaker(
  5,      // maxFailures
  60000,  // resetTimeout (1 min)
  60000   // openTimeout (1 min)
)

/**
 * Enhanced API call wrapper with retry and recovery
 *
 * ⚠️ WARNING: This breaks Eden Treaty's type inference.
 * Only use for background/non-critical calls where you need retry logic.
 *
 * For type-safe calls, use `api` directly from eden-api.ts
 */
export async function apiCallWithRetry<T>(
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
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new TimeoutError(timeout)), timeout)
    })

    try {
      const result = await Promise.race([apiPromise, timeoutPromise])
      const { data, error } = result

      if (error) {
        throw new ClientAPIError(
          error.value?.message || 'API Error',
          error.value?.code || 'API_ERROR',
          error.status,
          error.value?.details || error.value,
          error.value?.correlationId,
          error.value?.userMessage
        )
      }

      return data
    } catch (error) {
      if (error instanceof ClientAPIError || error instanceof TimeoutError) {
        throw error
      }

      if (error instanceof Error) {
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

  const callWithCircuitBreaker = useCircuitBreaker
    ? () => apiCircuitBreaker.execute(executeCall)
    : executeCall

  const callWithRetry = retry
    ? () => withRetry(callWithCircuitBreaker, retry)
    : callWithCircuitBreaker

  if (fallback) {
    return withFallback(callWithRetry, fallback)
  }

  return callWithRetry()
}

/**
 * Specialized calls for different scenarios
 */

export async function criticalApiCall<T>(apiPromise: Promise<any>): Promise<T> {
  return apiCallWithRetry(apiPromise, {
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
  return apiCallWithRetry(apiPromise, {
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
  return apiCallWithRetry(apiPromise, {
    retry: {
      maxRetries: 3,
      baseDelay: 1000,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    },
    timeout: 30000,
    useCircuitBreaker: true
  })
}

/**
 * Circuit breaker utilities
 */
export function getCircuitBreakerState(): string {
  return apiCircuitBreaker.getState()
}

export function resetCircuitBreaker(): void {
  apiCircuitBreaker.reset()
}
