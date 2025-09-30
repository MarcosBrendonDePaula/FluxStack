/**
 * FluxStack Performance and Request Logging
 * Utilities for measuring and logging performance metrics
 */

import { randomUUID } from 'crypto'
import type { Logger } from './index'

export interface RequestContext {
  id: string
  method: string
  path: string
  userAgent?: string
  ip?: string
  startTime: number
  endTime?: number
  duration?: number
  status?: number
  error?: Error
  meta?: any
}

export interface PerformanceTimer {
  label: string
  startTime: number
  endTime?: number
  duration?: number
  meta?: any
}

/**
 * Request correlation and contextual logging
 */
export class RequestLogger {
  private logger: Logger
  private activeRequests: Map<string, RequestContext> = new Map()

  constructor(logger: Logger) {
    this.logger = logger
  }

  /**
   * Start tracking a request
   */
  startRequest(method: string, path: string, meta?: any): string {
    const id = randomUUID()
    const context: RequestContext = {
      id,
      method,
      path,
      startTime: Date.now(),
      meta
    }

    this.activeRequests.set(id, context)
    
    // Log request start
    this.logger.child({ requestId: id }).info(`→ ${method} ${path}`, {
      type: 'request_start',
      method,
      path,
      ...meta
    })

    return id
  }

  /**
   * End tracking a request
   */
  endRequest(id: string, status: number, meta?: any): void {
    const context = this.activeRequests.get(id)
    if (!context) return

    const endTime = Date.now()
    const duration = endTime - context.startTime

    context.endTime = endTime
    context.duration = duration
    context.status = status

    // Determine log level based on status and duration
    const logLevel = this.getRequestLogLevel(status, duration)
    const statusEmoji = this.getStatusEmoji(status)
    
    // Log request completion
    this.logger.child({ requestId: id })[logLevel](
      `← ${context.method} ${context.path} ${statusEmoji} ${status} (${duration}ms)`,
      {
        type: 'request_end',
        method: context.method,
        path: context.path,
        status,
        duration,
        ...context.meta,
        ...meta
      }
    )

    // Clean up
    this.activeRequests.delete(id)
  }

  /**
   * Log request error
   */
  errorRequest(id: string, error: Error, status?: number): void {
    const context = this.activeRequests.get(id)
    if (!context) return

    const endTime = Date.now()
    const duration = endTime - context.startTime
    const finalStatus = status || 500

    context.endTime = endTime
    context.duration = duration
    context.status = finalStatus
    context.error = error

    // Log request error
    this.logger.child({ requestId: id }).error(
      `✗ ${context.method} ${context.path} ${finalStatus} (${duration}ms)`,
      {
        type: 'request_error',
        method: context.method,
        path: context.path,
        status: finalStatus,
        duration,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        ...context.meta
      }
    )

    // Clean up
    this.activeRequests.delete(id)
  }

  /**
   * Get request context for correlation
   */
  getRequestContext(id: string): RequestContext | undefined {
    return this.activeRequests.get(id)
  }

  /**
   * Create child logger with request context
   */
  childLogger(id: string, additionalContext?: any): Logger {
    const context = this.activeRequests.get(id)
    if (!context) {
      return this.logger.child({ requestId: id, ...additionalContext })
    }

    return this.logger.child({
      requestId: id,
      method: context.method,
      path: context.path,
      ...additionalContext
    })
  }

  private getRequestLogLevel(status: number, duration: number): 'info' | 'warn' | 'error' {
    if (status >= 500) return 'error'
    if (status >= 400) return 'warn'
    if (duration > 5000) return 'warn' // Slow requests
    return 'info'
  }

  private getStatusEmoji(status: number): string {
    if (status >= 500) return '💥'
    if (status >= 400) return '⚠️'
    if (status >= 300) return '↩️'
    if (status >= 200) return '✅'
    return '❓'
  }
}

/**
 * Performance timing utilities
 */
export class PerformanceLogger {
  private logger: Logger
  private timers: Map<string, PerformanceTimer> = new Map()

  constructor(logger: Logger) {
    this.logger = logger
  }

