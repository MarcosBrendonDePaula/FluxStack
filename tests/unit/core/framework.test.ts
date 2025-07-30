import { describe, it, expect, beforeEach } from 'vitest'
import { FluxStackFramework } from '@/core/server/framework'
import type { FluxStackConfig, Plugin } from '@/core/types'

describe('FluxStackFramework', () => {
  let framework: FluxStackFramework

  beforeEach(() => {
    framework = new FluxStackFramework({
      port: 3001,
      apiPrefix: '/api'
    })
  })

  describe('constructor', () => {
    it('should create framework with default config', () => {
      const defaultFramework = new FluxStackFramework()
      const context = defaultFramework.getContext()
      
      expect(context.config.port).toBe(3000)
      expect(context.config.apiPrefix).toBe('/api')
      expect(context.config.vitePort).toBe(5173)
    })

    it('should create framework with custom config', () => {
      const config: FluxStackConfig = {
        port: 4000,
        vitePort: 5174,
        apiPrefix: '/custom-api'
      }
      
      const customFramework = new FluxStackFramework(config)
      const context = customFramework.getContext()
      
      expect(context.config.port).toBe(4000)
      expect(context.config.vitePort).toBe(5174)
      expect(context.config.apiPrefix).toBe('/custom-api')
    })

    it('should set development mode correctly', () => {
      const context = framework.getContext()
      expect(context.isDevelopment).toBe(process.env.NODE_ENV !== 'production')
      expect(context.isProduction).toBe(process.env.NODE_ENV === 'production')
    })
  })

  describe('plugin system', () => {
    it('should add plugins correctly', () => {
      const mockPlugin: Plugin = {
        name: 'test-plugin',
        setup: () => {}
      }

      const result = framework.use(mockPlugin)
      expect(result).toBe(framework) // Should return framework for chaining
    })

    it('should handle multiple plugins', () => {
      const plugin1: Plugin = {
        name: 'plugin-1',
        setup: () => {}
      }
      
      const plugin2: Plugin = {
        name: 'plugin-2',
        setup: () => {}
      }

      framework.use(plugin1).use(plugin2)
      // Framework should not throw and should allow chaining
      expect(framework).toBeDefined()
    })
  })

  describe('routes', () => {
    it('should register routes correctly', () => {
      // Create a proper Elysia instance for testing
      const { Elysia } = require('elysia')
      const mockRoutes = new Elysia()
        .get('/test', () => 'mock route')

      const result = framework.routes(mockRoutes)
      expect(result).toBe(framework) // Should return framework for chaining
    })
  })

  describe('getApp', () => {
    it('should return Elysia app instance', () => {
      const app = framework.getApp()
      expect(app).toBeDefined()
      // Elysia apps have these methods
      expect(typeof app.get).toBe('function')
      expect(typeof app.post).toBe('function')
      expect(typeof app.listen).toBe('function')
    })
  })

  describe('getContext', () => {
    it('should return framework context', () => {
      const context = framework.getContext()
      
      expect(context).toBeDefined()
      expect(context.config).toBeDefined()
      expect(typeof context.isDevelopment).toBe('boolean')
      expect(typeof context.isProduction).toBe('boolean')
    })
  })
})