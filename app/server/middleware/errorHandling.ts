/**
 * Error Handling Middleware
 * Provides centralized error handling for the application
 */

import type { Context } from 'elysia'

export interface ErrorResponse {
  error: string
  message: string
  code?: string
  details?: any
  timestamp: string
  requestId?: string
}

/**
 * Custom application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

/**
 * Error handling middleware
 */
export const errorHandlingMiddleware = {
  name: 'error-handling',
  
  onError: async (context: Context, error: Error): Promise<Response> => {
    const requestId = context.store?.requestId || 'unknown'
    
    // Log the error
    console.error('🚨 Error occurred', {
      requestId,
      method: context.request.method,
      path: context.path,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })

    // Handle different error types
    if (error instanceof AppError) {
      return createErrorResponse(
        error.statusCode,
        error.message,
        error.code,
        error.details,
        requestId
      )
    }

    // Handle validation errors from Elysia
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return createErrorResponse(
        400,
        'Validation failed',
        'VALIDATION_ERROR',
        { originalError: error.message },
        requestId
      )
    }

    // Handle syntax errors (malformed JSON, etc.)
    if (error instanceof SyntaxError) {
      return createErrorResponse(
        400,
        'Invalid request format',
        'SYNTAX_ERROR',
        undefined,
        requestId
      )
    }

    // Handle network/timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return createErrorResponse(
        408,
        'Request timeout',
        'TIMEOUT_ERROR',
        undefined,
        requestId
      )
    }

    // Handle database/external service errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
      return createErrorResponse(
        503,
        'Service temporarily unavailable',
        'SERVICE_UNAVAILABLE',
        undefined,
        requestId
      )
    }

    // Default to internal server error
    return createErrorResponse(
      500,
      process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'production' 
        ? undefined 
        : { stack: error.stack },
      requestId
    )
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string,
  details?: any,
  requestId?: string
): Response {
  const errorResponse: ErrorResponse = {
    error: getErrorName(statusCode),
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    requestId
  }

  // Remove undefined fields
  Object.keys(errorResponse).forEach(key => {
    if (errorResponse[key as keyof ErrorResponse] === undefined) {
      delete errorResponse[key as keyof ErrorResponse]
    }
  })

  return new Response(
    JSON.stringify(errorResponse),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Get error name from status code
 */
function getErrorName(statusCode: number): string {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  }

  return errorNames[statusCode] || 'Unknown Error'
}

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return async (context: Context) => {
    try {
      return await fn(context)
    } catch (error) {
      throw error // Let the error middleware handle it
    }
  }
}

/**
 * Create error response helper
 */
export const createError = {
  badRequest: (message: string, details?: any) => 
    new ValidationError(message, details),
  
  unauthorized: (message?: string) => 
    new UnauthorizedError(message),
  
  forbidden: (message?: string) => 
    new ForbiddenError(message),
  
  notFound: (resource?: string) => 
    new NotFoundError(resource),
  
  conflict: (message: string, details?: any) => 
    new ConflictError(message, details),
  
  internal: (message: string, details?: any) => 
    new AppError(message, 500, 'INTERNAL_ERROR', details)
}