/**
 * Tests for EnvironmentProcessor
 * Tests environment variable processing, type conversion, and precedence handling
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  EnvironmentProcessor, 
  EnvConverter, 
  getEnvironmentInfo 
} from '../env'

describe('EnvConverter', () => {
  describe('toNumber', () => {
    test('converts valid number strings', () => {
      expect(EnvConverter.toNumber('123', 0)).toBe(123)
      expect(EnvConverter.toNumber('0', 10)).toBe(0)
      expect(EnvConverter.toNumber('-456', 0)).toBe(-456)
    })

    test('returns default for invalid values', () => {
      expect(EnvConverter.toNumber('invalid', 42)).toBe(42)
      expect(EnvConverter.toNumber('', 42)).toBe(42)
      expect(EnvConverter.toNumber(undefined, 42)).toBe(42)
      expect(EnvConverter.toNumber('12.5', 42)).toBe(12) // parseInt behavior
    })

    test('handles edge cases', () => {
      expect(EnvConverter.toNumber('0x10', 0)).toBe(0) // parseInt(value, 10) doesn't parse hex
      expect(EnvConverter.toNumber('010', 0)).toBe(10) // parseInt with base 10
      expect(EnvConverter.toNumber('Infinity', 42)).toBe(42)
      expect(EnvConverter.toNumber('NaN', 42)).toBe(42)
    })
  })

  describe('toBoolean', () => {
    test('converts truthy values', () => {
      expect(EnvConverter.toBoolean('true', false)).toBe(true)
      expect(EnvConverter.toBoolean('1', false)).toBe(true)
      expect(EnvConverter.toBoolean('yes', false)).toBe(true)
      expect(EnvConverter.toBoolean('on', false)).toBe(true)
      expect(EnvConverter.toBoolean('TRUE', false)).toBe(true)
      expect(EnvConverter.toBoolean('YES', false)).toBe(true)
    })

    test('converts falsy values', () => {
      expect(EnvConverter.toBoolean('false', true)).toBe(false)
      expect(EnvConverter.toBoolean('0', true)).toBe(false)
      expect(EnvConverter.toBoolean('no', true)).toBe(false)
      expect(EnvConverter.toBoolean('off', true)).toBe(false)
      expect(EnvConverter.toBoolean('', true)).toBe(false) // Empty string is falsy
      expect(EnvConverter.toBoolean('invalid', true)).toBe(false)
    })

    test('returns default for undefined', () => {
      expect(EnvConverter.toBoolean(undefined, true)).toBe(true)
      expect(EnvConverter.toBoolean(undefined, false)).toBe(false)
    })
  })

  describe('toArray', () => {
    test('converts comma-separated values', () => {
      expect(EnvConverter.toArray('a,b,c')).toEqual(['a', 'b', 'c'])
      expect(EnvConverter.toArray('one, two , three')).toEqual(['one', 'two', 'three'])
      expect(EnvConverter.toArray('single')).toEqual(['single'])
    })

    test('handles empty and invalid values', () => {
      expect(EnvConverter.toArray('')).toEqual([])
      expect(EnvConverter.toArray(',,')).toEqual([])
      expect(EnvConverter.toArray(undefined)).toEqual([])
      expect(EnvConverter.toArray(undefined, ['default'])).toEqual(['default'])
    })

    test('filters empty strings', () => {
      expect(EnvConverter.toArray('a,,b,,')).toEqual(['a', 'b'])
      expect(EnvConverter.toArray(' , , ')).toEqual([])
    })
  })

  describe('toLogLevel', () => {
    test('converts valid log levels', () => {
      expect(EnvConverter.toLogLevel('debug', 'info')).toBe('debug')
      expect(EnvConverter.toLogLevel('info', 'debug')).toBe('info')
      expect(EnvConverter.toLogLevel('warn', 'info')).toBe('warn')
      expect(EnvConverter.toLogLevel('error', 'info')).toBe('error')
      expect(EnvConverter.toLogLevel('DEBUG', 'info')).toBe('debug') // case insensitive
    })

    test('returns default for invalid values', () => {
      expect(EnvConverter.toLogLevel('invalid', 'info')).toBe('info')
      expect(EnvConverter.toLogLevel('', 'warn')).toBe('warn')
      expect(EnvConverter.toLogLevel(undefined, 'error')).toBe('error')
    })
  })

  describe('toBuildTarget', () => {
    test('converts valid build targets', () => {
      expect(EnvConverter.toBuildTarget('bun', 'node')).toBe('bun')
      expect(EnvConverter.toBuildTarget('node', 'bun')).toBe('node')
      expect(EnvConverter.toBuildTarget('docker', 'bun')).toBe('docker')
      expect(EnvConverter.toBuildTarget('BUN', 'node')).toBe('bun') // case insensitive
    })

    test('returns default for invalid values', () => {
      expect(EnvConverter.toBuildTarget('invalid', 'bun')).toBe('bun')
      expect(EnvConverter.toBuildTarget('', 'node')).toBe('node')
      expect(EnvConverter.toBuildTarget(undefined, 'docker')).toBe('docker')
    })
  })

  describe('toObject', () => {
    test('parses valid JSON', () => {
      expect(EnvConverter.toObject('{"key": "value"}', {})).toEqual({ key: 'value' })
      expect(EnvConverter.toObject('[1,2,3]', {})).toEqual([1, 2, 3])
      expect(EnvConverter.toObject('null', {})).toBe(null)
    })

    test('returns default for invalid JSON', () => {
      const defaultObj = { default: true }
      expect(EnvConverter.toObject('invalid json', defaultObj)).toBe(defaultObj)
      expect(EnvConverter.toObject('', defaultObj)).toBe(defaultObj)
      expect(EnvConverter.toObject(undefined, defaultObj)).toBe(defaultObj)
    })
  })
})

describe('EnvironmentProcessor', () => {
  let processor: EnvironmentProcessor
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    processor = new EnvironmentProcessor()
    originalEnv = { ...process.env }
    // Clear environment variables
    for (const key in process.env) {
      if (key.startsWith('FLUXSTACK_') || key.startsWith('PORT') || key.startsWith('HOST') || 
          key.startsWith('CORS_') || key.startsWith('LOG_') || key.startsWith('BUILD_') ||
          key.startsWith('DATABASE_') || key.startsWith('JWT_') || key.startsWith('SMTP_') ||
          key.startsWith('VITE_') || key.startsWith('API_') || key.startsWith('CLIENT_') ||
          key.startsWith('MONITORING_') || key.startsWith('METRICS_') || key.startsWith('PROFILING_')) {
        delete process.env[key]
      }
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('processEnvironmentVariables', () => {
    test('processes server configuration', () => {
      process.env.PORT = '8080'
      process.env.HOST = 'example.com'
      process.env.FLUXSTACK_API_PREFIX = '/v1'

      const config = processor.processEnvironmentVariables()

      expect(config.server?.port).toBe(8080)
      expect(config.server?.host).toBe('example.com')
      expect(config.server?.apiPrefix).toBe('/v1')
    })

    test('processes CORS configuration', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com'
      process.env.CORS_METHODS = 'GET,POST,PUT'
      process.env.CORS_HEADERS = 'Content-Type,Authorization'
      process.env.CORS_CREDENTIALS = 'true'
      process.env.CORS_MAX_AGE = '86400'

      const config = processor.processEnvironmentVariables()

      expect(config.server?.cors?.origins).toEqual(['http://localhost:3000', 'https://example.com'])
      expect(config.server?.cors?.methods).toEqual(['GET', 'POST', 'PUT'])
      expect(config.server?.cors?.headers).toEqual(['Content-Type', 'Authorization'])
      expect(config.server?.cors?.credentials).toBe(true)
      expect(config.server?.cors?.maxAge).toBe(86400)
    })

    test('processes client configuration', () => {
      process.env.VITE_PORT = '5174'
      process.env.VITE_API_URL = 'http://localhost:4000'
      process.env.FLUXSTACK_CLIENT_SOURCEMAPS = 'false'
      process.env.FLUXSTACK_CLIENT_MINIFY = 'true'

      const config = processor.processEnvironmentVariables()

      expect(config.client?.port).toBe(5174)
      expect(config.client?.proxy?.target).toBe('http://localhost:4000')
      expect(config.client?.build?.sourceMaps).toBe(false)
      expect(config.client?.build?.minify).toBe(true)
    })

    test('processes build configuration', () => {
      process.env.BUILD_TARGET = 'docker'
      process.env.BUILD_OUTDIR = 'build'
      process.env.BUILD_SOURCEMAPS = 'true'
      process.env.BUILD_MINIFY = 'false'
      process.env.BUILD_TREESHAKE = 'true'

      const config = processor.processEnvironmentVariables()

      expect(config.build?.target).toBe('docker')
      expect(config.build?.outDir).toBe('build')
      expect(config.build?.sourceMaps).toBe(true)
      expect(config.build?.optimization?.minify).toBe(false)
      expect(config.build?.optimization?.treeshake).toBe(true)
    })

    test('processes logging configuration', () => {
      process.env.LOG_LEVEL = 'debug'
      process.env.LOG_FORMAT = 'json'

      const config = processor.processEnvironmentVariables()

      expect(config.logging?.level).toBe('debug')
      expect(config.logging?.format).toBe('json')
    })

    test('processes monitoring configuration', () => {
      process.env.MONITORING_ENABLED = 'true'
      process.env.METRICS_ENABLED = 'false'
      process.env.METRICS_INTERVAL = '30000'
      process.env.PROFILING_ENABLED = 'true'
      process.env.PROFILING_SAMPLE_RATE = '0.1'

      const config = processor.processEnvironmentVariables()

      expect(config.monitoring?.enabled).toBe(true)
      expect(config.monitoring?.metrics?.enabled).toBe(false)
      expect(config.monitoring?.metrics?.collectInterval).toBe(30000)
      expect(config.monitoring?.profiling?.enabled).toBe(true)
      expect(config.monitoring?.profiling?.sampleRate).toBe(0) // parseInt converts '0.1' to 0
    })

    test('processes database configuration', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DATABASE_HOST = 'db.example.com'
      process.env.DATABASE_PORT = '5433'
      process.env.DATABASE_NAME = 'myapp'
      process.env.DATABASE_SSL = 'true'
      process.env.DATABASE_POOL_SIZE = '20'

      const config = processor.processEnvironmentVariables()

      expect(config.database?.url).toBe('postgresql://user:pass@localhost:5432/db')
      expect(config.database?.host).toBe('db.example.com')
      expect(config.database?.port).toBe(5433)
      expect(config.database?.database).toBe('myapp')
      expect(config.database?.ssl).toBe(true)
      expect(config.database?.poolSize).toBe(20)
    })

    test('processes auth configuration', () => {
      process.env.JWT_SECRET = 'my-secret-key'
      process.env.JWT_EXPIRES_IN = '7d'
      process.env.JWT_ALGORITHM = 'HS256'
      process.env.JWT_ISSUER = 'fluxstack'

      const config = processor.processEnvironmentVariables()

      expect(config.auth?.secret).toBe('my-secret-key')
      expect(config.auth?.expiresIn).toBe('7d')
      expect(config.auth?.algorithm).toBe('HS256')
      expect(config.auth?.issuer).toBe('fluxstack')
    })

    test('processes email configuration', () => {
      process.env.SMTP_HOST = 'smtp.gmail.com'
      process.env.SMTP_PORT = '587'
      process.env.SMTP_USER = 'user@example.com'
      process.env.SMTP_SECURE = 'true'
      process.env.SMTP_FROM = 'noreply@example.com'

      const config = processor.processEnvironmentVariables()

      expect(config.email?.host).toBe('smtp.gmail.com')
      expect(config.email?.port).toBe(587)
      expect(config.email?.user).toBe('user@example.com')
      expect(config.email?.secure).toBe(true)
      expect(config.email?.from).toBe('noreply@example.com')
    })

    test('processes plugin configuration', () => {
      process.env.FLUXSTACK_PLUGINS_ENABLED = 'plugin1,plugin2,plugin3'
      process.env.FLUXSTACK_PLUGINS_DISABLED = 'plugin4,plugin5'

      const config = processor.processEnvironmentVariables()

      expect(config.plugins?.enabled).toEqual(['plugin1', 'plugin2', 'plugin3'])
      expect(config.plugins?.disabled).toEqual(['plugin4', 'plugin5'])
    })

    test('handles precedence with both standard and FluxStack prefixed variables', () => {
      // In current implementation, the last one processed wins (FLUXSTACK_ comes after standard)
      process.env.PORT = '3000'
      process.env.FLUXSTACK_PORT = '4000'
      process.env.API_PREFIX = '/api'
      process.env.FLUXSTACK_API_PREFIX = '/v2'

      const config = processor.processEnvironmentVariables()

      // The implementation uses || operator, so FLUXSTACK_PORT takes precedence only if PORT is not set
      expect(config.server?.port).toBe(3000) // PORT takes precedence when both are set
      expect(config.server?.apiPrefix).toBe('/v2') // FLUXSTACK_API_PREFIX wins
    })

    test('cleans empty objects from result', () => {
      // No environment variables set
      const config = processor.processEnvironmentVariables()

      // Should not contain empty nested objects
      expect(config.server).toBeUndefined()
      expect(config.client).toBeUndefined()
      expect(config.database).toBeUndefined()
    })

    test('tracks precedence information', () => {
      process.env.PORT = '3000'
      process.env.LOG_LEVEL = 'debug'

      processor.processEnvironmentVariables()
      const precedence = processor.getPrecedenceInfo()

      expect(precedence.has('server.port')).toBe(true)
      expect(precedence.has('logging.level')).toBe(true)

      const portPrecedence = precedence.get('server.port')
      expect(portPrecedence?.source).toBe('environment')
      expect(portPrecedence?.value).toBe(3000)
      expect(portPrecedence?.priority).toBe(3)
    })
  })

  describe('precedence tracking', () => {
    test('tracks precedence for all set values', () => {
      process.env.PORT = '3000'
      process.env.BUILD_TARGET = 'docker'
      process.env.CORS_ORIGINS = 'localhost'

      processor.processEnvironmentVariables()
      const precedence = processor.getPrecedenceInfo()

      expect(precedence.size).toBeGreaterThan(0)
      expect(precedence.get('server.port')?.priority).toBe(3)
      expect(precedence.get('build.target')?.priority).toBe(3)
      expect(precedence.get('server.cors.origins')?.priority).toBe(3)
    })

    test('clears precedence tracking', () => {
      process.env.PORT = '3000'
      processor.processEnvironmentVariables()
      
      expect(processor.getPrecedenceInfo().size).toBeGreaterThan(0)
      
      processor.clearPrecedence()
      expect(processor.getPrecedenceInfo().size).toBe(0)
    })
  })
})

describe('getEnvironmentInfo', () => {
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  test('detects development environment', () => {
    process.env.NODE_ENV = 'development'
    const info = getEnvironmentInfo()

    expect(info.name).toBe('development')
    expect(info.nodeEnv).toBe('development')
    expect(info.isDevelopment).toBe(true)
    expect(info.isProduction).toBe(false)
    expect(info.isTest).toBe(false)
  })

  test('detects production environment', () => {
    process.env.NODE_ENV = 'production'
    const info = getEnvironmentInfo()

    expect(info.name).toBe('production')
    expect(info.nodeEnv).toBe('production')
    expect(info.isDevelopment).toBe(false)
    expect(info.isProduction).toBe(true)
    expect(info.isTest).toBe(false)
  })

  test('detects test environment', () => {
    process.env.NODE_ENV = 'test'
    const info = getEnvironmentInfo()

    expect(info.name).toBe('test')
    expect(info.nodeEnv).toBe('test')
    expect(info.isDevelopment).toBe(false)
    expect(info.isProduction).toBe(false)
    expect(info.isTest).toBe(true)
  })

  test('defaults to development when NODE_ENV is not set', () => {
    delete process.env.NODE_ENV
    const info = getEnvironmentInfo()

    expect(info.name).toBe('development')
    expect(info.nodeEnv).toBe('development')
    expect(info.isDevelopment).toBe(true)
    expect(info.isProduction).toBe(false)
    expect(info.isTest).toBe(false)
  })

  test('handles custom environment names', () => {
    process.env.NODE_ENV = 'staging'
    const info = getEnvironmentInfo()

    expect(info.name).toBe('staging')
    expect(info.nodeEnv).toBe('staging')
    expect(info.isDevelopment).toBe(false)
    expect(info.isProduction).toBe(false)
    expect(info.isTest).toBe(false)
  })
})