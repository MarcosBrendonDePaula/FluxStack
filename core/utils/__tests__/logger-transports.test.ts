/**
 * Tests for Logger Transports
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { ConsoleTransport, FileTransport, JSONTransport } from '../logger/transports'
import type { LogEntry } from '../logger/transports'
import { unlink, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

describe('Logger Transports', () => {
  describe('ConsoleTransport', () => {
    let originalConsole: any
    let mockConsole: any

    beforeEach(() => {
      originalConsole = { ...console }
      mockConsole = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {})
      }
      Object.assign(console, mockConsole)
    })

    afterEach(() => {
      Object.assign(console, originalConsole)
    })

    it('should create console transport with default config', () => {
      const transport = new ConsoleTransport()
      expect(transport.name).toBe('console')
      expect(transport.level).toBe('info')
    })

    it('should respect log level filtering', () => {
      const transport = new ConsoleTransport({ level: 'warn' })
      
      const debugEntry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'debug',
        message: 'Debug message'
      }
      
      const warnEntry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'warn',
        message: 'Warning message'
      }

      transport.write(debugEntry)
      transport.write(warnEntry)

      expect(mockConsole.debug).not.toHaveBeenCalled()
      expect(mockConsole.warn).toHaveBeenCalledTimes(1)
    })

    it('should format messages with colors when enabled', () => {
      const transport = new ConsoleTransport({ colors: true })
      
      const entry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Test message',
        context: { userId: 123 },
        meta: { action: 'test' }
      }

      transport.write(entry)

      expect(mockConsole.info).toHaveBeenCalledTimes(1)
      const loggedMessage = mockConsole.info.mock.calls[0][0]
      expect(loggedMessage).toContain('INFO')
      expect(loggedMessage).toContain('Test message')
      expect(loggedMessage).toContain('userId=123')
    })

    it('should format messages without colors when disabled', () => {
      const transport = new ConsoleTransport({ colors: false })
      
      const entry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'error',
        message: 'Error message'
      }

      transport.write(entry)

      expect(mockConsole.error).toHaveBeenCalledTimes(1)
      const loggedMessage = mockConsole.error.mock.calls[0][0]
      expect(loggedMessage).not.toContain('\x1b[') // No ANSI color codes
    })
  })

  describe('FileTransport', () => {
    const testLogFile = 'test-logs/test.log'
    const testLogDir = 'test-logs'

    beforeEach(async () => {
      // Clean up test files
      try {
        if (existsSync(testLogFile)) {
          await unlink(testLogFile)
        }
      } catch (error) {
        // File might not exist
      }
    })

    afterEach(async () => {
      // Clean up test files
      try {
        if (existsSync(testLogFile)) {
          await unlink(testLogFile)
        }
      } catch (error) {
        // File might not exist
      }
    })

    it('should create file transport with config', () => {
      const transport = new FileTransport({
        filename: testLogFile,
        level: 'debug',
        maxSize: 1024,
        maxFiles: 3
      })

      expect(transport.name).toBe('file')
      expect(transport.level).toBe('debug')
    })

    it('should write log entries to file', async () => {
      const transport = new FileTransport({
        filename: testLogFile,
        level: 'info'
      })

      const entry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Test log message',
        meta: { test: true }
      }

      await transport.write(entry)

      // Check if file was created and contains the message
      const fileContent = await readFile(testLogFile, 'utf-8')
      expect(fileContent).toContain('Test log message')
      expect(fileContent).toContain('INFO')
      expect(fileContent).toContain('2023-01-01T00:00:00.000Z')
    })

    it('should respect log level filtering', async () => {
      const transport = new FileTransport({
        filename: testLogFile,
        level: 'warn'
      })

      const debugEntry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'debug',
        message: 'Debug message'
      }

      const errorEntry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'error',
        message: 'Error message'
      }

      await transport.write(debugEntry)
      await transport.write(errorEntry)

      const fileContent = await readFile(testLogFile, 'utf-8')
      expect(fileContent).not.toContain('Debug message')
      expect(fileContent).toContain('Error message')
    })
  })

  describe('JSONTransport', () => {
    const testJsonFile = 'test-logs/test.json'

    beforeEach(async () => {
      try {
        if (existsSync(testJsonFile)) {
          await unlink(testJsonFile)
        }
      } catch (error) {
        // File might not exist
      }
    })

    afterEach(async () => {
      try {
        if (existsSync(testJsonFile)) {
          await unlink(testJsonFile)
        }
      } catch (error) {
        // File might not exist
      }
    })

    it('should create JSON transport with config', () => {
      const transport = new JSONTransport({
        filename: testJsonFile,
        level: 'debug',
        pretty: true
      })

      expect(transport.name).toBe('json')
      expect(transport.level).toBe('debug')
    })

    it('should write JSON log entries to file', async () => {
      const transport = new JSONTransport({
        filename: testJsonFile,
        level: 'info'
      })

      const entry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'JSON test message',
        context: { requestId: 'req-123' },
        meta: { userId: 456 }
      }

      await transport.write(entry)

      const fileContent = await readFile(testJsonFile, 'utf-8')
      const logEntry = JSON.parse(fileContent.trim())
      
      expect(logEntry.timestamp).toBe('2023-01-01T00:00:00.000Z')
      expect(logEntry.level).toBe('info')
      expect(logEntry.message).toBe('JSON test message')
      expect(logEntry.context.requestId).toBe('req-123')
      expect(logEntry.meta.userId).toBe(456)
    })

    it('should format pretty JSON when enabled', async () => {
      const transport = new JSONTransport({
        filename: testJsonFile,
        pretty: true
      })

      const entry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Pretty JSON test',
        meta: { test: true }
      }

      await transport.write(entry)

      const fileContent = await readFile(testJsonFile, 'utf-8')
      expect(fileContent).toContain('{\n  "timestamp"')
      expect(fileContent).toContain('\n}')
    })

    it('should write compact JSON when pretty is disabled', async () => {
      const transport = new JSONTransport({
        filename: testJsonFile,
        pretty: false
      })

      const entry: LogEntry = {
        timestamp: '2023-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Compact JSON test'
      }

      await transport.write(entry)

      const fileContent = await readFile(testJsonFile, 'utf-8')
      expect(fileContent).not.toContain('\n  ')
      expect(fileContent.trim()).toMatch(/^{"timestamp".*}$/)
    })
  })
})