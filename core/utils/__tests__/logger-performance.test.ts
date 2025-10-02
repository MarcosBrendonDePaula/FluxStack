/**
 * Tests for Logger Performance utilities
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { RequestLogger, PerformanceLogger } from '../logger/performance'
import type { Logger } from '../logger/index'

describe('Logger Performance', () => {
  let mockLogger: Logger

  beforeEach(() => {
    mockLogger = {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      child: mock((context: any) => ({
        ...mockLogger,
        context
      })),
      time: mock(() => {}),
      timeEnd: mock(() => {}),
      request: mock(() => {}),
      addTransport: mock(() => {}),
      removeTransport: mock(() => {}),
      close: mock(async () => {})
    } as any
  })

  describe('RequestLogger', () => {
    let requestLogger: RequestLogger

    beforeEach(() => {
      requestLogger = new RequestLogger(mockLogger)
    })

    it('should start and track a request', () => {
      const requestId = requestLogger.startRequest('GET', '/api/users', {
        userAgent: 'test-agent',
        ip: '127.0.0.1'
      })

      expect(requestId).toBeDefined()
      expect(typeof requestId).toBe('string')
      expect(requestId.length).toBeGreaterThan(0)

      // Should have logged request start
      expect(mockLogger.child).toHaveBeenCalledWith({ requestId })
    })

    it('should end a request successfully', async () => {
      const requestId = requestLogger.startRequest('POST', '/api/data')
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 10))
      
      requestLogger.endRequest(requestId, 201, {
        responseSize: '512',
        contentType: 'application/json'
      })

      // Should have created child logger for request end
      expect(mockLogger.child).toHaveBeenCalledWith({ requestId })
    })

    it('should handle request errors', () => {
      const requestId = requestLogger.startRequest('DELETE', '/api/item/123')
      const testError = new Error('Not found')

      requestLogger.errorRequest(requestId, testError, 404)

      // Should have logged error with child logger
      expect(mockLogger.child).toHaveBeenCalledWith({ requestId })
    })

    it('should get request context', () => {
      const requestId = requestLogger.startRequest('GET', '/api/status')
      
      const context = requestLogger.getRequestContext(requestId)
      
      expect(context).toBeDefined()
      expect(context?.id).toBe(requestId)
      expect(context?.method).toBe('GET')
      expect(context?.path).toBe('/api/status')
      expect(context?.startTime).toBeDefined()
    })

    it('should create child logger with request context', () => {
      const requestId = requestLogger.startRequest('PUT', '/api/update')
      
      const childLogger = requestLogger.childLogger(requestId, { component: 'api' })
      
      expect(mockLogger.child).toHaveBeenCalledWith({
        requestId,
        method: 'PUT',
        path: '/api/update',
        component: 'api'
      })
    })

    it('should handle non-existent request ID gracefully', () => {
      const nonExistentId = 'non-existent-id'
      
      requestLogger.endRequest(nonExistentId, 200)
      
      // Should not throw error, just not log anything
      expect(mockLogger.child).not.toHaveBeenCalledWith({ requestId: nonExistentId })
    })
  })

  describe('PerformanceLogger', () => {
    let performanceLogger: PerformanceLogger

    beforeEach(() => {
      performanceLogger = new PerformanceLogger(mockLogger)
    })

    it('should start and end a timer', async () => {
      performanceLogger.startTimer('test-operation', { component: 'test' })
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '⏱️  Started timer: test-operation',
        expect.objectContaining({
          type: 'timer_start',
          label: 'test-operation',
          component: 'test'
        })
      )

      // Wait a bit then end timer
      await new Promise(resolve => setTimeout(resolve, 10))
      const duration = performanceLogger.endTimer('test-operation')
      
      expect(duration).toBeDefined()
      expect(typeof duration).toBe('number')
      expect(duration).toBeGreaterThan(0)
    })

    it('should handle non-existent timer gracefully', () => {
      const duration = performanceLogger.endTimer('non-existent-timer')
      
      expect(duration).toBeUndefined()
      expect(mockLogger.warn).toHaveBeenCalledWith('Timer not found: non-existent-timer')
    })

    it('should measure async function execution', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return 'test-result'
      }

      const result = await performanceLogger.measure('async-test', testFunction, { test: true })
      
      expect(result).toBe('test-result')
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '⏱️  Started timer: async-test',
        expect.objectContaining({
          type: 'timer_start',
          label: 'async-test',
          test: true
        })
      )
    })

    it('should measure sync function execution', () => {
      const testFunction = () => {
        return Math.PI * 2
      }

      const result = performanceLogger.measureSync('sync-test', testFunction)
      
      expect(result).toBeCloseTo(Math.PI * 2)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '⏱️  Started timer: sync-test',
        expect.objectContaining({
          type: 'timer_start',
          label: 'sync-test'
        })
      )
    })

    it('should handle async function errors', async () => {
      const errorFunction = async () => {
        throw new Error('Test error')
      }

      await expect(
        performanceLogger.measure('error-test', errorFunction)
      ).rejects.toThrow('Test error')

      // Should still log the timer end with error info
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '⏱️  Started timer: error-test',
        expect.objectContaining({
          type: 'timer_start',
          label: 'error-test'
        })
      )
    })

    it('should handle sync function errors', () => {
      const errorFunction = () => {
        throw new Error('Sync error')
      }

      expect(() => 
        performanceLogger.measureSync('sync-error-test', errorFunction)
      ).toThrow('Sync error')
    })

    it('should log memory usage', () => {
      performanceLogger.logMemoryUsage('test-checkpoint')
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        '📊 Memory usage (test-checkpoint)',
        expect.objectContaining({
          type: 'memory_usage',
          label: 'test-checkpoint',
          memory: expect.objectContaining({
            rss: expect.stringContaining('MB'),
            heapTotal: expect.stringContaining('MB'),
            heapUsed: expect.stringContaining('MB'),
            external: expect.stringContaining('MB')
          }),
          raw: expect.objectContaining({
            rss: expect.any(Number),
            heapTotal: expect.any(Number),
            heapUsed: expect.any(Number),
            external: expect.any(Number)
          })
        })
      )
    })

    it('should log system metrics', () => {
      performanceLogger.logSystemMetrics('test-metrics')
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        '⚡ System metrics (test-metrics)',
        expect.objectContaining({
          type: 'system_metrics',
          label: 'test-metrics',
          cpu: expect.objectContaining({
            user: expect.any(Number),
            system: expect.any(Number)
          }),
          uptime: expect.objectContaining({
            seconds: expect.any(Number),
            formatted: expect.any(String)
          })
        })
      )
    })
  })
})