/**
 * Tests for Configuration Loader
 * Tests the main configuration loading system, including file loading, caching, and fallbacks
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  getConfig, 
  getConfigSync, 
  reloadConfig,
  createPluginConfig,
  isFeatureEnabled,
  createLegacyConfig
} from '../index'
import type { FluxStackConfig } from '../schema'

// Mock file system operations
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  promises: {
    readFile: vi.fn(),
    access: vi.fn()
  }
}))

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn()
}))

describe('Configuration Loader', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    // Clear relevant environment variables
    for (const key in process.env) {
      if (key.startsWith('FLUXSTACK_') || key.startsWith('PORT') || key.startsWith('HOST') ||
          key.startsWith('NODE_ENV')) {
        delete process.env[key]
      }
    }
    
    // Clear any cached configurations
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getConfigSync', () => {
    test('loads configuration from environment variables', () => {
      process.env.PORT = '4000'
      process.env.HOST = 'example.com'
      process.env.LOG_LEVEL = 'debug'
      process.env.NODE_ENV = 'production'

      const config = getConfigSync()

      expect(config.server?.port).toBe(4000)
      expect(config.server?.host).toBe('example.com')
      expect(config.logging?.level).toBe('debug')
    })

    test('applies environment defaults based on NODE_ENV', () => {
      process.env.NODE_ENV = 'production'

      const config = getConfigSync()

      // Should apply production defaults
      expect(config.build?.optimization?.minify).toBe(true)
      expect(config.monitoring?.enabled).toBe(true)
    })

    test('uses development defaults when NODE_ENV not set', () => {
      delete process.env.NODE_ENV

      const config = getConfigSync()

      // Should apply development defaults
      expect(config.build?.optimization?.minify).toBe(false)
      expect(config.monitoring?.enabled).toBe(false)
    })

    test('handles custom environment variables with FluxStack prefix', () => {
      process.env.FLUXSTACK_PORT = '5000'
      process.env.FLUXSTACK_API_PREFIX = '/v2'
      process.env.FLUXSTACK_LOG_LEVEL = 'error'

      // Force reload config to pick up new env vars
      reloadConfig()
      const config = getConfigSync()

      expect(config.server?.port).toBe(5000)
      expect(config.server?.apiPrefix).toBe('/v2')
      expect(config.logging?.level).toBe('error')
    })

    test('merges CORS configuration from environment', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com'
      process.env.CORS_METHODS = 'GET,POST,DELETE'
      process.env.CORS_CREDENTIALS = 'true'

      const config = getConfigSync()

      expect(config.server?.cors?.origins).toEqual(['http://localhost:3000', 'https://example.com'])
      expect(config.server?.cors?.methods).toEqual(['GET', 'POST', 'DELETE'])
      expect(config.server?.cors?.credentials).toBe(true)
    })

    test('handles database configuration from environment', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DATABASE_HOST = 'db.example.com'
      process.env.DATABASE_PORT = '5433'
      process.env.DATABASE_SSL = 'true'

      const config = getConfigSync()

      expect(config.database?.url).toBe('postgresql://user:pass@localhost:5432/db')
      expect(config.database?.host).toBe('db.example.com')
      expect(config.database?.port).toBe(5433)
      expect(config.database?.ssl).toBe(true)
    })

    test('handles authentication configuration', () => {
      process.env.JWT_SECRET = 'my-secret-key'
      process.env.JWT_EXPIRES_IN = '7d'
      process.env.JWT_ALGORITHM = 'HS256'

      const config = getConfigSync()

      expect(config.auth?.secret).toBe('my-secret-key')
      expect(config.auth?.expiresIn).toBe('7d')
      expect(config.auth?.algorithm).toBe('HS256')
    })

    test('handles email configuration', () => {
      process.env.SMTP_HOST = 'smtp.gmail.com'
      process.env.SMTP_PORT = '587'
      process.env.SMTP_USER = 'user@example.com'
      process.env.SMTP_SECURE = 'true'

      const config = getConfigSync()

      expect(config.email?.host).toBe('smtp.gmail.com')
      expect(config.email?.port).toBe(587)
      expect(config.email?.user).toBe('user@example.com')
      expect(config.email?.secure).toBe(true)
    })

    test('handles monitoring configuration', () => {
      process.env.MONITORING_ENABLED = 'true'
      process.env.METRICS_ENABLED = 'false'
      process.env.METRICS_INTERVAL = '30000'
      process.env.PROFILING_ENABLED = 'true'

      const config = getConfigSync()

      expect(config.monitoring?.enabled).toBe(true)
      expect(config.monitoring?.metrics?.enabled).toBe(false)
      expect(config.monitoring?.metrics?.collectInterval).toBe(30000)
      expect(config.monitoring?.profiling?.enabled).toBe(true)
    })

    test('handles build configuration', () => {
      process.env.BUILD_TARGET = 'docker'
      process.env.BUILD_OUTDIR = 'build'
      process.env.BUILD_MINIFY = 'true'
      process.env.BUILD_SOURCEMAPS = 'false'

      reloadConfig()
      const config = getConfigSync()

      expect(config.build?.target).toBe('docker')
      expect(config.build?.outDir).toBe('build')
      expect(config.build?.optimization?.minify).toBe(true)
      expect(config.build?.sourceMaps).toBe(false)
    })

    test('handles plugin configuration', () => {
      process.env.FLUXSTACK_PLUGINS_ENABLED = 'plugin1,plugin2,plugin3'
      process.env.FLUXSTACK_PLUGINS_DISABLED = 'plugin4'

      reloadConfig()
      const config = getConfigSync()

      expect(config.plugins?.enabled).toEqual(['plugin1', 'plugin2', 'plugin3'])
      expect(config.plugins?.disabled).toEqual(['plugin4'])
    })
  })

  describe('createPluginConfig', () => {
    test('creates plugin configuration from main config', () => {
      const mainConfig: FluxStackConfig = {
        app: { name: 'TestApp', version: '1.0.0' },
        server: {
          port: 3000,
          host: 'localhost',
          apiPrefix: '/api',
          cors: {
            origins: ['*'],
            methods: ['GET', 'POST'],
            headers: ['Content-Type'],
            credentials: false,
            maxAge: 86400
          },
          middleware: []
        },
        client: {
          port: 5173,
          proxy: { target: 'http://localhost:3000' },
          build: {
            target: 'es2020',
            outDir: 'dist/client',
            sourceMaps: true,
            minify: false
          }
        },
        build: {
          target: 'bun',
          outDir: 'dist',
          clean: true,
          optimization: {
            minify: false,
            compress: false,
            treeshake: false,
            splitChunks: false,
            bundleAnalyzer: false
          },
          sourceMaps: true
        },
        logging: {
          level: 'info',
          format: 'pretty',
          transports: [
            { type: 'console', level: 'info', format: 'pretty' }
          ]
        },
        monitoring: {
          enabled: false,
          metrics: {
            enabled: false,
            collectInterval: 60000,
            httpMetrics: true,
            systemMetrics: true,
            customMetrics: false
          },
          profiling: {
            enabled: false,
            sampleRate: 0.1,
            memoryProfiling: false,
            cpuProfiling: false
          },
          exporters: []
        },
        plugins: {
          enabled: [],
          disabled: [],
          config: {
            vite: {
              port: 5174,
              enabled: true
            },
            logger: {
              logRequests: true,
              logResponses: false
            }
          }
        },
        custom: {
          myPlugin: {
            customSetting: 'value'
          }
        }
      } as FluxStackConfig

      // Test plugin config from plugins.config
      const viteConfig = createPluginConfig(mainConfig, 'vite')
      expect(viteConfig).toEqual({
        port: 5174,
        enabled: true
      })

      // Test plugin config from custom section
      const myPluginConfig = createPluginConfig(mainConfig, 'myPlugin')
      expect(myPluginConfig).toEqual({
        customSetting: 'value'
      })

      // Test merging both sections
      const combinedConfig: FluxStackConfig = {
        ...mainConfig,
        plugins: {
          ...mainConfig.plugins,
          config: {
            ...mainConfig.plugins.config,
            myPlugin: {
              baseSetting: 'base'
            }
          }
        }
      }

      const mergedConfig = createPluginConfig(combinedConfig, 'myPlugin')
      expect(mergedConfig).toEqual({
        baseSetting: 'base',
        customSetting: 'value' // custom should override plugins.config
      })
    })

    test('returns empty object for non-existent plugin', () => {
      const mainConfig: FluxStackConfig = {
        app: { name: 'TestApp', version: '1.0.0' },
        server: {
          port: 3000,
          host: 'localhost',
          apiPrefix: '/api',
          cors: {
            origins: ['*'],
            methods: ['GET', 'POST'],
            headers: ['Content-Type'],
            credentials: false,
            maxAge: 86400
          },
          middleware: []
        },
        client: {
          port: 5173,
          proxy: { target: 'http://localhost:3000' },
          build: {
            target: 'es2020',
            outDir: 'dist/client',
            sourceMaps: true,
            minify: false
          }
        },
        build: {
          target: 'bun',
          outDir: 'dist',
          clean: true,
          optimization: {
            minify: false,
            compress: false,
            treeshake: false,
            splitChunks: false,
            bundleAnalyzer: false
          },
          sourceMaps: true
        },
        logging: {
          level: 'info',
          format: 'pretty',
          transports: [
            { type: 'console', level: 'info', format: 'pretty' }
          ]
        },
        monitoring: {
          enabled: false,
          metrics: {
            enabled: false,
            collectInterval: 60000,
            httpMetrics: true,
            systemMetrics: true,
            customMetrics: false
          },
          profiling: {
            enabled: false,
            sampleRate: 0.1,
            memoryProfiling: false,
            cpuProfiling: false
          },
          exporters: []
        },
        plugins: {
          enabled: [],
          disabled: [],
          config: {}
        }
      } as FluxStackConfig

      const config = createPluginConfig(mainConfig, 'nonexistent')
      expect(config).toEqual({})
    })
  })

  describe('isFeatureEnabled', () => {
    test('checks if feature is enabled in plugins', () => {
      const config: FluxStackConfig = {
        app: { name: 'TestApp', version: '1.0.0' },
        server: {
          port: 3000,
          host: 'localhost',
          apiPrefix: '/api',
          cors: {
            origins: ['*'],
            methods: ['GET', 'POST'],
            headers: ['Content-Type'],
            credentials: false,
            maxAge: 86400
          },
          middleware: []
        },
        client: {
          port: 5173,
          proxy: { target: 'http://localhost:3000' },
          build: {
            target: 'es2020',
            outDir: 'dist/client',
            sourceMaps: true,
            minify: false
          }
        },
        build: {
          target: 'bun',
          outDir: 'dist',
          clean: true,
          optimization: {
            minify: false,
            compress: false,
            treeshake: false,
            splitChunks: false,
            bundleAnalyzer: false
          },
          sourceMaps: true
        },
        logging: {
          level: 'info',
          format: 'pretty',
          transports: [
            { type: 'console', level: 'info', format: 'pretty' }
          ]
        },
        monitoring: {
          enabled: true,
          metrics: {
            enabled: true,
            collectInterval: 60000,
            httpMetrics: true,
            systemMetrics: true,
            customMetrics: false
          },
          profiling: {
            enabled: false,
            sampleRate: 0.1,
            memoryProfiling: false,
            cpuProfiling: false
          },
          exporters: []
        },
        plugins: {
          enabled: ['plugin1', 'plugin2'],
          disabled: ['plugin3'],
          config: {}
        },
        custom: {
          customFeature: true
        }
      } as FluxStackConfig

      expect(isFeatureEnabled(config, 'plugin1')).toBe(true)
      expect(isFeatureEnabled(config, 'plugin2')).toBe(true)
      expect(isFeatureEnabled(config, 'plugin3')).toBe(false) // disabled
      expect(isFeatureEnabled(config, 'plugin4')).toBe(false) // not in enabled
      expect(isFeatureEnabled(config, 'monitoring')).toBe(true)
      expect(isFeatureEnabled(config, 'metrics')).toBe(true)
      expect(isFeatureEnabled(config, 'profiling')).toBe(false)
      expect(isFeatureEnabled(config, 'customFeature')).toBe(true)
      expect(isFeatureEnabled(config, 'nonexistent')).toBe(false)
    })
  })

  describe('createLegacyConfig', () => {
    test('creates legacy configuration format', () => {
      const config: FluxStackConfig = {
        app: { name: 'TestApp', version: '1.0.0' },
        server: {
          port: 4000,
          host: 'localhost',
          apiPrefix: '/v2',
          cors: {
            origins: ['http://localhost:3000', 'https://example.com'],
            methods: ['GET', 'POST', 'PUT'],
            headers: ['Content-Type', 'Authorization'],
            credentials: true,
            maxAge: 86400
          },
          middleware: []
        },
        client: {
          port: 5174,
          proxy: { target: 'http://localhost:3000' },
          build: {
            target: 'es2020',
            outDir: 'dist/client',
            sourceMaps: true,
            minify: false
          }
        },
        build: {
          target: 'docker',
          outDir: 'build',
          clean: true,
          optimization: {
            minify: false,
            compress: false,
            treeshake: false,
            splitChunks: false,
            bundleAnalyzer: false
          },
          sourceMaps: true
        },
        logging: {
          level: 'info',
          format: 'pretty',
          transports: [
            { type: 'console', level: 'info', format: 'pretty' }
          ]
        },
        monitoring: {
          enabled: false,
          metrics: {
            enabled: false,
            collectInterval: 60000,
            httpMetrics: true,
            systemMetrics: true,
            customMetrics: false
          },
          profiling: {
            enabled: false,
            sampleRate: 0.1,
            memoryProfiling: false,
            cpuProfiling: false
          },
          exporters: []
        },
        plugins: {
          enabled: [],
          disabled: [],
          config: {}
        }
      } as FluxStackConfig

      const legacyConfig = createLegacyConfig(config)

      expect(legacyConfig).toEqual({
        port: 4000,
        vitePort: 5174,
        clientPath: 'app/client',
        apiPrefix: '/v2',
        cors: {
          origins: ['http://localhost:3000', 'https://example.com'],
          methods: ['GET', 'POST', 'PUT'],
          headers: ['Content-Type', 'Authorization']
        },
        build: {
          outDir: 'build',
          target: 'docker'
        }
      })
    })
  })

  describe('error handling and warnings', () => {
    test('handles configuration with warnings gracefully', () => {
      // Test with invalid environment variables that should generate warnings
      process.env.PORT = 'invalid-port' // Should fall back to default
      process.env.LOG_LEVEL = 'invalid-level' // Should fall back to default
      process.env.BUILD_TARGET = 'invalid-target' // Should fall back to default

      expect(() => {
        const config = getConfigSync()
        // Should not throw, but use defaults
        expect(typeof config.server?.port).toBe('number')
        expect(['debug', 'info', 'warn', 'error']).toContain(config.logging?.level)
        expect(['bun', 'node', 'docker']).toContain(config.build?.target)
      }).not.toThrow()
    })

    test('handles missing optional configurations', () => {
      // No environment variables set
      const config = getConfigSync()

      // Should have default values and structure
      expect(config).toBeDefined()
      expect(config.app).toBeDefined()
      expect(config.server).toBeDefined()
      expect(config.plugins).toBeDefined()
    })
  })
})