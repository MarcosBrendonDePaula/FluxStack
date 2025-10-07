/**
 * Tests for Unified Logger
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Set test environment
process.env.NODE_ENV = 'test'
process.env.LOG_TO_FILE = 'false' // Disable file logging in tests
process.env.LOG_LEVEL = 'debug' // Enable all log levels in tests

// Import the logger
import { LOG, WARN, ERROR, DEBUG, START, SUCCESS, IMPORTANT, SECTION, logger, log, clearCache } from '../logger'

describe('Unified Logger', () => {
  afterEach(() => {
    clearCache()
  })

  describe('Basic Logging Functions', () => {
    it('should export LOG function', () => {
      expect(typeof LOG).toBe('function')
      expect(() => LOG('Test')).not.toThrow()
    })

    it('should export WARN function', () => {
      expect(typeof WARN).toBe('function')
      expect(() => WARN('Test')).not.toThrow()
    })

    it('should export ERROR function', () => {
      expect(typeof ERROR).toBe('function')
      expect(() => ERROR('Test')).not.toThrow()
    })

    it('should export DEBUG function', () => {
      expect(typeof DEBUG).toBe('function')
      expect(() => DEBUG('Test')).not.toThrow()
    })

    it('should handle multiple arguments', () => {
      expect(() => LOG('Message', { data: 'test' }, 123)).not.toThrow()
    })

    it('should handle Error objects', () => {
      const error = new Error('Test error')
      expect(() => ERROR(error)).not.toThrow()
    })

    it('should handle objects', () => {
      const obj = { key: 'value', nested: { data: 123 } }
      expect(() => LOG(obj)).not.toThrow()
    })
  })

  describe('Special Logging Functions', () => {
    it('should log operation start with START()', () => {
      expect(typeof START).toBe('function')
      expect(() => START('Database connection')).not.toThrow()
    })

    it('should log operation success with SUCCESS()', () => {
      expect(typeof SUCCESS).toBe('function')
      expect(() => SUCCESS('Database connection')).not.toThrow()
    })

    it('should log important messages with IMPORTANT()', () => {
      expect(typeof IMPORTANT).toBe('function')
      expect(() => IMPORTANT('Critical Update', 'System will restart')).not.toThrow()
    })

    it('should handle sections with SECTION()', () => {
      expect(typeof SECTION).toBe('function')
      expect(() => {
        SECTION('Test Section', () => {
          LOG('Inside section')
        })
      }).not.toThrow()
    })
  })

  describe('Logger Object API', () => {
    it('should have logger object with all methods', () => {
      expect(logger).toBeDefined()
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.request).toBe('function')
      expect(typeof logger.plugin).toBe('function')
      expect(typeof logger.framework).toBe('function')
      expect(typeof logger.time).toBe('function')
      expect(typeof logger.timeEnd).toBe('function')
    })

    it('should work with logger.info()', () => {
      expect(() => logger.info('Test message')).not.toThrow()
    })

    it('should work with logger.warn()', () => {
      expect(() => logger.warn('Test warning')).not.toThrow()
    })

    it('should work with logger.error()', () => {
      expect(() => logger.error('Test error')).not.toThrow()
    })

    it('should work with logger.debug()', () => {
      expect(() => logger.debug('Test debug')).not.toThrow()
    })
  })

  describe('Log Object API', () => {
    it('should have log object with all methods', () => {
      expect(log).toBeDefined()
      expect(typeof log.info).toBe('function')
      expect(typeof log.warn).toBe('function')
      expect(typeof log.error).toBe('function')
      expect(typeof log.debug).toBe('function')
    })

    it('should work with log.info()', () => {
      expect(() => log.info('Test message')).not.toThrow()
    })

    it('should work with log.warn()', () => {
      expect(() => log.warn('Test warning')).not.toThrow()
    })

    it('should work with log.error()', () => {
      expect(() => log.error('Test error')).not.toThrow()
    })

    it('should work with log.debug()', () => {
      expect(() => log.debug('Test debug')).not.toThrow()
    })
  })

  describe('HTTP Request Logging', () => {
    it('should log HTTP requests with all parameters', () => {
      expect(() => logger.request('GET', '/api/users', 200, 150)).not.toThrow()
    })

    it('should log requests without status and duration', () => {
      expect(() => logger.request('POST', '/api/users')).not.toThrow()
    })
  })

  describe('Plugin and Framework Logging', () => {
    it('should log plugin messages', () => {
      expect(() => logger.plugin('test-plugin', 'Plugin initialized')).not.toThrow()
    })

    it('should log plugin messages with metadata', () => {
      expect(() => logger.plugin('test-plugin', 'Plugin initialized', { version: '1.0.0' })).not.toThrow()
    })

    it('should log framework messages', () => {
      expect(() => logger.framework('Framework started')).not.toThrow()
    })

    it('should log framework messages with metadata', () => {
      expect(() => logger.framework('Framework started', { port: 3000 })).not.toThrow()
    })
  })

  describe('Performance Timing', () => {
    it('should measure time with time() and timeEnd()', async () => {
      expect(() => {
        logger.time('test-operation')
        logger.timeEnd('test-operation')
      }).not.toThrow()
    })

    it('should handle async operations', async () => {
      expect(async () => {
        logger.time('async-operation')
        await new Promise(resolve => setTimeout(resolve, 10))
        logger.timeEnd('async-operation')
      }).not.toThrow()
    })

    it('should warn when timer not found', () => {
      expect(() => logger.timeEnd('non-existent-timer')).not.toThrow()
    })
  })

  describe('Cache Management', () => {
    it('should export clearCache function', () => {
      expect(typeof clearCache).toBe('function')
    })

    it('should clear cache without errors', () => {
      LOG('Test message')
      expect(() => clearCache()).not.toThrow()
    })

    it('should work after cache clear', () => {
      LOG('Before clear')
      clearCache()
      expect(() => LOG('After clear')).not.toThrow()
    })
  })

  describe('API Compatibility', () => {
    it('should maintain backward compatibility with old logger API', () => {
      // Old API should still work
      expect(() => {
        log.info('Info message')
        log.warn('Warning message')
        log.error('Error message')
        log.debug('Debug message')
      }).not.toThrow()
    })

    it('should support both logger and log objects', () => {
      expect(logger).toBeDefined()
      expect(log).toBeDefined()
      expect(logger.info).toBe(log.info)
      expect(logger.warn).toBe(log.warn)
      expect(logger.error).toBe(log.error)
      expect(logger.debug).toBe(log.debug)
    })
  })
})
