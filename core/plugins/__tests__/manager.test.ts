/**
 * Tests for Plugin Manager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PluginManager } from '../manager'
import type { Plugin, PluginContext } from '../types'
import type { Logger } from '../../utils/logger/index'
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
    enabled: [], // Enable all plugins by default for testing
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

describe('PluginManager', () => {
  let manager: PluginManager
  let mockApp: any

  beforeEach(() => {
    mockApp = { use: vi.fn(), get: vi.fn(), post: vi.fn() }
    manager = new PluginManager({
      config: mockConfig,
      logger: mockLogger,
      app: mockApp
    })
    vi.clearAllMocks()
  })

  afterEach(async () => {
    if (manager) {
      await manager.shutdown()
    }
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await manager.initialize()
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing plugin manager')
      expect(mockLogger.info).toHaveBeenCalledWith('Plugin manager initialized successfully', expect.any(Object))
    }, 10000)

    it('should not initialize twice', async () => {
      mockLogger.info.mockClear() // Clear previous calls
      await manager.initialize()
      await manager.initialize() // Second call should be ignored
      
      // Should only log initialization once
      expect(mockLogger.info).toHaveBeenCalledTimes(6) // init start + plugin discovery start + discovery complete + init complete + additional logs
    })
  })

  describe('Plugin Registration', () => {
    it('should register a plugin', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        setup: vi.fn()
      }

      await manager.registerPlugin(plugin)
      
      const registry = manager.getRegistry()
      expect(registry.get('test-plugin')).toBe(plugin)
    })

    it('should execute setup hook when registering after initialization', async () => {
      const setupSpy = vi.fn()
      const plugin: Plugin = {
        name: 'test-plugin',
        setup: setupSpy
      }

      await manager.initialize()
      await manager.registerPlugin(plugin)
      
      expect(setupSpy).toHaveBeenCalled()
    })

    it('should unregister a plugin', async () => {
      const plugin: Plugin = {
        name: 'removable-plugin'
      }

      await manager.registerPlugin(plugin)
      manager.unregisterPlugin('removable-plugin')
      
      const registry = manager.getRegistry()
      expect(registry.get('removable-plugin')).toBeUndefined()
    })
  })

  describe('Hook Execution', () => {
    it('should execute setup hook on all plugins', async () => {
      const setupSpy1 = vi.fn()
      const setupSpy2 = vi.fn()

      const plugin1: Plugin = {
        name: 'plugin-1',
        setup: setupSpy1
      }

      const plugin2: Plugin = {
        name: 'plugin-2',
        setup: setupSpy2
      }

      await manager.registerPlugin(plugin1)
      await manager.registerPlugin(plugin2)

      const results = await manager.executeHook('setup')
      
      expect(results).toHaveLength(2)
      expect(results.every(r => r.success)).toBe(true)
      expect(setupSpy1).toHaveBeenCalled()
      expect(setupSpy2).toHaveBeenCalled()
    })

    it('should execute hooks in dependency order', async () => {
      const executionOrder: string[] = []

      const pluginA: Plugin = {
        name: 'plugin-a',
        setup: () => { executionOrder.push('plugin-a') }
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        dependencies: ['plugin-a'],
        setup: () => { executionOrder.push('plugin-b') }
      }

      await manager.registerPlugin(pluginA)
      await manager.registerPlugin(pluginB)

      await manager.executeHook('setup')
      
      expect(executionOrder).toEqual(['plugin-a', 'plugin-b'])
    })

    it('should respect plugin priorities', async () => {
      const executionOrder: string[] = []

      const lowPriorityPlugin: Plugin = {
        name: 'low-priority',
        priority: 1,
        setup: () => { executionOrder.push('low-priority') }
      }

      const highPriorityPlugin: Plugin = {
        name: 'high-priority',
        priority: 10,
        setup: () => { executionOrder.push('high-priority') }
      }

      await manager.registerPlugin(lowPriorityPlugin)
      await manager.registerPlugin(highPriorityPlugin)

      await manager.executeHook('setup')
      
      expect(executionOrder.indexOf('high-priority')).toBeLessThan(executionOrder.indexOf('low-priority'))
    })

    it('should handle plugin hook errors gracefully', async () => {
      const errorPlugin: Plugin = {
        name: 'error-plugin',
        setup: () => {
          throw new Error('Plugin setup failed')
        }
      }

      const goodPlugin: Plugin = {
        name: 'good-plugin',
        setup: vi.fn()
      }

      await manager.registerPlugin(errorPlugin)
      await manager.registerPlugin(goodPlugin)

      const results = await manager.executeHook('setup')
      
      expect(results).toHaveLength(2)
      expect(results.find(r => r.plugin === 'error-plugin')?.success).toBe(false)
      expect(results.find(r => r.plugin === 'good-plugin')?.success).toBe(true)
    })

    it('should execute hooks in parallel when specified', async () => {
      const startTimes: Record<string, number> = {}
      const endTimes: Record<string, number> = {}

      const plugin1: Plugin = {
        name: 'plugin-1',
        setup: async () => {
          startTimes['plugin-1'] = Date.now()
          await new Promise(resolve => setTimeout(resolve, 50))
          endTimes['plugin-1'] = Date.now()
        }
      }

      const plugin2: Plugin = {
        name: 'plugin-2',
        setup: async () => {
          startTimes['plugin-2'] = Date.now()
          await new Promise(resolve => setTimeout(resolve, 50))
          endTimes['plugin-2'] = Date.now()
        }
      }

      await manager.registerPlugin(plugin1)
      await manager.registerPlugin(plugin2)

      await manager.executeHook('setup', undefined, { parallel: true })
      
      // In parallel execution, both should start around the same time
      const timeDiff = Math.abs(startTimes['plugin-1'] - startTimes['plugin-2'])
      expect(timeDiff).toBeLessThan(20) // Allow for small timing differences
    })

    it('should handle hook timeout', async () => {
      const slowPlugin: Plugin = {
        name: 'slow-plugin',
        setup: async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      await manager.registerPlugin(slowPlugin)

      const results = await manager.executeHook('setup', undefined, { timeout: 100 })
      
      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(false)
      expect(results[0].error?.message).toContain('timed out')
    })
  })

  describe('Plugin Context', () => {
    it('should provide correct context to plugins', async () => {
      let receivedContext: PluginContext | undefined

      const plugin: Plugin = {
        name: 'context-plugin',
        setup: (context) => {
          receivedContext = context
        }
      }

      await manager.registerPlugin(plugin)
      await manager.executeHook('setup')
      
      expect(receivedContext).toBeDefined()
      expect(receivedContext?.config).toBe(mockConfig)
      expect(receivedContext?.app).toBe(mockApp)
      expect(receivedContext?.logger).toBeDefined()
      expect(receivedContext?.utils).toBeDefined()
    })

    it('should provide plugin-specific logger', async () => {
      const plugin: Plugin = {
        name: 'logger-plugin',
        setup: (_context) => {
          // Logger context is available but not used in this test
        }
      }

      await manager.registerPlugin(plugin)
      await manager.executeHook('setup')
      
      expect(mockLogger.child).toHaveBeenCalledWith({ plugin: 'logger-plugin' })
    })
  })

  describe('Plugin Metrics', () => {
    it('should track plugin metrics', async () => {
      const plugin: Plugin = {
        name: 'metrics-plugin',
        setup: async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      await manager.registerPlugin(plugin)
      await manager.executeHook('setup')
      
      const metrics = manager.getPluginMetrics('metrics-plugin')
      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('object')
      expect((metrics as any).hookExecutions).toBeDefined()
    })

    it('should get all plugin metrics', async () => {
      const plugin1: Plugin = { name: 'plugin-1', setup: vi.fn() }
      const plugin2: Plugin = { name: 'plugin-2', setup: vi.fn() }

      await manager.registerPlugin(plugin1)
      await manager.registerPlugin(plugin2)
      await manager.executeHook('setup')
      
      const allMetrics = manager.getPluginMetrics()
      expect(allMetrics instanceof Map).toBe(true)
      expect((allMetrics as Map<string, any>).size).toBe(2)
    })
  })

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      const shutdownSpy = vi.fn()
      
      const plugin: Plugin = {
        name: 'shutdown-plugin',
        onServerStop: shutdownSpy
      }

      await manager.registerPlugin(plugin)
      await manager.initialize()
      await manager.shutdown()
      
      expect(shutdownSpy).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('Shutting down plugin manager')
    })

    it('should not shutdown if not initialized', async () => {
      await manager.shutdown()
      expect(mockLogger.info).not.toHaveBeenCalledWith('Shutting down plugin manager')
    })
  })
})