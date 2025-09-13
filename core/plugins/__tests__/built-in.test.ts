/**
 * Tests for Built-in Plugins
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  loggerPlugin, 
  swaggerPlugin, 
  vitePlugin, 
  staticPlugin,
  monitoringPlugin,
  builtInPlugins,
  builtInPluginsList,
  getDefaultPlugins,
  getBuiltInPlugin,
  isBuiltInPlugin
} from '../built-in'
import type { PluginContext, RequestContext, ResponseContext, ErrorContext } from '../types'
import type { Logger } from '../../utils/logger'
import type { FluxStackConfig } from '../../config/schema'

// Mock logger
const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => mockLogger),
  time: vi.fn(),
  timeEnd: vi.fn(),
  request: vi.fn()
}

// Mock app
const mockApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}

// Mock config
const mockConfig: FluxStackConfig = {
  app: { name: 'test-app', version: '1.0.0' },
  server: {
    port: 3000,
    host: 'localhost',
    apiPrefix: '/api',
    cors: {
      origins: ['*'],
      methods: ['GET', 'POST'],
      headers: ['Content-Type']
    },
    middleware: []
  },
  client: {
    port: 5173,
    proxy: { target: 'http://localhost:3000' },
    build: {
      sourceMaps: true,
      minify: false,
      target: 'esnext',
      outDir: 'dist/client'
    }
  },
  build: {
    target: 'bun',
    outDir: 'dist',
    optimization: {
      minify: false,
      treeshake: false,
      compress: false,
      splitChunks: false,
      bundleAnalyzer: false
    },
    sourceMaps: true,
    clean: true
  },
  plugins: {
    enabled: [],
    disabled: [],
    config: {}
  },
  logging: {
    level: 'info',
    format: 'pretty',
    transports: []
  },
  monitoring: {
    enabled: false,
    metrics: {
      enabled: false,
      collectInterval: 5000,
      httpMetrics: false,
      systemMetrics: false,
      customMetrics: false
    },
    profiling: {
      enabled: false,
      sampleRate: 0.1,
      memoryProfiling: false,
      cpuProfiling: false
    },
    exporters: []
  }
}

// Mock utils
const mockUtils = {
  createTimer: vi.fn(() => ({ end: vi.fn(() => 100) })),
  formatBytes: vi.fn((bytes: number) => `${bytes} bytes`),
  isProduction: vi.fn(() => false),
  isDevelopment: vi.fn(() => true),
  getEnvironment: vi.fn(() => 'development'),
  createHash: vi.fn(() => 'hash123'),
  deepMerge: vi.fn((a, b) => ({ ...a, ...b })),
  validateSchema: vi.fn(() => ({ valid: true, errors: [] }))
}

describe('Built-in Plugins', () => {
  let context: PluginContext

  beforeEach(() => {
    context = {
      config: mockConfig,
      logger: mockLogger,
      app: mockApp,
      utils: mockUtils
    }
    vi.clearAllMocks()
  })

  describe('Plugin Structure', () => {
    it('should export all built-in plugins', () => {
      expect(builtInPlugins).toBeDefined()
      expect(builtInPlugins.logger).toBe(loggerPlugin)
      expect(builtInPlugins.swagger).toBe(swaggerPlugin)
      expect(builtInPlugins.vite).toBe(vitePlugin)
      expect(builtInPlugins.static).toBe(staticPlugin)
      expect(builtInPlugins.monitoring).toBe(monitoringPlugin)
    })

    it('should export plugins as array', () => {
      expect(builtInPluginsList).toHaveLength(5)
      expect(builtInPluginsList).toContain(loggerPlugin)
      expect(builtInPluginsList).toContain(swaggerPlugin)
      expect(builtInPluginsList).toContain(vitePlugin)
      expect(builtInPluginsList).toContain(staticPlugin)
      expect(builtInPluginsList).toContain(monitoringPlugin)
    })

    it('should have valid plugin structure', () => {
      for (const plugin of builtInPluginsList) {
        expect(plugin.name).toBeDefined()
        expect(typeof plugin.name).toBe('string')
        expect(plugin.version).toBeDefined()
        expect(plugin.description).toBeDefined()
        expect(plugin.author).toBeDefined()
        expect(plugin.setup).toBeDefined()
        expect(typeof plugin.setup).toBe('function')
      }
    })
  })

  describe('Logger Plugin', () => {
    it('should have correct metadata', () => {
      expect(loggerPlugin.name).toBe('logger')
      expect(loggerPlugin.priority).toBe('highest')
      expect(loggerPlugin.category).toBe('core')
      expect(loggerPlugin.configSchema).toBeDefined()
      expect(loggerPlugin.defaultConfig).toBeDefined()
    })

    it('should setup successfully', async () => {
      await loggerPlugin.setup!(context)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Enhanced logger plugin initialized',
        expect.any(Object)
      )
    })

    it('should handle server start', async () => {
      await loggerPlugin.onServerStart!(context)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Logger plugin: Server started',
        expect.any(Object)
      )
    })

    it('should handle server stop', async () => {
      await loggerPlugin.onServerStop!(context)
      expect(mockLogger.info).toHaveBeenCalledWith('Logger plugin: Server stopped')
    })

    it('should handle request logging', async () => {
      const requestContext: RequestContext = {
        request: new Request('http://localhost:3000/test'),
        path: '/test',
        method: 'GET',
        headers: { 'user-agent': 'test' },
        query: {},
        params: {},
        startTime: Date.now()
      }

      await loggerPlugin.onRequest!(requestContext)
      // Logger function would be called if available in context
    })

    it('should handle response logging', async () => {
      const responseContext: ResponseContext = {
        request: new Request('http://localhost:3000/test'),
        path: '/test',
        method: 'GET',
        headers: {},
        query: {},
        params: {},
        startTime: Date.now(),
        response: new Response('OK'),
        statusCode: 200,
        duration: 100
      }

      await loggerPlugin.onResponse!(responseContext)
      // Logger function would be called if available in context
    })

    it('should handle error logging', async () => {
      const errorContext: ErrorContext = {
        request: new Request('http://localhost:3000/test'),
        path: '/test',
        method: 'GET',
        headers: {},
        query: {},
        params: {},
        startTime: Date.now(),
        error: new Error('Test error'),
        duration: 100,
        handled: false
      }

      await loggerPlugin.onError!(errorContext)
      // Logger function would be called if available in context
    })
  })

  describe('Swagger Plugin', () => {
    it('should have correct metadata', () => {
      expect(swaggerPlugin.name).toBe('swagger')
      expect(swaggerPlugin.priority).toBe('normal')
      expect(swaggerPlugin.category).toBe('documentation')
      expect(swaggerPlugin.configSchema).toBeDefined()
      expect(swaggerPlugin.defaultConfig).toBeDefined()
    })

    it('should setup successfully', async () => {
      await swaggerPlugin.setup!(context)
      expect(mockApp.use).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Swagger documentation enabled'),
        expect.any(Object)
      )
    })

    it('should handle server start', async () => {
      await swaggerPlugin.onServerStart!(context)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Swagger documentation available')
      )
    })
  })

  describe('Vite Plugin', () => {
    it('should have correct metadata', () => {
      expect(vitePlugin.name).toBe('vite')
      expect(vitePlugin.priority).toBe('high')
      expect(vitePlugin.category).toBe('development')
      expect(vitePlugin.configSchema).toBeDefined()
      expect(vitePlugin.defaultConfig).toBeDefined()
    })

    it('should setup successfully', async () => {
      await vitePlugin.setup!(context)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Setting up Vite integration')
      )
    })

    it('should handle server start', async () => {
      // Setup first to initialize vite config
      await vitePlugin.setup!(context)
      await vitePlugin.onServerStart!(context)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Vite integration active')
      )
    })
  })

  describe('Static Plugin', () => {
    it('should have correct metadata', () => {
      expect(staticPlugin.name).toBe('static')
      expect(staticPlugin.priority).toBe('low')
      expect(staticPlugin.category).toBe('core')
      expect(staticPlugin.configSchema).toBeDefined()
      expect(staticPlugin.defaultConfig).toBeDefined()
    })

    it('should setup successfully', async () => {
      await staticPlugin.setup!(context)
      expect(mockApp.get).toHaveBeenCalledWith('/*', expect.any(Function))
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Enhanced static files plugin activated',
        expect.any(Object)
      )
    })

    it('should handle server start', async () => {
      await staticPlugin.onServerStart!(context)
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Static files plugin ready'),
        expect.any(Object)
      )
    })
  })

  describe('Plugin Utilities', () => {
    it('should get default plugins for development', () => {
      const plugins = getDefaultPlugins('development')
      expect(plugins).toHaveLength(5)
      expect(plugins).toContain(loggerPlugin)
      expect(plugins).toContain(staticPlugin)
      expect(plugins).toContain(vitePlugin)
      expect(plugins).toContain(swaggerPlugin)
      expect(plugins).toContain(monitoringPlugin)
    })

    it('should get default plugins for production', () => {
      const plugins = getDefaultPlugins('production')
      expect(plugins).toHaveLength(3)
      expect(plugins).toContain(loggerPlugin)
      expect(plugins).toContain(staticPlugin)
      expect(plugins).toContain(monitoringPlugin)
    })

    it('should get default plugins for test', () => {
      const plugins = getDefaultPlugins('test')
      expect(plugins).toHaveLength(1)
      expect(plugins).toContain(loggerPlugin)
    })

    it('should get plugin by name', () => {
      expect(getBuiltInPlugin('logger')).toBe(loggerPlugin)
      expect(getBuiltInPlugin('swagger')).toBe(swaggerPlugin)
      expect(getBuiltInPlugin('monitoring')).toBe(monitoringPlugin)
      expect(getBuiltInPlugin('nonexistent')).toBeUndefined()
    })

    it('should check if plugin is built-in', () => {
      expect(isBuiltInPlugin('logger')).toBe(true)
      expect(isBuiltInPlugin('swagger')).toBe(true)
      expect(isBuiltInPlugin('monitoring')).toBe(true)
      expect(isBuiltInPlugin('custom-plugin')).toBe(false)
    })
  })
})