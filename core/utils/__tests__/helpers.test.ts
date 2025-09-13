/**
 * Tests for Helper Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatBytes,
  createTimer,
  delay,
  retry,
  debounce,
  throttle,
  isProduction,
  isDevelopment,
  isTest,
  deepMerge,
  pick,
  omit,
  generateId,
  safeJsonParse,
  safeJsonStringify
} from '../helpers'

describe('Helper Utilities', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    it('should handle decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 0)).toBe('2 KB')
    })
  })

  describe('createTimer', () => {
    it('should measure time correctly', async () => {
      const timer = createTimer('test')
      await delay(10)
      const duration = timer.end()

      expect(duration).toBeGreaterThanOrEqual(10)
      expect(timer.label).toBe('test')
    })
  })

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now()
      await delay(50)
      const end = Date.now()

      expect(end - start).toBeGreaterThanOrEqual(50)
    })
  })

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await retry(fn, 3, 10)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success')

      const result = await retry(fn, 3, 10)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'))

      await expect(retry(fn, 2, 10)).rejects.toThrow('always fails')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should debounce function calls', () => {
      const fn = vi.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('arg3')
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should throttle function calls', () => {
      const fn = vi.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn('arg1')
      throttledFn('arg2')
      throttledFn('arg3')

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('arg1')

      vi.advanceTimersByTime(100)

      throttledFn('arg4')
      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenCalledWith('arg4')
    })
  })

  describe('Environment Checks', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production'
      expect(isProduction()).toBe(true)
      expect(isDevelopment()).toBe(false)
      expect(isTest()).toBe(false)
    })

    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development'
      expect(isProduction()).toBe(false)
      expect(isDevelopment()).toBe(true)
      expect(isTest()).toBe(false)
    })

    it('should detect test environment', () => {
      process.env.NODE_ENV = 'test'
      expect(isProduction()).toBe(false)
      expect(isDevelopment()).toBe(false)
      expect(isTest()).toBe(true)
    })

    it('should default to development when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV
      expect(isDevelopment()).toBe(true)
    })
  })

  describe('Object Utilities', () => {
    describe('deepMerge', () => {
      it('should merge objects deeply', () => {
        const target = {
          a: 1,
          b: {
            c: 2,
            d: 3
          }
        }

        const source = {
          b: {
            d: 4,
            e: 5
          },
          f: 6
        }

        const result = deepMerge(target, source)

        expect(result).toEqual({
          a: 1,
          b: {
            c: 2,
            d: 4,
            e: 5
          },
          f: 6
        })
      })

      it('should handle arrays correctly', () => {
        const target = { arr: [1, 2, 3] }
        const source = { arr: [4, 5, 6] }

        const result = deepMerge(target, source)

        expect(result.arr).toEqual([4, 5, 6])
      })
    })

    describe('pick', () => {
      it('should pick specified keys', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 }
        const result = pick(obj, ['a', 'c'])

        expect(result).toEqual({ a: 1, c: 3 })
      })

      it('should handle non-existent keys', () => {
        const obj = { a: 1, b: 2 }
        const result = pick(obj, ['a', 'c'] as any)

        expect(result).toEqual({ a: 1 })
      })
    })

    describe('omit', () => {
      it('should omit specified keys', () => {
        const obj = { a: 1, b: 2, c: 3, d: 4 }
        const result = omit(obj, ['b', 'd'])

        expect(result).toEqual({ a: 1, c: 3 })
      })
    })
  })

  describe('String Utilities', () => {
    describe('generateId', () => {
      it('should generate id with default length', () => {
        const id = generateId()
        expect(id).toHaveLength(8)
        expect(id).toMatch(/^[A-Za-z0-9]+$/)
      })

      it('should generate id with custom length', () => {
        const id = generateId(16)
        expect(id).toHaveLength(16)
      })

      it('should generate unique ids', () => {
        const id1 = generateId()
        const id2 = generateId()
        expect(id1).not.toBe(id2)
      })
    })

    describe('safeJsonParse', () => {
      it('should parse valid JSON', () => {
        const result = safeJsonParse('{"a": 1}', {})
        expect(result).toEqual({ a: 1 })
      })

      it('should return fallback for invalid JSON', () => {
        const fallback = { error: true }
        const result = safeJsonParse('invalid json', fallback)
        expect(result).toBe(fallback)
      })
    })

    describe('safeJsonStringify', () => {
      it('should stringify valid objects', () => {
        const result = safeJsonStringify({ a: 1 })
        expect(result).toBe('{"a":1}')
      })

      it('should return fallback for circular references', () => {
        const circular: any = { a: 1 }
        circular.self = circular

        const result = safeJsonStringify(circular, '{"error": true}')
        expect(result).toBe('{"error": true}')
      })
    })
  })
})