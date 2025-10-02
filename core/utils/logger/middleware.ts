/**
 * FluxStack Logger Middleware Integration
 * Easy integration with Elysia and other frameworks
 */

import type { Logger } from './index'
import { RequestLogger, PerformanceLogger } from './performance'

/**
 * Enhanced logger middleware for Elysia
 */
export function createElysiaLoggerMiddleware(logger: Logger) {
  const requestLogger = new RequestLogger(logger)
  const performanceLogger = new PerformanceLogger(logger)

  return {
    // Before request handler
    beforeHandle: ({ request, set }: any) => {
      const method = request.method
      const url = new URL(request.url)
      const path = url.pathname
      const userAgent = request.headers.get('user-agent')
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'

      // Start request tracking
      const requestId = requestLogger.startRequest(method, path, {
        userAgent,
        ip,
        query: Object.fromEntries(url.searchParams),
        headers: Object.fromEntries(request.headers.entries())
      })

      // Add request context to set for access in handlers
      set.requestId = requestId
      set.logger = requestLogger.childLogger(requestId)
      set.performance = performanceLogger

      // Start overall request timer
      performanceLogger.startTimer(`request:${requestId}`, {
        method,
        path
      })
    },

    // After request handler
    afterHandle: ({ request, response, set }: any) => {
      if (set.requestId) {
        const status = response?.status || 200
        
        // End request tracking
        requestLogger.endRequest(set.requestId, status, {
          responseSize: response?.headers?.get('content-length'),
          contentType: response?.headers?.get('content-type')
        })

        // End request timer
        performanceLogger.endTimer(`request:${set.requestId}`)
      }
    },

    // Error handler
    onError: ({ request, error, set }: any) => {
      if (set.requestId) {
        requestLogger.errorRequest(set.requestId, error)
        performanceLogger.endTimer(`request:${set.requestId}`)
      }

      // Log the error with context
      logger.error('Request error', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        request: {
          method: request.method,
          url: request.url
        }
      })
    }
  }
}

/**
 * Database query logging middleware
 */
export function createDatabaseLoggerMiddleware(logger: Logger) {
  const performanceLogger = new PerformanceLogger(logger)

  return {
    beforeQuery: (query: string, params?: any[]) => {
      const queryId = `query:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
      
      logger.debug('Executing database query', {
        type: 'db_query_start',
        queryId,
        query: query.replace(/\s+/g, ' ').trim(),
        params
      })

      performanceLogger.startTimer(queryId, {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        paramCount: params?.length || 0
      })

      return queryId
    },

    afterQuery: (queryId: string, result?: any) => {
      const duration = performanceLogger.endTimer(queryId)
      
      logger.debug('Database query completed', {
        type: 'db_query_end',
        queryId,
        duration,
        rowCount: result?.rowCount || result?.length || 0
      })
    },

    onQueryError: (queryId: string, error: Error) => {
      performanceLogger.endTimer(queryId)
      
      logger.error('Database query failed', {
        type: 'db_query_error',
        queryId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    }
  }
}

/**
 * Plugin execution logging
 */
export function createPluginLoggerMiddleware(logger: Logger) {
  const performanceLogger = new PerformanceLogger(logger)

  return {
    beforePluginExecution: (pluginName: string, hook: string, context?: any) => {
      const executionId = `plugin:${pluginName}:${hook}:${Date.now()}`
      
      logger.debug(`Executing plugin hook: ${pluginName}.${hook}`, {
        type: 'plugin_execution_start',
        plugin: pluginName,
        hook,
        executionId,
        context
      })

      performanceLogger.startTimer(executionId, {
        plugin: pluginName,
        hook
      })

      return executionId
    },

    afterPluginExecution: (executionId: string, result?: any) => {
      const duration = performanceLogger.endTimer(executionId)
      
      logger.debug('Plugin hook execution completed', {
        type: 'plugin_execution_end',
        executionId,
        duration,
        success: true
      })
    },

    onPluginError: (executionId: string, pluginName: string, hook: string, error: Error) => {
      performanceLogger.endTimer(executionId)
      
      logger.error(`Plugin hook execution failed: ${pluginName}.${hook}`, {
        type: 'plugin_execution_error',
        plugin: pluginName,
        hook,
        executionId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    }
  }
}

/**
 * Build process logging
 */
export function createBuildLoggerMiddleware(logger: Logger) {
  const performanceLogger = new PerformanceLogger(logger)

  return {
    beforeBuild: (target: string, config?: any) => {
      const buildId = `build:${target}:${Date.now()}`
      
      logger.info(`Starting build process for ${target}`, {
        type: 'build_start',
        target,
        buildId,
        config
      })

      performanceLogger.startTimer(buildId, { target })
      performanceLogger.logMemoryUsage(`build-start-${target}`)

      return buildId
    },

    afterBuild: (buildId: string, result: any) => {
      const duration = performanceLogger.endTimer(buildId)
      performanceLogger.logMemoryUsage(`build-end`)
      
      logger.info('Build process completed', {
        type: 'build_end',
        buildId,
        duration,
        success: true,
        result
      })
    },

    onBuildError: (buildId: string, error: Error) => {
      performanceLogger.endTimer(buildId)
      performanceLogger.logMemoryUsage(`build-error`)
      
      logger.error('Build process failed', {
        type: 'build_error',
        buildId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    },

    logBuildStep: (buildId: string, step: string, details?: any) => {
      logger.info(`Build step: ${step}`, {
        type: 'build_step',
        buildId,
        step,
        details
      })
    }
  }
}