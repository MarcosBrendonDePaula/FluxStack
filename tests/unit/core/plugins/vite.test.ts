import { describe, it, expect, vi, beforeEach } from 'vitest'
import { vitePlugin } from '@/core/server/plugins/vite'
import type { FluxStackContext } from '@/core/types'

// Mock fetch globally
global.fetch = vi.fn()

describe('Vite Plugin', () => {
  let mockContext: FluxStackContext
  let mockApp: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useFakeTimers()

    mockContext = {
      config: {
        port: 3000,
        vitePort: 5173,
        clientPath: 'app/client',
        apiPrefix: '/api',
        cors: {
          origins: ['http://localhost:5173'],
          methods: ['GET', 'POST'],
          headers: ['Content-Type']
        },
        build: {
          outDir: 'dist',
          target: 'es2020'
        }
      },
      isDevelopment: true,
      isProduction: false,
      envConfig: {}
    } as FluxStackContext

    mockApp = {
      get: vi.fn(),
      post: vi.fn(),
      use: vi.fn()
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Development Mode', () => {
    it('should set up plugin in development mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await vitePlugin.setup(mockContext, mockApp)
      
      expect(consoleSpy).toHaveBeenCalledWith('   🔄 Aguardando Vite na porta 5173...')
      
      consoleSpy.mockRestore()
    })

    it('should check for Vite after timeout', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Mock successful Vite check
      vi.mocked(fetch).mockResolvedValueOnce({
        status: 200,
        ok: true
      } as Response)
      
      await vitePlugin.setup(mockContext, mockApp)
      
      // Fast-forward timers to trigger the setTimeout
      vi.advanceTimersByTime(2000)
      
      // Wait for the async operation to complete
      await vi.runAllTimersAsync()
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:5173', {
        signal: expect.any(AbortSignal)
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('   ✅ Vite detectado na porta 5173')
      expect(consoleSpy).toHaveBeenCalledWith('   🔄 Hot reload coordenado via concurrently')
      
      consoleSpy.mockRestore()
    })

    it('should handle Vite check failure silently', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Mock failed Vite check
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection refused'))
      
      await vitePlugin.setup(mockContext, mockApp)
      
      // Fast-forward timers
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:5173', {
        signal: expect.any(AbortSignal)
      })
      
      // Should not log success messages when Vite is not running
      expect(consoleSpy).not.toHaveBeenCalledWith('   ✅ Vite detectado na porta 5173')
      
      consoleSpy.mockRestore()
    })

    it('should use custom vite port from context', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const customContext = {
        ...mockContext,
        config: {
          ...mockContext.config,
          vitePort: 3001
        }
      }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        status: 200,
        ok: true
      } as Response)
      
      await vitePlugin.setup(customContext, mockApp)
      
      expect(consoleSpy).toHaveBeenCalledWith('   🔄 Aguardando Vite na porta 3001...')
      
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:3001', {
        signal: expect.any(AbortSignal)
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Production Mode', () => {
    it('should skip plugin setup in production mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const productionContext = {
        ...mockContext,
        isDevelopment: false,
        isProduction: true
      }
      
      await vitePlugin.setup(productionContext, mockApp)
      
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(fetch).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Plugin Properties', () => {
    it('should have correct plugin name', () => {
      expect(vitePlugin.name).toBe('vite')
    })

    it('should have setup function', () => {
      expect(typeof vitePlugin.setup).toBe('function')
    })
  })

  describe('checkViteRunning function', () => {
    it('should return true for successful connection', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        status: 200,
        ok: true
      } as Response)

      // We need to access the checkViteRunning function
      // Since it's not exported, we'll test it indirectly through the plugin
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await vitePlugin.setup(mockContext, mockApp)
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()

      expect(consoleSpy).toHaveBeenCalledWith('   ✅ Vite detectado na porta 5173')
      
      consoleSpy.mockRestore()
    })

    it('should return false for connection timeout', async () => {
      vi.mocked(fetch).mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 1500)
        })
      )

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await vitePlugin.setup(mockContext, mockApp)
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()

      // Should not show success message when timeout occurs
      expect(consoleSpy).not.toHaveBeenCalledWith('   ✅ Vite detectado na porta 5173')
      
      consoleSpy.mockRestore()
    })
  })
})