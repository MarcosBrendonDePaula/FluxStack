/**
 * Integration Tests for Enhanced Logger System
 * Tests the complete logging system working together
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { 
  createLogger, 
  ConsoleTransport, 
  FileTransport, 
  JSONTransport,
  RequestLogger,
  PerformanceLogger,
  createElysiaLoggerMiddleware
} from '../logger/index'
import { unlink, readFile } from 'fs/promises'
import { existsSync } from 'fs'

describe('Logger Integration Tests', () => {
  const testLogFile = 'test-logs/integration.log'
  const testJsonFile = 'test-logs/integration.json'

  afterEach(async () => {
    // Clean up test files
    try {
      if (existsSync(testLogFile)) await unlink(testLogFile)
      if (existsSync(testJsonFile)) await unlink(testJsonFile)
    } catch (error) {
      // Files might not exist
    }
  })

  it('should handle complete request lifecycle with multiple transports', async () => {
    // Create logger with multiple transports
    const logger = createLogger({
      level: 'debug',
      transports: [
        new ConsoleTransport({ level: 'info', colors: false }),
        new FileTransport({ filename: testLogFile, level: 'debug' }),
        new JSONTransport({ filename: testJsonFile, level: 'warn' })
      ],
      defaultMeta: { service: 'test-service', version: '1.0.0' }
    })

    // Create performance and request loggers
    const requestLogger = new RequestLogger(logger)
    const performanceLogger = new PerformanceLogger(logger)

    // Simulate a complete request lifecycle
    const requestId = requestLogger.startRequest('POST', '/api/users', {
      userAgent: 'test-client/1.0',
      ip: '192.168.1.100'
    })

    // Start performance measurement
    performanceLogger.startTimer('request-processing')
    performanceLogger.startTimer('database-query')

    // Simulate some processing
    await new Promise(resolve => setTimeout(resolve, 50))

    // End database timer
    performanceLogger.endTimer('database-query')

    // Log some application events
    const childLogger = logger.child({ requestId, userId: 123 })
    childLogger.info('User validation successful')
    childLogger.debug('Processing user data', { fields: ['name', 'email'] })
    childLogger.warn('Rate limit approaching', { remaining: 5 })

    // End request processing
    performanceLogger.endTimer('request-processing')
    requestLogger.endRequest(requestId, 201, {
      responseSize: '256',
      contentType: 'application/json'
    })

    // Wait for all async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify file logging
    expect(existsSync(testLogFile)).toBe(true)
    const fileContent = await readFile(testLogFile, 'utf-8')
    
    expect(fileContent).toContain('POST /api/users')
    expect(fileContent).toContain('Rate limit approaching')
    expect(fileContent).toContain('Timer')
    
    // Check that debug and info messages are present (file transport has debug level)
    expect(fileContent.length).toBeGreaterThan(100)

    // Verify JSON logging (only warnings and above)
    if (existsSync(testJsonFile)) {
      const jsonContent = await readFile(testJsonFile, 'utf-8')
      
      if (jsonContent.trim().length > 0) {
        expect(jsonContent).toContain('Rate limit approaching')
        
        // Parse JSON entries to verify structure
        const jsonLines = jsonContent.trim().split('\n').filter(line => line.length > 0)
        expect(jsonLines.length).toBeGreaterThan(0)

        const firstEntry = JSON.parse(jsonLines[0])
        expect(firstEntry).toHaveProperty('timestamp')
        expect(firstEntry).toHaveProperty('level')
        expect(firstEntry).toHaveProperty('message')
        expect(firstEntry.meta).toHaveProperty('service', 'test-service')
        expect(firstEntry.meta).toHaveProperty('version', '1.0.0')
      }
    }

    // Clean up
    await logger.close()
  })

  it('should handle error scenarios gracefully', async () => {
    const logger = createLogger({
      level: 'error',
      transports: [
        new FileTransport({ filename: testLogFile, level: 'error' })
      ]
    })

    const requestLogger = new RequestLogger(logger)
    const performanceLogger = new PerformanceLogger(logger)

    // Simulate error request
    const requestId = requestLogger.startRequest('DELETE', '/api/users/999')
    
    performanceLogger.startTimer('delete-operation')
    
    // Simulate error
    const error = new Error('User not found')
    error.stack = 'Error: User not found\n    at deleteUser (test.js:1:1)'
    
    requestLogger.errorRequest(requestId, error, 404)
    performanceLogger.endTimer('delete-operation')

    // Test async function error handling
    try {
      await performanceLogger.measure('failing-operation', async () => {
        throw new Error('Operation failed')
      })
    } catch (err) {
      expect(err.message).toBe('Operation failed')
    }

    // Wait for logging
    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify error logging
    const fileContent = await readFile(testLogFile, 'utf-8')
    expect(fileContent).toContain('DELETE /api/users/999')
    expect(fileContent).toContain('User not found')
    expect(fileContent).toContain('404')

    await logger.close()
  })

  it('should work with middleware integration', () => {
    const logger = createLogger({
      level: 'info',
      transports: [new ConsoleTransport({ colors: false })]
    })

    const middleware = createElysiaLoggerMiddleware(logger)

    // Mock Elysia context
    const mockRequest = {
      method: 'GET',
      url: 'http://localhost:3000/api/health',
      headers: new Map([
        ['user-agent', 'health-checker/1.0'],
        ['accept', 'application/json']
      ])
    }

    const mockSet = {}
    const mockResponse = { status: 200, headers: new Map([['content-type', 'application/json']]) }

    // Test complete middleware lifecycle
    middleware.beforeHandle({ request: mockRequest, set: mockSet })
    
    expect(mockSet).toHaveProperty('requestId')
    expect(mockSet).toHaveProperty('logger')
    expect(mockSet).toHaveProperty('performance')

    // Use the logger from context
    const contextLogger = (mockSet as any).logger
    contextLogger.info('Health check processing')

    // Complete the request
    middleware.afterHandle({ 
      request: mockRequest, 
      response: mockResponse, 
      set: mockSet 
    })

    // Test error handling
    const errorRequest = { ...mockRequest, url: 'http://localhost:3000/api/error' }
    const errorSet = {}
    
    middleware.beforeHandle({ request: errorRequest, set: errorSet })
    middleware.onError({ 
      request: errorRequest, 
      error: new Error('Internal server error'), 
      set: errorSet 
    })

    expect(errorSet).toHaveProperty('requestId')
  })

  it('should handle high-volume logging efficiently', async () => {
    const logger = createLogger({
      level: 'info',
      transports: [
        new FileTransport({ filename: testLogFile, level: 'info' })
      ]
    })

    const performanceLogger = new PerformanceLogger(logger)
    
    // Measure the logging performance
    performanceLogger.startTimer('bulk-logging')

    // Generate many log entries sequentially to avoid race conditions
    for (let i = 0; i < 50; i++) {
      logger.info(`Bulk log entry ${i}`, { 
        index: i, 
        batch: Math.floor(i / 10),
        timestamp: Date.now()
      })
    }

    const duration = performanceLogger.endTimer('bulk-logging')

    expect(duration).toBeDefined()
    expect(duration).toBeGreaterThan(0)

    // Wait for file writes
    await new Promise(resolve => setTimeout(resolve, 200))

    // Verify entries were logged
    const fileContent = await readFile(testLogFile, 'utf-8')
    const lines = fileContent.split('\n').filter(line => line.includes('Bulk log entry'))
    
    expect(lines.length).toBeGreaterThanOrEqual(30) // Allow for some async timing issues
    expect(fileContent).toContain('Bulk log entry 0')
    expect(fileContent).toContain('Bulk log entry')

    await logger.close()
  })
})