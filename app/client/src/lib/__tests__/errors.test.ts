/**
 * Tests for Client-Side Error Handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ClientAPIError,
  NetworkError,
  TimeoutError,
  withRetry,
  withFallback,
  CircuitBreaker,
  getDefaultUserMessage,
  logClientError
} from '../errors'

// Mock console and navigator
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn()
}

// Mock global objects for browser environment
global.window = {
  navigator: {
    userAgent: 'Test Browser'
  },
  location: {
    href: 'http://localhost:3000/test'
  }
} as any

global.navigator = {
  userAgent: 'Test Browser'
} as any

describe('Client-Side Error Classes', () => {
  describe('ClientAPIError', () => {
    it('should create error with all properties', () => {
      const error = new ClientAPIError(
        'Test error',
        'TEST_ERROR',
        400,
        { field: 'email' },
        'corr-123',
        'User friendly message'
      )

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ field: 'email' })
      expect(error.correlationId).toBe('corr-123')
      expect(error.userMessage).toBe('User friendly message')
      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.isRetryable).toBe(false) // 400 is not retryable
    })

    it('should determine retryability correctly', () => {
      const retryableError = new ClientAPIError('Server error', 'INTERNAL_ERROR', 500)
      const nonRetryableError = new ClientAPIError('Bad request', 'VALIDATION_ERROR', 400)
      const networkError = new ClientAPIError('Network failed', 'NETWORK_ERROR', 0)

      expect(retryableError.isRetryable).toBe(true)
      expect(nonRetryableError.isRetryable).toBe(false)
      expect(networkError.isRetryable).toBe(true)
    })

    it('should serialize to JSON correctly', () => {
      const error = new ClientAPIError('Test', 'TEST_ERROR', 400, { test: true }, 'corr-123')
      const json = error.toJSON()

      expect(json.message).toBe('Test')
      expect(json.code).toBe('TEST_ERROR')
      expect(json.statusCode).toBe(400)
      expect(json.details).toEqual({ test: true })
      expect(json.correlationId).toBe('corr-123')
      expect(json.timestamp).toBeDefined()
    })

    it('should return user friendly message', () => {
      const errorWithUserMessage = new ClientAPIError('Tech error', 'TEST', 400, undefined, undefined, 'User message')
      const errorWithoutUserMessage = new ClientAPIError('Tech error', 'VALIDATION_ERROR', 400)

      expect(errorWithUserMessage.getUserFriendlyMessage()).toBe('User message')
      expect(errorWithoutUserMessage.getUserFriendlyMessage()).toBe('Please check your input and try again.')
    })
  })

  describe('NetworkError', () => {
    it('should create network error with defaults', () => {
      const error = new NetworkError()

      expect(error.message).toBe('Network connection failed')
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.statusCode).toBe(0)
      expect(error.isRetryable).toBe(true)
      expect(error.userMessage).toBe('Unable to connect to the server. Please check your internet connection and try again.')
    })

    it('should create network error with custom message', () => {
      const error = new NetworkError('Custom network error', 'corr-123')

      expect(error.message).toBe('Custom network error')
      expect(error.correlationId).toBe('corr-123')
    })
  })

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError(5000)

      expect(error.message).toBe('Request timed out after 5000ms')
      expect(error.code).toBe('TIMEOUT_ERROR')
      expect(error.statusCode).toBe(408)
      expect(error.details).toEqual({ timeout: 5000 })
      expect(error.isRetryable).toBe(true)
      expect(error.userMessage).toBe('The request is taking longer than expected. Please try again.')
    })
  })
})

describe('Default User Messages', () => {
  it('should return correct messages for error codes', () => {
    expect(getDefaultUserMessage('VALIDATION_ERROR', 400)).toBe('Please check your input and try again.')
    expect(getDefaultUserMessage('UNAUTHORIZED', 401)).toBe('Please log in to access this resource.')
    expect(getDefaultUserMessage('NOT_FOUND', 404)).toBe('The requested resource could not be found.')
    expect(getDefaultUserMessage('RATE_LIMIT_EXCEEDED', 429)).toBe('Too many requests. Please try again later.')
    expect(getDefaultUserMessage('INTERNAL_SERVER_ERROR', 500)).toBe('An unexpected error occurred. Please try again later.')
  })

  it('should fallback to status code messages for unknown codes', () => {
    expect(getDefaultUserMessage('UNKNOWN_CODE', 400)).toBe('Invalid request. Please check your input.')
    expect(getDefaultUserMessage('UNKNOWN_CODE', 401)).toBe('Authentication required. Please log in.')
    expect(getDefaultUserMessage('UNKNOWN_CODE', 500)).toBe('Server error. Please try again later.')
  })

  it('should return generic message for unknown status codes', () => {
    expect(getDefaultUserMessage('UNKNOWN_CODE', 999)).toBe('An unexpected error occurred.')
  })
})

describe('Retry Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success')
    
    const result = await withRetry(operation)
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable errors', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new ClientAPIError('Server error', 'INTERNAL_ERROR', 500))
      .mockRejectedValueOnce(new ClientAPIError('Server error', 'INTERNAL_ERROR', 500))
      .mockResolvedValue('success')
    
    const result = await withRetry(operation, { maxRetries: 3, baseDelay: 10 })
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('should not retry on non-retryable errors', async () => {
    const operation = vi.fn().mockRejectedValue(new ClientAPIError('Bad request', 'VALIDATION_ERROR', 400))
    
    await expect(withRetry(operation)).rejects.toThrow('Bad request')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('should respect max retries limit', async () => {
    const operation = vi.fn().mockRejectedValue(new ClientAPIError('Server error', 'INTERNAL_ERROR', 500))
    
    await expect(withRetry(operation, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow('Server error')
    expect(operation).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should apply exponential backoff', async () => {
    const operation = vi.fn().mockRejectedValue(new ClientAPIError('Server error', 'INTERNAL_ERROR', 500))
    const startTime = Date.now()
    
    await expect(withRetry(operation, { 
      maxRetries: 2, 
      baseDelay: 100,
      backoffFactor: 2 
    })).rejects.toThrow()
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should take at least 100ms (first retry) + 200ms (second retry) = 300ms
    // Adding some tolerance for test execution time
    expect(duration).toBeGreaterThan(250)
  })

  it('should respect max delay', async () => {
    const operation = vi.fn().mockRejectedValue(new ClientAPIError('Server error', 'INTERNAL_ERROR', 500))
    
    await expect(withRetry(operation, { 
      maxRetries: 3, 
      baseDelay: 1000,
      maxDelay: 100,
      backoffFactor: 10
    })).rejects.toThrow()
    
    expect(operation).toHaveBeenCalledTimes(4)
  })

  it('should handle network errors', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValue('success')
    
    const result = await withRetry(operation, { maxRetries: 2, baseDelay: 10 })
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(2)
  })
})

describe('Fallback Utility', () => {
  it('should return operation result on success', async () => {
    const operation = vi.fn().mockResolvedValue('success')
    
    const result = await withFallback(operation, { fallbackValue: 'fallback' })
    
    expect(result).toBe('success')
  })

  it('should return fallback value on error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'))
    
    const result = await withFallback(operation, { fallbackValue: 'fallback' })
    
    expect(result).toBe('fallback')
  })

  it('should call fallback function on error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'))
    const fallbackFunction = vi.fn().mockResolvedValue('dynamic fallback')
    
    const result = await withFallback(operation, { fallbackFunction })
    
    expect(result).toBe('dynamic fallback')
    expect(fallbackFunction).toHaveBeenCalled()
  })

  it('should prefer fallback function over fallback value', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'))
    const fallbackFunction = vi.fn().mockResolvedValue('function result')
    
    const result = await withFallback(operation, { 
      fallbackValue: 'value result',
      fallbackFunction 
    })
    
    expect(result).toBe('function result')
  })

  it('should re-throw error if no fallback provided', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'))
    
    await expect(withFallback(operation, {})).rejects.toThrow('Failed')
  })
})

describe('Circuit Breaker', () => {
  let circuitBreaker: CircuitBreaker

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(2, 100) // 2 failures, 100ms recovery
  })

  it('should start in CLOSED state', () => {
    expect(circuitBreaker.getState()).toBe('CLOSED')
  })

  it('should execute operation successfully in CLOSED state', async () => {
    const operation = vi.fn().mockResolvedValue('success')
    
    const result = await circuitBreaker.execute(operation)
    
    expect(result).toBe('success')
    expect(circuitBreaker.getState()).toBe('CLOSED')
  })

  it('should open circuit after failure threshold', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'))
    
    // First failure
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed')
    expect(circuitBreaker.getState()).toBe('CLOSED')
    
    // Second failure - should open circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failed')
    expect(circuitBreaker.getState()).toBe('OPEN')
  })

  it('should reject immediately when circuit is OPEN', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'))
    
    // Trigger failures to open circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow()
    await expect(circuitBreaker.execute(operation)).rejects.toThrow()
    expect(circuitBreaker.getState()).toBe('OPEN')
    
    // Should reject immediately without calling operation
    operation.mockClear()
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is open')
    expect(operation).not.toHaveBeenCalled()
  })

  it('should transition to HALF_OPEN after recovery timeout', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'))
    
    // Open the circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow()
    await expect(circuitBreaker.execute(operation)).rejects.toThrow()
    expect(circuitBreaker.getState()).toBe('OPEN')
    
    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Next call should transition to HALF_OPEN and execute
    operation.mockResolvedValueOnce('success')
    const result = await circuitBreaker.execute(operation)
    
    expect(result).toBe('success')
    expect(circuitBreaker.getState()).toBe('CLOSED')
  })

  it('should reset circuit breaker', () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'))
    
    // Open the circuit
    circuitBreaker.execute(operation).catch(() => {})
    circuitBreaker.execute(operation).catch(() => {})
    
    circuitBreaker.reset()
    expect(circuitBreaker.getState()).toBe('CLOSED')
  })
})

describe('Error Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should log client error with context', () => {
    const error = new Error('Test error')
    const errorInfo = { componentStack: 'Component stack trace' }
    
    logClientError(error, errorInfo)
    
    expect(console.error).toHaveBeenCalledWith('Client error:', {
      message: 'Test error',
      stack: error.stack,
      componentStack: 'Component stack trace',
      timestamp: expect.any(String),
      userAgent: 'Test Browser',
      url: 'http://localhost:3000/test'
    })
  })

  it('should log client error without error info', () => {
    const error = new Error('Test error')
    
    logClientError(error)
    
    expect(console.error).toHaveBeenCalledWith('Client error:', {
      message: 'Test error',
      stack: error.stack,
      componentStack: undefined,
      timestamp: expect.any(String),
      userAgent: 'Test Browser',
      url: 'http://localhost:3000/test'
    })
  })
})