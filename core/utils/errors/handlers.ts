import { FluxStackError } from "./index"
import type { Logger } from "../logger"

export interface ErrorHandlerContext {
  logger: Logger
  isDevelopment: boolean
  request?: Request
  path?: string
}

export const errorHandler = (error: Error, context: ErrorHandlerContext) => {
  const { logger, isDevelopment, request, path } = context
  
  if (error instanceof FluxStackError) {
    // Log FluxStack errors with appropriate level
    const logLevel = error.statusCode >= 500 ? 'error' : 'warn'
    logger[logLevel](error.message, {
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      path,
      method: request?.method,
      stack: isDevelopment ? error.stack : undefined
    })
    
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(error.context && { details: error.context }),
        ...(isDevelopment && { stack: error.stack })
      }
    }
  }
  
  // Handle unknown errors
  logger.error('Unhandled error', { 
    error: error.message, 
    stack: error.stack,
    path,
    method: request?.method
  })
  
  return {
    error: {
      message: isDevelopment ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      ...(isDevelopment && { stack: error.stack })
    }
  }
}

export const createErrorHandler = (context: Omit<ErrorHandlerContext, 'request' | 'path'>) => {
  return (error: Error, request?: Request, path?: string) => {
    return errorHandler(error, { ...context, request, path })
  }
}