#!/usr/bin/env bun

/**
 * Test Runner for Environment Variable Loading System
 * Comprehensive test suite for FluxStack environment configuration
 */

import { expect } from 'bun:test'
import { 
  EnvironmentProcessor, 
  EnvConverter, 
  getEnvironmentInfo,
  ConfigMerger,
  EnvironmentConfigApplier
} from './core/config/env'
import { getConfigSync } from './core/config'

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

let testsPassed = 0
let testsFailed = 0
let testsTotal = 0

function test(name: string, fn: () => void | Promise<void>) {
  testsTotal++
  try {
    const result = fn()
    if (result instanceof Promise) {
      result.then(() => {
        testsPassed++
        console.log(`${colors.green}✓${colors.reset} ${name}`)
      }).catch((error) => {
        testsFailed++
        console.log(`${colors.red}✗${colors.reset} ${name}`)
        console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`)
      })
    } else {
      testsPassed++
      console.log(`${colors.green}✓${colors.reset} ${name}`)
    }
  } catch (error) {
    testsFailed++
    console.log(`${colors.red}✗${colors.reset} ${name}`)
    console.log(`  ${colors.red}Error: ${(error as Error).message}${colors.reset}`)
  }
}

function describe(name: string, fn: () => void) {
  console.log(`\n${colors.bold}${colors.blue}${name}${colors.reset}`)
  fn()
}

// Save original environment
const originalEnv = { ...process.env }

function beforeEach() {
  // Clear test environment variables
  for (const key in process.env) {
    if (key.startsWith('FLUXSTACK_') || key.startsWith('PORT') || key.startsWith('HOST') ||
        key.startsWith('CORS_') || key.startsWith('LOG_') || key.startsWith('BUILD_') ||
        key.startsWith('DATABASE_') || key.startsWith('JWT_') || key.startsWith('SMTP_') ||
        key.startsWith('VITE_') || key.startsWith('API_') || key.startsWith('CLIENT_') ||
        key.startsWith('MONITORING_') || key.startsWith('METRICS_') || key.startsWith('PROFILING_')) {
      delete process.env[key]
    }
  }
}

function afterEach() {
  // Restore original environment
  process.env = { ...originalEnv }
}

// Test Suite
console.log(`${colors.bold}FluxStack Environment Variable Loading Tests${colors.reset}\n`)

describe('EnvConverter Type Conversion', () => {
  test('converts numbers correctly', () => {
    expect(EnvConverter.toNumber('123', 0)).toBe(123)
    expect(EnvConverter.toNumber('invalid', 42)).toBe(42)
    expect(EnvConverter.toNumber(undefined, 42)).toBe(42)
  })

  test('converts booleans correctly', () => {
    expect(EnvConverter.toBoolean('true', false)).toBe(true)
    expect(EnvConverter.toBoolean('1', false)).toBe(true)
    expect(EnvConverter.toBoolean('false', true)).toBe(false)
    expect(EnvConverter.toBoolean('invalid', true)).toBe(false)
  })

  test('converts arrays correctly', () => {
    expect(EnvConverter.toArray('a,b,c')).toEqual(['a', 'b', 'c'])
    expect(EnvConverter.toArray('a, b , c')).toEqual(['a', 'b', 'c'])
    expect(EnvConverter.toArray('')).toEqual([])
  })

  test('converts log levels correctly', () => {
    expect(EnvConverter.toLogLevel('debug', 'info')).toBe('debug')
    expect(EnvConverter.toLogLevel('invalid', 'info')).toBe('info')
  })
})

describe('EnvironmentProcessor', () => {
  let processor: EnvironmentProcessor

  beforeEach()
  processor = new EnvironmentProcessor()

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
    process.env.CORS_CREDENTIALS = 'true'

    const config = processor.processEnvironmentVariables()

    expect(config.server?.cors?.origins).toEqual(['http://localhost:3000', 'https://example.com'])
    expect(config.server?.cors?.methods).toEqual(['GET', 'POST', 'PUT'])
    expect(config.server?.cors?.credentials).toBe(true)
  })

  test('processes database configuration', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.DATABASE_SSL = 'true'
    process.env.DATABASE_POOL_SIZE = '20'

    const config = processor.processEnvironmentVariables()

    expect(config.database?.url).toBe('postgresql://user:pass@localhost:5432/db')
    expect(config.database?.ssl).toBe(true)
    expect(config.database?.poolSize).toBe(20)
  })

  afterEach()
})

describe('Configuration Loading Integration', () => {
  test('loads complete development configuration', () => {
    beforeEach()
    
    process.env.NODE_ENV = 'development'
    process.env.PORT = '3000'
    process.env.HOST = 'localhost'
    process.env.LOG_LEVEL = 'debug'
    process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:5173'

    const config = getConfigSync()

    expect(getEnvironmentInfo().isDevelopment).toBe(true)
    expect(config.server?.port).toBe(3000)
    expect(config.server?.host).toBe('localhost')
    expect(config.logging?.level).toBe('debug')
    expect(config.server?.cors?.origins).toEqual(['http://localhost:3000', 'http://localhost:5173'])
    
    afterEach()
  })

  test('loads complete production configuration', () => {
    beforeEach()
    
    process.env.NODE_ENV = 'production'
    process.env.PORT = '8080'
    process.env.HOST = '0.0.0.0'
    process.env.LOG_LEVEL = 'warn'
    process.env.LOG_FORMAT = 'json'
    process.env.MONITORING_ENABLED = 'true'
    process.env.BUILD_MINIFY = 'true'

    const config = getConfigSync()

    expect(getEnvironmentInfo().isProduction).toBe(true)
    expect(config.server?.port).toBe(8080)
    expect(config.server?.host).toBe('0.0.0.0')
    expect(config.logging?.level).toBe('warn')
    expect(config.logging?.format).toBe('json')
    expect(config.monitoring?.enabled).toBe(true)
    expect(config.build?.optimization?.minify).toBe(true)
    
    afterEach()
  })

  test('handles precedence correctly', () => {
    beforeEach()
    
    // Test precedence: FLUXSTACK_ prefix vs standard
    process.env.PORT = '3000'
    process.env.FLUXSTACK_PORT = '4000'
    process.env.API_PREFIX = '/api'
    process.env.FLUXSTACK_API_PREFIX = '/v2'

    const config = getConfigSync()

    // Current implementation uses || operator, so first non-empty wins
    expect(config.server?.port).toBe(3000) // PORT wins because it's checked first
    expect(config.server?.apiPrefix).toBe('/v2') // FLUXSTACK_API_PREFIX wins
    
    afterEach()
  })
})

describe('ConfigMerger', () => {
  test('merges configurations with precedence', () => {
    const merger = new ConfigMerger()

    const config1 = {
      config: { server: { port: 3000, host: 'localhost' } },
      source: 'default'
    }

    const config2 = {
      config: { server: { port: 4000 } },
      source: 'environment'
    }

    const result = merger.merge(config1, config2)

    expect(result.server?.port).toBe(4000) // Environment overrides default
    expect(result.server?.host).toBe('localhost') // Preserved from default
  })
})

describe('Real-world Scenarios', () => {
  test('Docker deployment scenario', () => {
    beforeEach()
    
    process.env.NODE_ENV = 'production'
    process.env.PORT = '8080'
    process.env.HOST = '0.0.0.0'
    process.env.DATABASE_URL = 'postgresql://user:pass@postgres:5432/app'
    process.env.LOG_FORMAT = 'json'
    process.env.MONITORING_ENABLED = 'true'

    const config = getConfigSync()

    expect(config.server?.port).toBe(8080)
    expect(config.server?.host).toBe('0.0.0.0')
    expect(config.database?.url).toBe('postgresql://user:pass@postgres:5432/app')
    expect(config.logging?.format).toBe('json')
    expect(config.monitoring?.enabled).toBe(true)
    
    afterEach()
  })

  test('handles complex nested configuration', () => {
    beforeEach()
    
    process.env.CORS_ORIGINS = 'http://localhost:3000,https://myapp.com'
    process.env.CORS_METHODS = 'GET,POST,PUT,DELETE'
    process.env.CORS_CREDENTIALS = 'true'
    process.env.CORS_MAX_AGE = '86400'

    const config = getConfigSync()

    expect(config.server?.cors?.origins).toEqual(['http://localhost:3000', 'https://myapp.com'])
    expect(config.server?.cors?.methods).toEqual(['GET', 'POST', 'PUT', 'DELETE'])
    expect(config.server?.cors?.credentials).toBe(true)
    expect(config.server?.cors?.maxAge).toBe(86400)
    
    afterEach()
  })

  test('handles invalid environment variables gracefully', () => {
    beforeEach()
    
    process.env.PORT = 'invalid'
    process.env.LOG_LEVEL = 'invalid'
    process.env.MONITORING_ENABLED = 'maybe'

    const config = getConfigSync()

    expect(typeof config.server?.port).toBe('number')
    // Log level should be valid (invalid falls back to default)
    expect(typeof config.logging?.level).toBe('string')
    expect(typeof config.monitoring?.enabled).toBe('boolean')
    
    afterEach()
  })
})

// Run summary
setTimeout(() => {
  console.log(`\n${colors.bold}Test Results:${colors.reset}`)
  console.log(`${colors.green}✓ Passed: ${testsPassed}${colors.reset}`)
  console.log(`${colors.red}✗ Failed: ${testsFailed}${colors.reset}`)
  console.log(`${colors.blue}Total: ${testsTotal}${colors.reset}`)
  
  if (testsFailed === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 All tests passed!${colors.reset}`)
    process.exit(0)
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ Some tests failed${colors.reset}`)
    process.exit(1)
  }
}, 100) // Give async tests time to complete