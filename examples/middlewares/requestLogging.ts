/**
 * Request Logging Middleware
 * Logs HTTP requests with timing and context information
 */

import type { Context } from 'elysia'

export interface RequestLogConfig {
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  includeBody?: boolean
  includeHeaders?: boolean
  excludePaths?: string[]
  excludeHeaders?: string[]
  maxBodyLength?: number
}

/**
 * Request logging middleware
 */
export const requestLoggingMiddleware = (config: RequestLogConfig = {}) => ({
  name: 'request-logging',
  
  beforeHandle: async (context: Context) => {
    // Skip logging for excluded paths
    if (config.excludePaths?.includes(context.path)) {
      return
    }

    const startTime = Date.now()
    
    // Store start time for duration calculation
    context.store = { ...context.store, startTime }
    
    // Log request start
    const requestId = generateRequestId()
    context.store = { ...context.store, requestId }
    
    const logData: any = {
      requestId,
      method: context.request.method,
      path: context.path,
      query: context.query,
      userAgent: context.headers['user-agent'],
      ip: getClientIp(context),
      timestamp: new Date().toISOString()
    }

    // Include headers if configured
    if (config.includeHeaders) {
      const headers = { ...context.headers }
      
      // Remove sensitive headers
      const excludeHeaders = config.excludeHeaders || [
        'authorization',
        'cookie',
        'x-api-key'
      ]
      
      excludeHeaders.forEach(header => {
        delete headers[header.toLowerCase()]
      })
      
      logData.headers = headers
    }

    // Include body if configured
    if (config.includeBody && context.body) {
      let body = context.body
      
      // Truncate large bodies
      if (config.maxBodyLength && typeof body === 'string') {
        if (body.length > config.maxBodyLength) {
          body = body.substring(0, config.maxBodyLength) + '...[truncated]'
        }
      }
      
      logData.body = body
    }

    console.log('📥 Request started', logData)
  },
  
  afterHandle: async (context: Context, response: Response) => {
    const startTime = context.store?.startTime
    const requestId = context.store?.requestId
    
    if (!startTime) return
    
    const duration = Date.now() - startTime
    
    const logData: any = {
      requestId,
      method: context.request.method,
      path: context.path,
      status: response.status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }

    // Determine log level based on status code
    let logLevel = config.logLevel || 'info'
    
    if (response.status >= 500) {
      logLevel = 'error'
    } else if (response.status >= 400) {
      logLevel = 'warn'
    }

    // Add performance warning for slow requests
    if (duration > 1000) {
      logData.warning = 'Slow request detected'
      logLevel = 'warn'
    }

    const logMessage = `📤 Request completed - ${context.request.method} ${context.path} ${response.status} (${duration}ms)`
    
    switch (logLevel) {
      case 'error':
        console.error(logMessage, logData)
        break
      case 'warn':
        console.warn(logMessage, logData)
        break
      case 'debug':
        console.debug(logMessage, logData)
        break
      default:
        console.log(logMessage, logData)
    }
  },
  
  onError: async (context: Context, error: Error) => {
    const startTime = context.store?.startTime
    const requestId = context.store?.requestId
    const duration = startTime ? Date.now() - startTime : 0
    
    const logData = {
      requestId,
      method: context.request.method,
      path: context.path,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }

    console.error('💥 Request failed', logData)
  }
})

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get client IP address
 */
function getClientIp(context: Context): string {
  // Try to get real IP from various headers
  const forwarded = context.headers['x-forwarded-for']
  const realIp = context.headers['x-real-ip']
  const cfConnectingIp = context.headers['cf-connecting-ip']
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  return 'unknown'
}

/**
 * Predefined configurations
 */
export const requestLoggingConfigs = {
  // Development configuration - verbose logging
  development: {
    logLevel: 'debug' as const,
    includeBody: true,
    includeHeaders: true,
    maxBodyLength: 1000,
    excludeHeaders: ['authorization', 'cookie']
  },

  // Production configuration - minimal logging
  production: {
    logLevel: 'info' as const,
    includeBody: false,
    includeHeaders: false,
    excludePaths: ['/health', '/metrics']
  },

  // Security-focused configuration
  security: {
    logLevel: 'warn' as const,
    includeBody: false,
    includeHeaders: true,
    excludeHeaders: [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token'
    ]
  }
}