/**
 * Tests for Environment Variable Type Conversion Utilities
 * Tests edge cases and type conversion robustness
 */

import { describe, test, expect } from 'vitest'
import { EnvConverter } from '../env'

describe('EnvConverter Edge Cases and Robustness', () => {
  describe('toNumber edge cases', () => {
    test('handles various number formats correctly', () => {
      // Basic cases
      expect(EnvConverter.toNumber('42', 0)).toBe(42)
      expect(EnvConverter.toNumber('-123', 0)).toBe(-123)
      expect(EnvConverter.toNumber('0', 42)).toBe(0)
      
      // Edge cases
      expect(EnvConverter.toNumber('00000123', 0)).toBe(123)
      expect(EnvConverter.toNumber('+456', 0)).toBe(456)
      expect(EnvConverter.toNumber('  789  ', 0)).toBe(789) // With whitespace
      
      // Hex and octal (parseInt behavior)
      expect(EnvConverter.toNumber('0x10', 0)).toBe(16)
      expect(EnvConverter.toNumber('0o10', 0)).toBe(0) // parseInt doesn't handle 0o prefix
      expect(EnvConverter.toNumber('010', 0)).toBe(10) // Treated as decimal, not octal
      
      // Invalid cases
      expect(EnvConverter.toNumber('abc', 42)).toBe(42)
      expect(EnvConverter.toNumber('123abc', 42)).toBe(123) // parseInt stops at first non-digit
      expect(EnvConverter.toNumber('', 42)).toBe(42)
      expect(EnvConverter.toNumber('   ', 42)).toBe(42)
      expect(EnvConverter.toNumber('Infinity', 42)).toBe(42)
      expect(EnvConverter.toNumber('NaN', 42)).toBe(42)
      expect(EnvConverter.toNumber(undefined, 42)).toBe(42)
    })

    test('handles floating point strings (parseInt behavior)', () => {
      // parseInt truncates to integer
      expect(EnvConverter.toNumber('12.34', 0)).toBe(12)
      expect(EnvConverter.toNumber('56.78', 0)).toBe(56)
      expect(EnvConverter.toNumber('.123', 0)).toBe(0) // parseInt behavior with leading dot
      expect(EnvConverter.toNumber('9.', 0)).toBe(9)
    })

    test('handles extreme values', () => {
      expect(EnvConverter.toNumber('999999999999999', 0)).toBe(999999999999999)
      expect(EnvConverter.toNumber('-999999999999999', 0)).toBe(-999999999999999)
      expect(EnvConverter.toNumber('1e10', 0)).toBe(1) // parseInt stops at 'e'
    })
  })

  describe('toBoolean edge cases', () => {
    test('handles various truthy representations', () => {
      // Standard truthy values
      expect(EnvConverter.toBoolean('true', false)).toBe(true)
      expect(EnvConverter.toBoolean('1', false)).toBe(true)
      expect(EnvConverter.toBoolean('yes', false)).toBe(true)
      expect(EnvConverter.toBoolean('on', false)).toBe(true)
      
      // Case variations
      expect(EnvConverter.toBoolean('TRUE', false)).toBe(true)
      expect(EnvConverter.toBoolean('True', false)).toBe(true)
      expect(EnvConverter.toBoolean('YES', false)).toBe(true)
      expect(EnvConverter.toBoolean('Yes', false)).toBe(true)
      expect(EnvConverter.toBoolean('ON', false)).toBe(true)
      expect(EnvConverter.toBoolean('On', false)).toBe(true)
      
      // With whitespace
      expect(EnvConverter.toBoolean('  true  ', false)).toBe(false) // No trim in current implementation
      expect(EnvConverter.toBoolean(' 1 ', false)).toBe(false)
    })

    test('handles various falsy representations', () => {
      // Standard falsy values
      expect(EnvConverter.toBoolean('false', true)).toBe(false)
      expect(EnvConverter.toBoolean('0', true)).toBe(false)
      expect(EnvConverter.toBoolean('no', true)).toBe(false)
      expect(EnvConverter.toBoolean('off', true)).toBe(false)
      
      // Any other string is falsy
      expect(EnvConverter.toBoolean('maybe', true)).toBe(false)
      expect(EnvConverter.toBoolean('2', true)).toBe(false)
      expect(EnvConverter.toBoolean('anything', true)).toBe(false)
      expect(EnvConverter.toBoolean('', true)).toBe(false)
    })

    test('handles edge cases', () => {
      expect(EnvConverter.toBoolean(undefined, true)).toBe(true)
      expect(EnvConverter.toBoolean(undefined, false)).toBe(false)
    })
  })

  describe('toArray edge cases', () => {
    test('handles various delimiter scenarios', () => {
      // Basic cases
      expect(EnvConverter.toArray('a,b,c')).toEqual(['a', 'b', 'c'])
      expect(EnvConverter.toArray('single')).toEqual(['single'])
      
      // Whitespace handling
      expect(EnvConverter.toArray('a, b , c')).toEqual(['a', 'b', 'c'])
      expect(EnvConverter.toArray(' a , b , c ')).toEqual(['a', 'b', 'c'])
      
      // Empty values
      expect(EnvConverter.toArray('a,,c')).toEqual(['a', 'c'])
      expect(EnvConverter.toArray(',a,b,')).toEqual(['a', 'b'])
      expect(EnvConverter.toArray(',,,')).toEqual([])
      
      // Special characters
      expect(EnvConverter.toArray('a\\,b,c')).toEqual(['a\\', 'b', 'c']) // No escape handling
      expect(EnvConverter.toArray('a"b,c')).toEqual(['a"b', 'c'])
      expect(EnvConverter.toArray("a'b,c")).toEqual(["a'b", 'c'])
    })

    test('handles empty and undefined inputs', () => {
      expect(EnvConverter.toArray('')).toEqual([])
      expect(EnvConverter.toArray(undefined)).toEqual([])
      expect(EnvConverter.toArray(undefined, ['default'])).toEqual(['default'])
    })

    test('handles URLs and complex strings', () => {
      const urls = 'http://localhost:3000,https://example.com:8080,ftp://ftp.example.com'
      expect(EnvConverter.toArray(urls)).toEqual([
        'http://localhost:3000',
        'https://example.com:8080',
        'ftp://ftp.example.com'
      ])
      
      const methods = 'GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD'
      expect(EnvConverter.toArray(methods)).toEqual([
        'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'
      ])
    })
  })

  describe('toLogLevel edge cases', () => {
    test('handles case variations', () => {
      expect(EnvConverter.toLogLevel('DEBUG', 'info')).toBe('debug')
      expect(EnvConverter.toLogLevel('Info', 'debug')).toBe('info')
      expect(EnvConverter.toLogLevel('WARN', 'info')).toBe('warn')
      expect(EnvConverter.toLogLevel('Error', 'info')).toBe('error')
    })

    test('handles invalid levels', () => {
      expect(EnvConverter.toLogLevel('verbose', 'info')).toBe('info')
      expect(EnvConverter.toLogLevel('trace', 'warn')).toBe('warn')
      expect(EnvConverter.toLogLevel('critical', 'error')).toBe('error')
      expect(EnvConverter.toLogLevel('', 'debug')).toBe('debug')
      expect(EnvConverter.toLogLevel('123', 'info')).toBe('info')
    })

    test('handles whitespace and special characters', () => {
      expect(EnvConverter.toLogLevel(' debug ', 'info')).toBe('info') // No trim
      expect(EnvConverter.toLogLevel('debug\n', 'info')).toBe('info')
      expect(EnvConverter.toLogLevel('de-bug', 'info')).toBe('info')
    })
  })

  describe('toBuildTarget edge cases', () => {
    test('handles case variations', () => {
      expect(EnvConverter.toBuildTarget('BUN', 'node')).toBe('bun')
      expect(EnvConverter.toBuildTarget('Node', 'bun')).toBe('node')
      expect(EnvConverter.toBuildTarget('DOCKER', 'bun')).toBe('docker')
    })

    test('handles invalid targets', () => {
      expect(EnvConverter.toBuildTarget('webpack', 'bun')).toBe('bun')
      expect(EnvConverter.toBuildTarget('rollup', 'node')).toBe('node')
      expect(EnvConverter.toBuildTarget('vite', 'docker')).toBe('docker')
      expect(EnvConverter.toBuildTarget('', 'bun')).toBe('bun')
    })

    test('handles similar but invalid targets', () => {
      expect(EnvConverter.toBuildTarget('nodejs', 'bun')).toBe('bun')
      expect(EnvConverter.toBuildTarget('bunjs', 'node')).toBe('node')
      expect(EnvConverter.toBuildTarget('container', 'bun')).toBe('bun')
    })
  })

  describe('toLogFormat edge cases', () => {
    test('handles case variations', () => {
      expect(EnvConverter.toLogFormat('JSON', 'pretty')).toBe('json')
      expect(EnvConverter.toLogFormat('Pretty', 'json')).toBe('pretty')
      expect(EnvConverter.toLogFormat('PRETTY', 'json')).toBe('pretty')
    })

    test('handles invalid formats', () => {
      expect(EnvConverter.toLogFormat('text', 'json')).toBe('json')
      expect(EnvConverter.toLogFormat('yaml', 'pretty')).toBe('pretty')
      expect(EnvConverter.toLogFormat('structured', 'json')).toBe('json')
      expect(EnvConverter.toLogFormat('', 'pretty')).toBe('pretty')
    })
  })

  describe('toObject edge cases', () => {
    test('handles valid JSON variations', () => {
      expect(EnvConverter.toObject('{"key":"value"}', {})).toEqual({ key: 'value' })
      expect(EnvConverter.toObject('{"nested":{"key":"value"}}', {})).toEqual({ 
        nested: { key: 'value' } 
      })
      expect(EnvConverter.toObject('[1,2,3]', {})).toEqual([1, 2, 3])
      expect(EnvConverter.toObject('null', {})).toBe(null)
      expect(EnvConverter.toObject('true', {})).toBe(true)
      expect(EnvConverter.toObject('42', {})).toBe(42)
      expect(EnvConverter.toObject('"string"', {})).toBe('string')
    })

    test('handles malformed JSON', () => {
      const defaultValue = { default: true }
      
      expect(EnvConverter.toObject('{key:"value"}', defaultValue)).toBe(defaultValue) // Missing quotes
      expect(EnvConverter.toObject('{"key":value}', defaultValue)).toBe(defaultValue) // Unquoted value
      expect(EnvConverter.toObject('{key:value}', defaultValue)).toBe(defaultValue) // No quotes
      expect(EnvConverter.toObject('{"key":"value",}', defaultValue)).toBe(defaultValue) // Trailing comma
      expect(EnvConverter.toObject('{', defaultValue)).toBe(defaultValue) // Incomplete
      expect(EnvConverter.toObject('not json at all', defaultValue)).toBe(defaultValue)
    })

    test('handles edge JSON cases', () => {
      expect(EnvConverter.toObject('{}', { default: true })).toEqual({})
      expect(EnvConverter.toObject('[]', { default: true })).toEqual([])
      expect(EnvConverter.toObject('""', { default: true })).toBe('')
      expect(EnvConverter.toObject('0', { default: true })).toBe(0)
      expect(EnvConverter.toObject('false', { default: true })).toBe(false)
    })

    test('handles complex nested objects', () => {
      const complexJson = JSON.stringify({
        server: {
          port: 3000,
          host: 'localhost',
          options: {
            cors: true,
            compression: false,
            middleware: ['auth', 'logging']
          }
        },
        database: {
          url: 'postgresql://localhost:5432/db',
          pool: { min: 2, max: 10 }
        }
      })

      const result = EnvConverter.toObject(complexJson, {})
      expect(result).toEqual({
        server: {
          port: 3000,
          host: 'localhost',
          options: {
            cors: true,
            compression: false,
            middleware: ['auth', 'logging']
          }
        },
        database: {
          url: 'postgresql://localhost:5432/db',
          pool: { min: 2, max: 10 }
        }
      })
    })

    test('handles undefined and empty inputs', () => {
      const defaultValue = { default: true }
      expect(EnvConverter.toObject(undefined, defaultValue)).toBe(defaultValue)
      expect(EnvConverter.toObject('', defaultValue)).toBe(defaultValue)
    })
  })

  describe('Conversion consistency', () => {
    test('maintains type safety across conversions', () => {
      // Number conversions should always return numbers or defaults
      const numResult = EnvConverter.toNumber('invalid', 42)
      expect(typeof numResult).toBe('number')
      expect(numResult).toBe(42)

      // Boolean conversions should always return booleans
      const boolResult = EnvConverter.toBoolean('maybe', true)
      expect(typeof boolResult).toBe('boolean')

      // Array conversions should always return arrays
      const arrayResult = EnvConverter.toArray('a,b,c')
      expect(Array.isArray(arrayResult)).toBe(true)

      // String enums should return valid enum values or defaults
      const logLevelResult = EnvConverter.toLogLevel('invalid', 'info')
      expect(['debug', 'info', 'warn', 'error']).toContain(logLevelResult)
    })

    test('handles null and undefined consistently', () => {
      expect(EnvConverter.toNumber(undefined, 42)).toBe(42)
      expect(EnvConverter.toBoolean(undefined, true)).toBe(true)
      expect(EnvConverter.toArray(undefined)).toEqual([])
      expect(EnvConverter.toLogLevel(undefined, 'info')).toBe('info')
      expect(EnvConverter.toBuildTarget(undefined, 'bun')).toBe('bun')
      expect(EnvConverter.toLogFormat(undefined, 'pretty')).toBe('pretty')
      expect(EnvConverter.toObject(undefined, {})).toEqual({})
    })
  })

  describe('Real-world environment variable scenarios', () => {
    test('handles PORT environment variable edge cases', () => {
      // Common port scenarios
      expect(EnvConverter.toNumber('3000', 8080)).toBe(3000)
      expect(EnvConverter.toNumber('0', 8080)).toBe(0) // Dynamic port
      expect(EnvConverter.toNumber('80', 8080)).toBe(80)
      expect(EnvConverter.toNumber('443', 8080)).toBe(443)
      expect(EnvConverter.toNumber('8080', 3000)).toBe(8080)
      
      // Invalid port values
      expect(EnvConverter.toNumber('port', 3000)).toBe(3000)
      expect(EnvConverter.toNumber('-1', 3000)).toBe(-1) // Negative (invalid but parsed)
      expect(EnvConverter.toNumber('70000', 3000)).toBe(70000) // Out of range but parsed
    })

    test('handles CORS_ORIGINS environment variable', () => {
      // Single origin
      expect(EnvConverter.toArray('http://localhost:3000')).toEqual(['http://localhost:3000'])
      
      // Multiple origins
      expect(EnvConverter.toArray('http://localhost:3000,https://example.com')).toEqual([
        'http://localhost:3000',
        'https://example.com'
      ])
      
      // With ports and paths
      expect(EnvConverter.toArray('http://localhost:3000,https://example.com:8080/app')).toEqual([
        'http://localhost:3000',
        'https://example.com:8080/app'
      ])
      
      // Wildcard
      expect(EnvConverter.toArray('*')).toEqual(['*'])
    })

    test('handles boolean flags from different tools', () => {
      // Docker-style
      expect(EnvConverter.toBoolean('true', false)).toBe(true)
      expect(EnvConverter.toBoolean('false', true)).toBe(false)
      
      // Shell-style
      expect(EnvConverter.toBoolean('1', false)).toBe(true)
      expect(EnvConverter.toBoolean('0', true)).toBe(false)
      
      // Human-readable
      expect(EnvConverter.toBoolean('yes', false)).toBe(true)
      expect(EnvConverter.toBoolean('no', true)).toBe(false)
      expect(EnvConverter.toBoolean('on', false)).toBe(true)
      expect(EnvConverter.toBoolean('off', true)).toBe(false)
    })

    test('handles complex JSON configurations', () => {
      // Plugin configuration
      const pluginConfig = JSON.stringify({
        enabled: true,
        options: {
          timeout: 5000,
          retries: 3,
          endpoints: ['api', 'webhook']
        }
      })
      
      const result = EnvConverter.toObject(pluginConfig, {})
      expect(result).toEqual({
        enabled: true,
        options: {
          timeout: 5000,
          retries: 3,
          endpoints: ['api', 'webhook']
        }
      })
    })
  })
})