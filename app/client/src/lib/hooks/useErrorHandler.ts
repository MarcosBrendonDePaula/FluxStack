import React, { useState, useCallback, useRef } from 'react'
import { logClientError } from '../errors'
import { getErrorMessage, isRetryableError, shouldShowErrorToUser } from '../eden-api'

export interface ErrorState {
  error: Error | null
  isRetrying: boolean
  retryCount: number
  canRetry: boolean
  userMessage: string | null
}

export interface UseErrorHandlerOptions {
  maxRetries?: number
  showUserFriendlyMessages?: boolean
  logErrors?: boolean
  onError?: (error: Error) => void
  onRetry?: (retryCount: number) => void
  onMaxRetriesReached?: (error: Error) => void
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    maxRetries = 3,
    showUserFriendlyMessages = true,
    logErrors = true,
    onError,
    onRetry,
    onMaxRetriesReached
  } = options

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: false,
    userMessage: null
  })

  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const handleError = useCallback((error: Error) => {
    if (logErrors) {
      logClientError(error, undefined)
    }

    setErrorState(prevState => {
      const currentRetryCount = prevState?.retryCount || 0
      const canRetry = isRetryableError(error) && currentRetryCount < maxRetries
      const userMessage = showUserFriendlyMessages && shouldShowErrorToUser(error)
        ? getErrorMessage(error)
        : null

      return {
        error,
        isRetrying: false,
        retryCount: currentRetryCount,
        canRetry,
        userMessage
      }
    })

    onError?.(error)
  }, [maxRetries, showUserFriendlyMessages, logErrors, onError])

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (!errorState.canRetry || errorState.isRetrying) {
      return
    }

    const newRetryCount = (errorState?.retryCount || 0) + 1
    
    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: newRetryCount
    }))

    onRetry?.(newRetryCount)

    try {
      // Add exponential backoff delay
      const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000)
      await new Promise(resolve => {
        retryTimeoutRef.current = setTimeout(resolve, delay)
      })

      const result = await operation()
      
      // Clear error state on successful retry
      setErrorState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: false,
        userMessage: null
      })

      return result
    } catch (error) {
      const canRetryAgain = isRetryableError(error as Error) && newRetryCount < maxRetries
      
      setErrorState(prev => ({
        ...prev,
        error: error as Error,
        isRetrying: false,
        retryCount: newRetryCount,
        canRetry: canRetryAgain,
        userMessage: showUserFriendlyMessages && shouldShowErrorToUser(error)
          ? getErrorMessage(error)
          : null
      }))

      if (!canRetryAgain) {
        onMaxRetriesReached?.(error as Error)
      }

      throw error
    }
  }, [errorState?.retryCount, errorState?.canRetry, errorState?.isRetrying, maxRetries, showUserFriendlyMessages, onRetry, onMaxRetriesReached])

  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: false,
      userMessage: null
    })
  }, [])

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      clearError()
      return await operation()
    } catch (error) {
      handleError(error as Error)
      return null
    }
  }, [handleError, clearError])

  return {
    ...errorState,
    handleError,
    retry,
    clearError,
    executeWithErrorHandling
  }
}

// Hook for handling API calls with automatic error handling
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  options: UseErrorHandlerOptions & {
    immediate?: boolean
    dependencies?: any[]
  } = {}
) {
  const { immediate = false, dependencies = [], ...errorOptions } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  
  const errorHandler = useErrorHandler(errorOptions)

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true)
    
    try {
      const result = await apiCall()
      setData(result)
      errorHandler.clearError()
      return result
    } catch (error) {
      errorHandler.handleError(error as Error)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiCall, errorHandler])

  const retryCall = useCallback(async () => {
    return errorHandler.retry(async () => {
      setLoading(true)
      try {
        const result = await apiCall()
        setData(result)
        return result
      } finally {
        setLoading(false)
      }
    })
  }, [apiCall, errorHandler])

  // Execute immediately if requested
  React.useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, ...dependencies])

  const { retry: errorHandlerRetry, ...restErrorHandler } = errorHandler
  
  return {
    data,
    loading,
    execute,
    retry: retryCall,
    ...restErrorHandler
  }
}

// Hook for form submission with error handling
export function useFormSubmission<T>(
  submitFunction: (data: any) => Promise<T>,
  options: UseErrorHandlerOptions = {}
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitData, setSubmitData] = useState<T | null>(null)
  
  const errorHandler = useErrorHandler(options)

  const submit = useCallback(async (formData: any): Promise<T | null> => {
    setIsSubmitting(true)
    
    try {
      const result = await submitFunction(formData)
      setSubmitData(result)
      errorHandler.clearError()
      return result
    } catch (error) {
      errorHandler.handleError(error as Error)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [submitFunction, errorHandler])

  const retrySubmit = useCallback(async (formData: any) => {
    return errorHandler.retry(() => submit(formData))
  }, [submit, errorHandler])

  const { retry: errorHandlerRetry, ...restErrorHandler } = errorHandler

  return {
    submit,
    retry: retrySubmit,
    isSubmitting,
    submitData,
    ...restErrorHandler
  }
}