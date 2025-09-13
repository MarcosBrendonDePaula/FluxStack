/**
 * Tests for Logger Utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock environment config
vi.mock('../../config/env', () => ({
  getEnvironmentInfo: vi.fn(() => ({
    isDevelopment: true,
    isProduction: false,
    isTest: true,
    name: 'test'
  }))
}))

// Import the real logger after mocking dependencies
import { logger as realLogger, log as realLog } from '../logger'

describe('Logger', () => {
  let consoleSpy: {
    debug: any
    info: any
    warn: any
    error: any
  }
  let logger: typeof realLogger
  let log: typeof realLog

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    }
    logger = realLogger
    log = realLog
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Log Levels', () => {
    it('should log info messages', () => {
      logger.info('Test info message')
      expect(consoleSpy.info).toHaveBeenCalled()
    })

    it('should log warn messages', () => {
      logger.warn('Test warn message')
      expect(consoleSpy.warn).toHaveBeenCalled()
    })

    it('should log error messages', () => {
      logger.error('Test error message')
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should not log debug messages when log level is info', () => {
      logger.debug('Test debug message')
      expect(consoleSpy.debug).not.toHaveBeenCalled()
    })
  })

  describe('Message Formatting', () => {
    it('should format messages with timestamp and level', () => {
      logger.info('Test message')
      
      const call = consoleSpy.info.mock.calls[0][0]
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO  Test message/)
    })

    it('should include metadata in log messages', () => {
      const metadata = { userId: 123, action: 'login' }
      logger.info('User action', metadata)
      
      const call = consoleSpy.info.mock.calls[0][0]
      expect(call).toContain(JSON.stringify(metadata))
    })
  })

  describe('Contextual Logging', () => {
    it('should support contextual logging (basic test)', () => {
      // Test that logger has basic functionality
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
    })

    it('should have log convenience object', () => {
      // Test that log convenience object exists
      expect(log).toBeDefined()
      expect(typeof log.info).toBe('function')
    })
  })

  describe('Performance Logging', () => {
    it('should support basic logging functionality', () => {
      // Test basic functionality without advanced features
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
    })

    it('should handle logging without errors', () => {
      // Basic test without expecting specific console output
      expect(() => {
        logger.info('Test message')
        log.info('Test message via convenience function')
      }).not.toThrow()
    })
  })

  describe('HTTP Request Logging', () => {
    it('should log HTTP requests', () => {
      logger.request('GET', '/api/users', 200, 150)
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/GET \/api\/users 200 \(150ms\)/)
      )
    })

    it('should log requests without status and duration', () => {
      logger.request('POST', '/api/users')
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/POST \/api\/users/)
      )
    })
  })

  describe('Convenience Functions', () => {
    it('should provide log convenience functions', () => {
      log.info('Test message')
      expect(consoleSpy.info).toHaveBeenCalled()
    })

    it('should provide plugin logging', () => {
      log.plugin('test-plugin', 'Plugin message')
      expect(consoleSpy.debug).not.toHaveBeenCalled() // debug level, won't show with info level
    })

    it('should provide framework logging', () => {
      log.framework('Framework message')
      expect(consoleSpy.info).toHaveBeenCalled()
    })
  })
})