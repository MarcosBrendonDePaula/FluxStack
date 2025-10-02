// Enhanced error handling exports
export * from './errors'
export * from './eden-api'
export * from './hooks/useErrorHandler'

// Re-export components
export { ErrorBoundary, useErrorBoundary } from '../components/ErrorBoundary'
export { 
  ErrorDisplay, 
  ErrorToast, 
  InlineError, 
  LoadingWithError, 
  ErrorSummary 
} from '../components/ErrorDisplay'

// Convenience exports for common patterns
export {
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
} from './eden-api'

export {
  ClientAPIError,
  NetworkError,
  TimeoutError,
  withRetry,
  withFallback,
  CircuitBreaker,
  getDefaultUserMessage,
  logClientError
} from './errors'

export {
  useErrorHandler,
  useApiCall,
  useFormSubmission
} from './hooks/useErrorHandler'