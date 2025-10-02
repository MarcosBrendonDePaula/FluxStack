/**
 * Tests for Enhanced Eden API Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  apiCall,
  simpleApiCall,
  criticalApiCall,
  backgroundApiCall,
  userActionApiCall,
  getErrorMessage,
  isRetryableError,
  shouldShowErrorToUser,
  getCircuitBreakerState,
  resetCircuitBreaker
} from '../eden-api'
import { ClientAPIError, NetworkError, TimeoutError } from '../errors'

// Mock the circuit breaker
vi.mock('../errors', () => ({
  ClientAPIError: class ClientAPIError extends Error {
    constructor(
      message: string,
      public code: string,
      public statusCode: number,
      public details?: any,
      public correlationId?: string,
      public userMessage?: string
    ) {
      super(message)
      this.name = 'ClientAPIError'
    }
    
    get isRetryable() {
      return [408, 429, 500, 502, 503, 504].includes(this.statusCode) ||
             ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'EXTERNAL_SERVICE_ERROR'].includes(this.code)
    }
    
    getUserFriendlyMessage() {
      return this.userMessage || 'Default error message'
    }
  },
  NetworkError: class NetworkError extends Error {
    constructor(message = 'Network error') {
      super(message)
      this.name = 'NetworkError'
    }
  },
  TimeoutError: class TimeoutError extends Error {
    constructor(timeout: number) {
      super(`Request timed out after ${timeout}ms`)
      this.name = 'TimeoutError'
    }
  },
  CircuitBreaker: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockImplementation((fn) => fn()),
    getState: vi.fn().mockReturnValue('CLOSED'),
    reset: vi.fn()
  }))
}))

describe('Enhanced Eden API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCircuitBreaker()
  })

  describe('apiCall', () => {
    it('should handle successful API response', async () => {
      const mockApiPromise = Promise.resolve({
        data: { success: true, message: 'OK' },
        error: null
      })

      const result = await apiCall(mockApiPromise)

      expect(result).toEqual({ success: true, message: 'OK' })
    })

    it('should handle API error response', async () => {
      const mockApiPromise = Promise.resolve({
        data: null,
        error: {
          status: 400,
          value: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            correlationId: 'test-123',
            userMessage: 'Please check your input'
          }
        }
      })

      await expect(apiCall(mockApiPromise)).rejects.toThrow(ClientAPIError)
      
      try {
        await apiCall(mockApiPromise)
      } catch (error) {
        expect(error).toBeInstanceOf(ClientAPIError)
        expect((error as ClientAPIError).message).toBe('Validation failed')
        expect((error as ClientAPIError).code).toBe('VALIDATION_ERROR')
        expect((error as ClientAPIError).statusCode).toBe(400)
        expect((error as ClientAPIError).correlationId).toBe('test-123')
        expect((error as ClientAPIError).userMessage).toBe('Please check your input')
      }
    })

    it('should handle network errors', async () => {
      const mockApiPromise = Promise.reject(new Error('fetch failed'))

      await expect(apiCall(mockApiPromise)).rejects.toThrow()
      
      try {
        await apiCall(mockApiPromise)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('fetch failed')
      }
    })

    it('should handle timeout', async () => {
      const slowApiPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ data: 'slow response', error: null }), 100)
      })

      await expect(apiCall(slowApiPromise, { timeout: 50 })).rejects.toThrow(TimeoutError)
    })

    it('should apply retry logic', async () => {
      let callCount = 0
      const mockApiPromise = () => {
        callCount++
        if (callCount < 3) {
          return Promise.resolve({
            data: null,
            error: {
              status: 500,
              value: { message: 'Server error', code: 'INTERNAL_SERVER_ERROR' }
            }
          })
        }
        return Promise.resolve({
          data: { success: true },
          error: null
        })
      }

      const result = await apiCall(mockApiPromise(), {
        retry: { maxRetries: 3, baseDelay: 10 }
      })

      expect(result).toEqual({ success: true })
      expect(callCount).toBe(3)
    })

    it('should use fallback on error', async () => {
      const mockApiPromise = Promise.resolve({
        data: null,
        error: {
          status: 500,
          value: { message: 'Server error', code: 'INTERNAL_SERVER_ERROR' }
        }
      })

      const result = await apiCall(mockApiPromise, {
        fallback: { fallbackValue: { fallback: true } }
      })

      expect(result).toEqual({ fallback: true })
    })

    it('should use circuit breaker when enabled', async () => {
      const mockApiPromise = Promise.resolve({
        data: { success: true },
        error: null
      })

      const result = await apiCall(mockApiPromise, { useCircuitBreaker: true })

      expect(result).toEqual({ success: true })
    })

    it('should handle unknown error types', async () => {
      const mockApiPromise = Promise.reject('string error')

      await expect(apiCall(mockApiPromise)).rejects.toThrow(ClientAPIError)
      
      try {
        await apiCall(mockApiPromise)
      } catch (error) {
        expect(error).toBeInstanceOf(ClientAPIError)
        expect((error as ClientAPIError).code).toBe('UNKNOWN_ERROR')
        expect((error as ClientAPIError).statusCode).toBe(500)
      }
    })
  })

  describe('Specialized API Calls', () => {
    it('should configure criticalApiCall with extended options', async () => {
      const mockApiPromise = Promise.resolve({
        data: { critical: true },
        error: null
      })

      const result = await criticalApiCall(mockApiPromise)

      expect(result).toEqual({ critical: true })
    })

    it('should configure backgroundApiCall with fallback', async () => {
      const mockApiPromise = Promise.resolve({
        data: null,
        error: {
          status: 500,
          value: { message: 'Server error', code: 'INTERNAL_SERVER_ERROR' }
        }
      })

      const result = await backgroundApiCall(mockApiPromise, { background: 'fallback' })

      expect(result).toEqual({ background: 'fallback' })
    })

    it('should configure userActionApiCall with user-friendly settings', async () => {
      const mockApiPromise = Promise.resolve({
        data: { userAction: true },
        error: null
      })

      const result = await userActionApiCall(mockApiPromise)

      expect(result).toEqual({ userAction: true })
    })

    it('should use simpleApiCall as backward compatibility', async () => {
      const mockApiPromise = Promise.resolve({
        data: { simple: true },
        error: null
      })

      const result = await simpleApiCall(mockApiPromise)

      expect(result).toEqual({ simple: true })
    })
  })

  describe('Error Message Utilities', () => {
    it('should get user-friendly message for ClientAPIError', () => {
      const error = new ClientAPIError(
        'Technical error',
        'VALIDATION_ERROR',
        400,
        undefined,
        undefined,
        'User friendly message'
      )

      expect(getErrorMessage(error)).toBe('User friendly message')
    })

    it('should get default message for ClientAPIError without user message', () => {
      const error = new ClientAPIError('Technical error', 'VALIDATION_ERROR', 400)

      expect(getErrorMessage(error)).toBe('Please check your input and try again.')
    })

    it('should handle legacy APIException', () => {
      const error = {
        name: 'APIException',
        message: 'API error',
        status: 401,
        code: 'UNAUTHORIZED'
      }

      expect(getErrorMessage(error)).toBe('Please log in to access this resource.')
    })

    it('should handle regular Error objects', () => {
      const error = new Error('Regular error')

      expect(getErrorMessage(error)).toBe('Regular error')
    })

    it('should handle unknown error types', () => {
      expect(getErrorMessage('string error')).toBe('An unexpected error occurred')
      expect(getErrorMessage(null)).toBe('An unexpected error occurred')
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred')
    })
  })

  describe('Error Classification Utilities', () => {
    it('should identify retryable ClientAPIError', () => {
      const retryableError = new ClientAPIError('Server error', 'INTERNAL_SERVER_ERROR', 500)
      const nonRetryableError = new ClientAPIError('Bad request', 'VALIDATION_ERROR', 400)

      expect(isRetryableError(retryableError)).toBe(true)
      expect(isRetryableError(nonRetryableError)).toBe(false)
    })

    it('should identify retryable legacy APIException', () => {
      const retryableError = { name: 'APIException', status: 500, message: 'Server error' }
      const nonRetryableError = { name: 'APIException', status: 400, message: 'Bad request' }

      expect(isRetryableError(retryableError)).toBe(true)
      expect(isRetryableError(nonRetryableError)).toBe(false)
    })

    it('should handle unknown error types in retryability check', () => {
      expect(isRetryableError(new Error('Regular error'))).toBe(false)
      expect(isRetryableError('string error')).toBe(false)
    })

    it('should determine if error should be shown to user', () => {
      const userError = new ClientAPIError('User error', 'VALIDATION_ERROR', 400)
      const technicalError = new ClientAPIError('DB error', 'DATABASE_ERROR', 500)

      expect(shouldShowErrorToUser(userError)).toBe(true)
      expect(shouldShowErrorToUser(technicalError)).toBe(false)
    })

    it('should show unknown errors to user by default', () => {
      const unknownError = new Error('Unknown error')

      expect(shouldShowErrorToUser(unknownError)).toBe(true)
    })
  })

  describe('Circuit Breaker Utilities', () => {
    it('should get circuit breaker state', () => {
      const state = getCircuitBreakerState()
      expect(state).toBe('CLOSED')
    })

    it('should reset circuit breaker', () => {
      resetCircuitBreaker()
      // Should not throw and should reset the circuit breaker
      expect(getCircuitBreakerState()).toBe('CLOSED')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complex error scenario with retry and fallback', async () => {
      let callCount = 0
      const mockApiPromise = () => {
        callCount++
        return Promise.resolve({
          data: null,
          error: {
            status: 503,
            value: { 
              message: 'Service unavailable', 
              code: 'SERVICE_UNAVAILABLE',
              correlationId: `attempt-${callCount}`
            }
          }
        })
      }

      const result = await apiCall(mockApiPromise(), {
        retry: { maxRetries: 2, baseDelay: 10 },
        fallback: { fallbackValue: { fallback: 'data' } },
        timeout: 1000
      })

      expect(result).toEqual({ fallback: 'data' })
      expect(callCount).toBe(3) // Initial + 2 retries
    })

    it('should handle successful retry after failures', async () => {
      let callCount = 0
      const mockApiPromise = () => {
        callCount++
        if (callCount < 2) {
          return Promise.resolve({
            data: null,
            error: {
              status: 500,
              value: { message: 'Temporary error', code: 'INTERNAL_SERVER_ERROR' }
            }
          })
        }
        return Promise.resolve({
          data: { success: true, attempt: callCount },
          error: null
        })
      }

      const result = await apiCall(mockApiPromise(), {
        retry: { maxRetries: 3, baseDelay: 10 }
      })

      expect(result).toEqual({ success: true, attempt: 2 })
      expect(callCount).toBe(2)
    })

    it('should respect timeout even with retries', async () => {
      const slowApiPromise = () => new Promise((resolve) => {
        setTimeout(() => resolve({ data: 'slow', error: null }), 100)
      })

      await expect(apiCall(slowApiPromise(), {
        timeout: 50,
        retry: { maxRetries: 2, baseDelay: 10 }
      })).rejects.toThrow(TimeoutError)
    })
  })
})