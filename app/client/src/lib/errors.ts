// Client-side error handling utilities
export interface ClientError {
  message: string
  code: string
  statusCode: number
  details?: any
  timestamp: string
  correlationId?: string
  userMessage?: string
}

export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableStatusCodes: number[]
  retryableErrorCodes: string[]
}

export interface FallbackOptions<T> {
  fallbackValue?: T
  fallbackFunction?: () => T | Promise<T>
  showFallbackMessage?: boolean
}

export class ClientAPIError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: any
  public readonly timestamp: Date
  public readonly correlationId?: string
  public readonly userMessage?: string
  public readonly isRetryable: boolean

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: any,
    correlationId?: string,
    userMessage?: string
  ) {
    super(message)
    this.name = 'ClientAPIError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date()
    this.correlationId = correlationId
    this.userMessage = userMessage
    this.isRetryable = this.determineRetryability()
  }

  private determineRetryability(): boolean {
    // Network errors and server errors are generally retryable
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
    const retryableErrorCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'EXTERNAL_SERVICE_ERROR',
      'DATABASE_ERROR',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED'
    ]

    return retryableStatusCodes.includes(this.statusCode) || 
           retryableErrorCodes.includes(this.code)
  }

  toJSON(): ClientError {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
      userMessage: this.userMessage
    }
  }

  getUserFriendlyMessage(): string {
    if (this.userMessage) {
      return this.userMessage
    }

    return getDefaultUserMessage(this.code, this.statusCode)
  }
}

export class NetworkError extends ClientAPIError {
  constructor(message: string = 'Network connection failed', correlationId?: string) {
    super(
      message,
      'NETWORK_ERROR',
      0,
      undefined,
      correlationId,
      'Unable to connect to the server. Please check your internet connection and try again.'
    )
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends ClientAPIError {
  constructor(timeout: number, correlationId?: string) {
    super(
      `Request timed out after ${timeout}ms`,
      'TIMEOUT_ERROR',
      408,
      { timeout },
      correlationId,
      'The request is taking longer than expected. Please try again.'
    )
    this.name = 'TimeoutError'
  }
}

// Default user-friendly messages
export function getDefaultUserMessage(code: string, statusCode: number): string {
  // First check by error code
  const codeMessages: Record<string, string> = {
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'INVALID_INPUT': 'The information provided is not valid.',
    'MISSING_REQUIRED_FIELD': 'Please fill in all required fields.',
    'UNAUTHORIZED': 'Please log in to access this resource.',
    'INVALID_TOKEN': 'Your session has expired. Please log in again.',
    'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
    'FORBIDDEN': 'You do not have permission to perform this action.',
    'INSUFFICIENT_PERMISSIONS': 'You do not have the required permissions.',
    'NOT_FOUND': 'The requested resource could not be found.',
    'RESOURCE_NOT_FOUND': 'The requested item could not be found.',
    'ENDPOINT_NOT_FOUND': 'The requested service is not available.',
    'CONFLICT': 'There was a conflict with the current state.',
    'RESOURCE_ALREADY_EXISTS': 'This item already exists.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later.',
    'INTERNAL_SERVER_ERROR': 'An unexpected error occurred. Please try again later.',
    'DATABASE_ERROR': 'A database error occurred. Please try again later.',
    'EXTERNAL_SERVICE_ERROR': 'An external service is currently unavailable.',
    'SERVICE_UNAVAILABLE': 'The service is temporarily unavailable.',
    'MAINTENANCE_MODE': 'The service is under maintenance. Please try again later.',
    'NETWORK_ERROR': 'Unable to connect to the server. Please check your connection.',
    'TIMEOUT_ERROR': 'The request timed out. Please try again.'
  }

  if (codeMessages[code]) {
    return codeMessages[code]
  }

  // Fallback to status code messages
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'Access denied. You do not have permission.',
    404: 'Resource not found.',
    409: 'Conflict with existing data.',
    422: 'Invalid data provided.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service temporarily unavailable.',
    504: 'Request timeout. Please try again.'
  }

  return statusMessages[statusCode] || 'An unexpected error occurred.'
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableErrorCodes: [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'EXTERNAL_SERVICE_ERROR',
      'DATABASE_ERROR',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED'
    ],
    ...options
  }

  let lastError: Error | undefined
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        break
      }

      // Check if error is retryable
      if (error instanceof ClientAPIError) {
        const isRetryableStatus = config.retryableStatusCodes.includes(error.statusCode)
        const isRetryableCode = config.retryableErrorCodes.includes(error.code)
        
        if (!isRetryableStatus && !isRetryableCode) {
          break // Don't retry non-retryable errors
        }
      } else if (!(error instanceof NetworkError || error instanceof TimeoutError)) {
        break // Don't retry unknown errors
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt),
        config.maxDelay
      )

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000

      await new Promise(resolve => setTimeout(resolve, jitteredDelay))
    }
  }

  throw lastError!
}

// Fallback utility
export async function withFallback<T>(
  operation: () => Promise<T>,
  fallbackOptions: FallbackOptions<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.warn('Operation failed, using fallback:', error)
    
    if (fallbackOptions.fallbackFunction) {
      return await fallbackOptions.fallbackFunction()
    }
    
    if (fallbackOptions.fallbackValue !== undefined) {
      return fallbackOptions.fallbackValue
    }
    
    throw error // Re-throw if no fallback provided
  }
}

// Circuit breaker pattern for preventing cascading failures
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  private failureThreshold: number
  private recoveryTimeout: number

  constructor(
    failureThreshold: number = 5,
    recoveryTimeout: number = 60000
  ) {
    this.failureThreshold = failureThreshold
    this.recoveryTimeout = recoveryTimeout
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new ClientAPIError(
          'Circuit breaker is open',
          'CIRCUIT_BREAKER_OPEN',
          503,
          undefined,
          undefined,
          'Service is temporarily unavailable due to repeated failures'
        )
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  getState(): string {
    return this.state
  }

  reset(): void {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = 'CLOSED'
  }
}

// Error boundary helper for React components
export interface ErrorInfo {
  error: Error
  errorInfo: { componentStack: string }
}

export function logClientError(error: Error, errorInfo?: { componentStack: string }): void {
  console.error('Client error:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  })

  // In a real application, you might want to send this to an error tracking service
  // Example: Sentry, LogRocket, etc.
}