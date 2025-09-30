/**
 * Tests for Enhanced Logger System
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { 
  createLogger, 
  ConsoleTransport, 
  JSONTransport,
  createElysiaLoggerMiddleware,
  createDatabaseLoggerMiddleware,
  createPluginLoggerMiddleware
} from '../logger/index'
import type { LoggerConfig } from '../logger/index'

describe('Enhanced Logger System', () => {
  let originalConsole: any

  beforeEach(() => {
    originalConsole = { ...console }
    console.debug = mock(() => {})
    console.info = mock(() => {})
    console.warn = mock(() => {})
    console.error = mock(() => {})
  })

  afterEach(() => {
    Object.assign(console, originalConsole)
  })

  describe('Logger Creation and Configuration', () => {
    it('should create logger with custom config', () => {
      const config: LoggerConfig = {
        level: 'debug',
        transports: [
          new ConsoleTransport({ level: 'debug', colors: false }),
          new JSONTransport({ level: 'info' })
        ],
        defaultMeta: { service: 'test-service' }
      }

      const logger = createLogger(config)
      
      expect(logger).toBeDefined()
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
    })

    it('should support multiple transports', async () => {
      const logger = createLogger({
        level: 'info',
        transports: [
          new ConsoleTransport({ level: 'info' }),
          new JSONTransport({ level: 'warn' })
        ]
      })

      logger.info('Test info message')
      logger.warn('Test warning message')
      logger.debug('Test debug message') // Should be filtered out

      // Wait for async transport writes
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(console.info).toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
      expect(console.debug).not.toHaveBeenCalled()
    })

    it('should support contextual logging with child loggers', () => {
      const logger = createLogger({
        level: 'info',
        transports: [new ConsoleTransport()]
      })

      const childLogger = logger.child({ requestId: 'req-123', userId: 456 })
      childLogger.info('Message from child logger')

      expect(console.info).toHaveBeenCalled()
    })

    it('should support transport management', () => {
      const logger = createLogger({
        level: 'info',
        transports: [new ConsoleTransport({ level: 'info' })]
      })

      // Add new transport
      const jsonTransport = new JSONTransport({ level: 'warn' })
      logger.addTransport(jsonTransport)

      // Remove transport
      logger.removeTransport('json')

      expect(logger).toBeDefined()
    })

    it('should handle logger cleanup', async () => {
      const logger = createLogger({
        level: 'info',
        transports: [new ConsoleTransport()]
      })

      // Should not throw when closing
      await logger.close()
      expect(true).toBe(true) // Test passes if no error is thrown
    })
  })

  describe('Middleware Integration', () => {
    it('should create Elysia logger middleware', () => {
      const logger = createLogger({
        level: 'info',
        transports: [new ConsoleTransport()]
      })

      const middleware = createElysiaLoggerMiddleware(logger)

      expect(middleware).toBeDefined()
      expect(typeof middleware.beforeHandle).toBe('function')
      expect(typeof middleware.afterHandle).toBe('function')
      expect(typeof middleware.onError).toBe('function')
    })

    it('should handle request lifecycle in Elysia middleware', () => {
      const logger = createLogger({
        level: 'info',
        transports: [new ConsoleTransport()]
      })

      const middleware = createElysiaLoggerMiddleware(logger)
      
      // Mock request and response objects
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/api/test',
        headers: new Map([
          ['user-agent', 'test-agent'],
          ['x-forwarded-for', '127.0.0.1']
        ])
      }

      const mockSet = {}
      const mockResponse = { status: 200 }

      // Test beforeHandle
      middleware.beforeHandle({ request: mockRequest, set: mockSet })
      
      expect(mockSet).toHaveProperty('requestId')
      expect(mockSet).toHaveProperty('logger')
      expect(mockSet).toHaveProperty('performance')

      // Test afterHandle
      middleware.afterHandle({ 
        request: mockRequest, 
        response: mockResponse, 
        set: mockSet 
      })

      expect(console.info).toHaveBeenCalled()
    })

    it('should create database logger middleware', () => {
      const logger = createLogger({
        level: 'debug',
        transports: [new ConsoleTransport()]
      })

      const middleware = createDatabaseLoggerMiddleware(logger)

      expect(middleware).toBeDefined()
      expect(typeof middleware.beforeQuery).toBe('function')
      expect(typeof middleware.afterQuery).toBe('function')
      expect(typeof middleware.onQueryError).toBe('function')
    })

    it('should handle database query lifecycle', () => {
      const logger = createLogger({
        level: 'debug',
        transports: [new ConsoleTransport()]
      })

      const middleware = createDatabaseLoggerMiddleware(logger)
      
      const queryId = middleware.beforeQuery(
        'SELECT * FROM users WHERE id = ?',
        [123]
      )

      expect(queryId).toBeDefined()
      expect(typeof queryId).toBe('string')
      expect(queryId).toMatch(/^query:/)

      // Test successful query completion
      middleware.afterQuery(queryId, { rowCount: 1 })
      
      // Test error handling
      const errorQueryId = middleware.beforeQuery('SELECT * FROM invalid')
      middleware.onQueryError(errorQueryId, new Error('Table not found'))
      
      expect(errorQueryId).toBeDefined()
    })

    it('should create plugin logger middleware', () => {
      const logger = createLogger({
        level: 'debug',
        transports: [new ConsoleTransport()]
      })

      const middleware = createPluginLoggerMiddleware(logger)

      expect(middleware).toBeDefined()
      expect(typeof middleware.beforePluginExecution).toBe('function')
      expect(typeof middleware.afterPluginExecution).toBe('function')
      expect(typeof middleware.onPluginError).toBe('function')
    })

    it('should handle plugin execution lifecycle', () => {
      const logger = createLogger({
        level: 'debug',
        transports: [new ConsoleTransport()]
      })

      const middleware = createPluginLoggerMiddleware(logger)
      
      const executionId = middleware.beforePluginExecution(
        'test-plugin',
        'onRequest',
        { path: '/api/test' }
      )

      expect(executionId).toBeDefined()
      expect(typeof executionId).toBe('string')
      expect(executionId).toMatch(/^plugin:test-plugin:onRequest:/)

      // Test successful execution
      middleware.afterPluginExecution(executionId, { success: true })

      // Test error handling
      const errorExecutionId = middleware.beforePluginExecution('error-plugin', 'onError')
      middleware.onPluginError(errorExecutionId, 'error-plugin', 'onError', new Error('Plugin failed'))
      
      expect(errorExecutionId).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle transport errors gracefully', async () => {
      // Create a mock transport that throws errors
      const errorTransport = {
        name: 'error-transport',
        level: 'info' as const,
        write: mock(() => {
          throw new Error('Transport error')
        })
      }

      const logger = createLogger({
        level: 'info',
        transports: [errorTransport]
      })

      // Should not throw, but should handle error internally
      expect(() => {
        logger.info('Test message')
      }).not.toThrow()

      await new Promise(resolve => setTimeout(resolve, 10))
    })

    it('should handle async transport errors', async () => {
      const asyncErrorTransport = {
        name: 'async-error-transport',
        level: 'info' as const,
        write: mock(async () => {
          throw new Error('Async transport error')
        })
      }

      const logger = createLogger({
        level: 'info',
        transports: [asyncErrorTransport]
      })

      logger.info('Test async message')
      
      // Wait for async error handling
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should have handled error gracefully
      expect(asyncErrorTransport.write).toHaveBeenCalled()
    })
  })

  describe('Performance Integration', () => {
    it('should integrate performance logging with main logger', async () => {
      const logger = createLogger({
        level: 'debug',
        transports: [new ConsoleTransport()]
      })

      logger.time('test-timer')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      logger.timeEnd('test-timer')
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Timer test-timer:')
      )
    })

    it('should support request logging', () => {
      const logger = createLogger({
        level: 'info',
        transports: [new ConsoleTransport()]
      })

      logger.request('GET', '/api/users', 200, 150)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/users 200 (150ms)')
      )
    })
  })
})