  /**
   * Start a performance timer
   */
  startTimer(label: string, meta?: any): void {
    const timer: PerformanceTimer = {
      label,
      startTime: performance.now(),
      meta
    }

    this.timers.set(label, timer)
    
    this.logger.debug(`⏱️  Started timer: ${label}`, {
      type: 'timer_start',
      label,
      ...meta
    })
  }

  /**
   * End a performance timer
   */
  endTimer(label: string, meta?: any): number | undefined {
    const timer = this.timers.get(label)
    if (!timer) {
      this.logger.warn(`Timer not found: ${label}`)
      return undefined
    }

    const endTime = performance.now()
    const duration = endTime - timer.startTime

    timer.endTime = endTime
    timer.duration = duration

    // Determine log level based on duration
    const logLevel = this.getTimerLogLevel(duration)
    const durationEmoji = this.getDurationEmoji(duration)

    this.logger[logLevel](`${durationEmoji} Timer ${label}: ${duration.toFixed(2)}ms`, {
      type: 'timer_end',
      label,
      duration,
      ...timer.meta,
      ...meta
    })

    // Clean up
    this.timers.delete(label)

    return duration
  }

  /**
   * Measure execution time of a function
   */
  async measure<T>(label: string, fn: () => Promise<T>, meta?: any): Promise<T> {
    this.startTimer(label, meta)
    try {
      const result = await fn()
      this.endTimer(label, { success: true })
      return result
    } catch (error) {
      this.endTimer(label, { success: false, error: error.message })
      throw error
    }
  }

  /**
   * Measure execution time of a synchronous function
   */
  measureSync<T>(label: string, fn: () => T, meta?: any): T {
    this.startTimer(label, meta)
    try {
      const result = fn()
      this.endTimer(label, { success: true })
      return result
    } catch (error) {
      this.endTimer(label, { success: false, error: error.message })
      throw error
    }
  }

  /**
   * Log memory usage
   */
  logMemoryUsage(label?: string): void {
    const memUsage = process.memoryUsage()
    const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB'

    this.logger.info(`📊 Memory usage${label ? ` (${label})` : ''}`, {
      type: 'memory_usage',
      label,
      memory: {
        rss: formatBytes(memUsage.rss),
        heapTotal: formatBytes(memUsage.heapTotal),
        heapUsed: formatBytes(memUsage.heapUsed),
        external: formatBytes(memUsage.external)
      },
      raw: memUsage
    })
  }

  /**
   * Log system performance metrics
   */
  logSystemMetrics(label?: string): void {
    const cpuUsage = process.cpuUsage()
    const uptime = process.uptime()

    this.logger.info(`⚡ System metrics${label ? ` (${label})` : ''}`, {
      type: 'system_metrics',
      label,
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: {
        seconds: uptime,
        formatted: this.formatUptime(uptime)
      }
    })
  }

  private getTimerLogLevel(duration: number): 'debug' | 'info' | 'warn' {
    if (duration > 1000) return 'warn' // > 1 second
    if (duration > 100) return 'info'  // > 100ms
    return 'debug'
  }

  private getDurationEmoji(duration: number): string {
    if (duration > 5000) return '🐌' // Very slow
    if (duration > 1000) return '⏳' // Slow
    if (duration > 100) return '⏱️'  // Medium
    return '⚡' // Fast
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }
}

/**
 * Middleware for automatic request logging
 */
export function createRequestLoggingMiddleware(logger: Logger) {
  const requestLogger = new RequestLogger(logger)

  return {
    onRequest: (request: any) => {
      const method = request.method
      const path = request.url || request.path
      const userAgent = request.headers?.['user-agent']
      const ip = request.headers?.['x-forwarded-for'] || request.ip

      const requestId = requestLogger.startRequest(method, path, {
        userAgent,
        ip,
        headers: request.headers
      })

      // Attach request ID to request for correlation
      request.requestId = requestId
      request.logger = requestLogger.childLogger(requestId)

      return requestId
    },

    onResponse: (request: any, response: any) => {
      if (request.requestId) {
        const status = response.status || response.statusCode || 200
        requestLogger.endRequest(request.requestId, status, {
          responseHeaders: response.headers
        })
      }
    },

    onError: (request: any, error: Error) => {
      if (request.requestId) {
        requestLogger.errorRequest(request.requestId, error)
      }
    }
  }
}