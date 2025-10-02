/**
 * Tests for useErrorHandler Hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useErrorHandler, useApiCall, useFormSubmission } from '../hooks/useErrorHandler'
import { ClientAPIError, NetworkError } from '../errors'

// Mock the error utilities
vi.mock('../eden-api', () => ({
  getErrorMessage: vi.fn((error) => {
    if (error instanceof ClientAPIError) {
      return error.userMessage || 'Default error message'
    }
    return 'Unknown error'
  }),
  isRetryableError: vi.fn((error) => {
    if (error instanceof ClientAPIError) {
      return error.isRetryable
    }
    if (error instanceof NetworkError) {
      return true
    }
    return false
  }),
  shouldShowErrorToUser: vi.fn(() => true)
}))

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
  },
  NetworkError: class NetworkError extends Error {
    constructor(message = 'Network error') {
      super(message)
      this.name = 'NetworkError'
    }
  },
  logClientError: vi.fn()
}))

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with no error state', () => {
    const { result } = renderHook(() => useErrorHandler())

    expect(result.current.error).toBeNull()
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.retryCount).toBe(0)
    expect(result.current.canRetry).toBe(false)
    expect(result.current.userMessage).toBeNull()
  })

  it('should handle error correctly', () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useErrorHandler({ onError }))

    const error = new ClientAPIError('Test error', 'VALIDATION_ERROR', 400, undefined, undefined, 'User message')

    act(() => {
      result.current.handleError(error)
    })

    expect(result.current.error).toBe(error)
    expect(result.current.userMessage).toBe('User message')
    expect(result.current.canRetry).toBe(false) // 400 is not retryable
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should handle retryable error', () => {
    const { result } = renderHook(() => useErrorHandler({ maxRetries: 3 }))

    const error = new ClientAPIError('Server error', 'INTERNAL_SERVER_ERROR', 500)

    act(() => {
      result.current.handleError(error)
    })

    expect(result.current.error).toBe(error)
    expect(result.current.canRetry).toBe(true)
    expect(result.current.retryCount).toBe(0)
  })

  it('should retry operation successfully', async () => {
    const onRetry = vi.fn()
    const { result } = renderHook(() => useErrorHandler({ onRetry }))

    const error = new ClientAPIError('Server error', 'INTERNAL_SERVER_ERROR', 500)
    const operation = vi.fn().mockResolvedValue('success')

    // First handle an error
    act(() => {
      result.current.handleError(error)
    })

    expect(result.current.canRetry).toBe(true)

    // Then retry
    let retryResult: any
    await act(async () => {
      retryResult = await result.current.retry(operation)
    })

    expect(retryResult).toBe('success')
    expect(result.current.error).toBeNull()
    expect(result.current.retryCount).toBe(0)
    expect(onRetry).toHaveBeenCalledWith(1)
  })

  it('should handle retry failure', async () => {
    const onMaxRetriesReached = vi.fn()
    const { result } = renderHook(() => useErrorHandler({ 
      maxRetries: 2,
      onMaxRetriesReached 
    }))

    const error = new ClientAPIError('Server error', 'INTERNAL_SERVER_ERROR', 500)
    const operation = vi.fn().mockRejectedValue(error)

    // Handle initial error
    act(() => {
      result.current.handleError(error)
    })

    // Retry and fail
    await act(async () => {
      try {
        await result.current.retry(operation)
      } catch (e) {
        // Expected to fail
      }
    })

    expect(result.current.retryCount).toBe(1)
    expect(result.current.canRetry).toBe(true) // Still can retry

    // Retry again and fail (should reach max retries)
    await act(async () => {
      try {
        await result.current.retry(operation)
      } catch (e) {
        // Expected to fail
      }
    })

    expect(result.current.retryCount).toBe(2)
    expect(result.current.canRetry).toBe(false) // No more retries
    expect(onMaxRetriesReached).toHaveBeenCalledWith(error)
  })

  it('should clear error state', () => {
    const { result } = renderHook(() => useErrorHandler())

    const error = new ClientAPIError('Test error', 'VALIDATION_ERROR', 400)

    act(() => {
      result.current.handleError(error)
    })

    expect(result.current.error).toBe(error)

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.userMessage).toBeNull()
    expect(result.current.retryCount).toBe(0)
  })

  it('should execute operation with error handling', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const operation = vi.fn().mockResolvedValue('success')

    let executeResult: any
    await act(async () => {
      executeResult = await result.current.executeWithErrorHandling(operation)
    })

    expect(executeResult).toBe('success')
    expect(result.current.error).toBeNull()
  })

  it('should handle operation failure in executeWithErrorHandling', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const error = new ClientAPIError('Test error', 'VALIDATION_ERROR', 400)
    const operation = vi.fn().mockRejectedValue(error)

    let executeResult: any
    await act(async () => {
      executeResult = await result.current.executeWithErrorHandling(operation)
    })

    expect(executeResult).toBeNull()
    expect(result.current.error).toBe(error)
  })

  it('should not retry when already retrying', async () => {
    const { result } = renderHook(() => useErrorHandler())

    const error = new ClientAPIError('Server error', 'INTERNAL_SERVER_ERROR', 500)
    const operation = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    act(() => {
      result.current.handleError(error)
    })

    // Start first retry
    const firstRetry = act(async () => {
      return result.current.retry(operation)
    })

    // Try to start second retry while first is in progress
    const secondRetry = act(async () => {
      return result.current.retry(operation)
    })

    await Promise.all([firstRetry, secondRetry])

    // Operation should only be called once
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('should disable user-friendly messages when configured', () => {
    const { result } = renderHook(() => useErrorHandler({ showUserFriendlyMessages: false }))

    const error = new ClientAPIError('Test error', 'VALIDATION_ERROR', 400, undefined, undefined, 'User message')

    act(() => {
      result.current.handleError(error)
    })

    expect(result.current.userMessage).toBeNull()
  })

  it('should disable error logging when configured', () => {
    const { logClientError } = require('../errors')
    const { result } = renderHook(() => useErrorHandler({ logErrors: false }))

    const error = new ClientAPIError('Test error', 'VALIDATION_ERROR', 400)

    act(() => {
      result.current.handleError(error)
    })

    expect(logClientError).not.toHaveBeenCalled()
  })
})

describe('useApiCall', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with null data and not loading', () => {
    const apiCall = vi.fn()
    const { result } = renderHook(() => useApiCall(apiCall))

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should execute API call immediately when immediate is true', async () => {
    const apiCall = vi.fn().mockResolvedValue({ success: true })
    const { result } = renderHook(() => useApiCall(apiCall, { immediate: true }))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ success: true })
    expect(result.current.error).toBeNull()
    expect(apiCall).toHaveBeenCalledTimes(1)
  })

  it('should handle API call error', async () => {
    const error = new ClientAPIError('API error', 'VALIDATION_ERROR', 400)
    const apiCall = vi.fn().mockRejectedValue(error)
    const { result } = renderHook(() => useApiCall(apiCall))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe(error)
    expect(result.current.loading).toBe(false)
  })

  it('should retry API call', async () => {
    const error = new ClientAPIError('Server error', 'INTERNAL_SERVER_ERROR', 500)
    const apiCall = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ success: true })

    const { result } = renderHook(() => useApiCall(apiCall))

    // First call fails
    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.error).toBe(error)
    expect(result.current.canRetry).toBe(true)

    // Retry succeeds
    await act(async () => {
      await result.current.retry()
    })

    expect(result.current.data).toEqual({ success: true })
    expect(result.current.error).toBeNull()
  })

  it('should re-execute when dependencies change', async () => {
    const apiCall = vi.fn().mockResolvedValue({ success: true })
    let dependency = 'initial'

    const { result, rerender } = renderHook(
      ({ dep }) => useApiCall(apiCall, { immediate: true, dependencies: [dep] }),
      { initialProps: { dep: dependency } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(apiCall).toHaveBeenCalledTimes(1)

    // Change dependency
    dependency = 'changed'
    rerender({ dep: dependency })

    await waitFor(() => {
      expect(apiCall).toHaveBeenCalledTimes(2)
    })
  })
})

describe('useFormSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct state', () => {
    const submitFunction = vi.fn()
    const { result } = renderHook(() => useFormSubmission(submitFunction))

    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.submitData).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should submit form successfully', async () => {
    const submitFunction = vi.fn().mockResolvedValue({ id: 1, name: 'Test' })
    const { result } = renderHook(() => useFormSubmission(submitFunction))

    const formData = { name: 'Test', email: 'test@example.com' }

    await act(async () => {
      await result.current.submit(formData)
    })

    expect(result.current.submitData).toEqual({ id: 1, name: 'Test' })
    expect(result.current.error).toBeNull()
    expect(result.current.isSubmitting).toBe(false)
    expect(submitFunction).toHaveBeenCalledWith(formData)
  })

  it('should handle form submission error', async () => {
    const error = new ClientAPIError('Validation failed', 'VALIDATION_ERROR', 400)
    const submitFunction = vi.fn().mockRejectedValue(error)
    const { result } = renderHook(() => useFormSubmission(submitFunction))

    const formData = { name: '', email: 'invalid' }

    await act(async () => {
      await result.current.submit(formData)
    })

    expect(result.current.submitData).toBeNull()
    expect(result.current.error).toBe(error)
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should retry form submission', async () => {
    const error = new ClientAPIError('Server error', 'INTERNAL_SERVER_ERROR', 500)
    const submitFunction = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ id: 1, name: 'Test' })

    const { result } = renderHook(() => useFormSubmission(submitFunction))

    const formData = { name: 'Test', email: 'test@example.com' }

    // First submission fails
    await act(async () => {
      await result.current.submit(formData)
    })

    expect(result.current.error).toBe(error)
    expect(result.current.canRetry).toBe(true)

    // Retry succeeds
    await act(async () => {
      await result.current.retry(formData)
    })

    expect(result.current.submitData).toEqual({ id: 1, name: 'Test' })
    expect(result.current.error).toBeNull()
  })

  it('should show submitting state during submission', async () => {
    let resolveSubmit: (value: any) => void
    const submitFunction = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        resolveSubmit = resolve
      })
    })

    const { result } = renderHook(() => useFormSubmission(submitFunction))

    const formData = { name: 'Test' }

    // Start submission
    act(() => {
      result.current.submit(formData)
    })

    expect(result.current.isSubmitting).toBe(true)

    // Complete submission
    await act(async () => {
      resolveSubmit!({ success: true })
    })

    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.submitData).toEqual({ success: true })
  })

  it('should handle submission with custom error options', async () => {
    const onError = vi.fn()
    const error = new ClientAPIError('Custom error', 'VALIDATION_ERROR', 400)
    const submitFunction = vi.fn().mockRejectedValue(error)
    
    const { result } = renderHook(() => useFormSubmission(submitFunction, { onError }))

    await act(async () => {
      await result.current.submit({ test: 'data' })
    })

    expect(onError).toHaveBeenCalledWith(error)
  })
})