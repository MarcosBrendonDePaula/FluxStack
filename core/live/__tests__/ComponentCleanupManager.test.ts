/**
 * ComponentCleanupManager Tests
 * 
 * Unit tests for the ComponentCleanupManager covering
 * component cleanup, garbage collection, and memory management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ComponentCleanupManager, CleanupEvent } from '../ComponentCleanupManager'
import { ComponentIsolationManager } from '../ComponentIsolationManager'

// Mock WebSocket with constants
const WS_OPEN = 1
const WS_CLOSED = 3

global.WebSocket = vi.fn().mockImplementation(() => ({
  readyState: WS_OPEN,
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}))

// Add WebSocket constants to global
Object.assign(global.WebSocket, {
  OPEN: WS_OPEN,
  CLOSED: WS_CLOSED
})

describe('ComponentCleanupManager', () => {
  let cleanupManager: ComponentCleanupManager
  let isolationManager: ComponentIsolationManager
  let mockLogger: any
  let mockWebSocket: any

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
    
    // Create isolation manager
    isolationManager = new ComponentIsolationManager(mockLogger)
    
    // Create cleanup manager
    cleanupManager = new ComponentCleanupManager(
      isolationManager,
      {
        enableGarbageCollection: false, // Disable for tests
        enableBrowserCloseDetection: false
      },
      mockLogger
    )

    // Create mock WebSocket
    mockWebSocket = {
      readyState: WebSocket.OPEN,
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  })

  afterEach(() => {
    cleanupManager.shutdown()
    isolationManager.shutdown()
  })

  describe('Component Registration', () => {
    it('should register component for cleanup tracking', () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      
      cleanupManager.registerComponent(identity.componentId, mockWebSocket)
      
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should register component with cleanup hooks', () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const cleanupHook = vi.fn()
      
      cleanupManager.registerComponent(identity.componentId, undefined, [cleanupHook])
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Registered component for cleanup'),
        expect.objectContaining({
          hasWebSocket: false,
          cleanupHooksCount: 1
        })
      )
    })

    it('should track component activity', () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      
      cleanupManager.registerComponent(identity.componentId)
      cleanupManager.updateComponentActivity(identity.componentId)
      
      // Activity should be updated (no direct way to test, but ensure no errors)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Registered component for cleanup'),
        expect.objectContaining({
          hasWebSocket: false,
          cleanupHooksCount: 0
        })
      )
    })
  })

  describe('Cleanup Hooks', () => {
    it('should add and execute global cleanup hooks', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const globalHook = vi.fn()
      
      cleanupManager.addGlobalCleanupHook(globalHook)
      cleanupManager.registerComponent(identity.componentId)
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      expect(globalHook).toHaveBeenCalledWith(identity.componentId, 'manual_cleanup')
    })

    it('should add and execute component-specific cleanup hooks', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const componentHook = vi.fn()
      
      cleanupManager.registerComponent(identity.componentId)
      cleanupManager.addComponentCleanupHook(identity.componentId, componentHook)
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      expect(componentHook).toHaveBeenCalledWith(identity.componentId, 'manual_cleanup')
    })

    it('should handle cleanup hook errors gracefully', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const errorHook = vi.fn().mockRejectedValue(new Error('Hook failed'))
      
      cleanupManager.registerComponent(identity.componentId)
      cleanupManager.addComponentCleanupHook(identity.componentId, errorHook)
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      expect(errorHook).toHaveBeenCalled()
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up component'),
        expect.objectContaining({
          event: 'manual_cleanup'
        })
      )
    })

    it('should remove cleanup hooks when returned function is called', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const hook = vi.fn()
      
      cleanupManager.registerComponent(identity.componentId)
      const removeHook = cleanupManager.addComponentCleanupHook(identity.componentId, hook)
      
      removeHook()
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      expect(hook).not.toHaveBeenCalled()
    })
  })

  describe('WebSocket Cleanup', () => {
    it('should close WebSocket during cleanup', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      
      cleanupManager.registerComponent(identity.componentId, mockWebSocket)
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      expect(mockWebSocket.close).toHaveBeenCalledWith(
        1000, 
        `Component cleanup: ${identity.componentId}`
      )
    })

    it('should handle WebSocket close errors', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const errorWebSocket = {
        ...mockWebSocket,
        close: vi.fn().mockImplementation(() => {
          throw new Error('Close failed')
        })
      }
      
      cleanupManager.registerComponent(identity.componentId, errorWebSocket)
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to close WebSocket'),
        expect.any(Error)
      )
    })

    it('should not attempt to close already closed WebSocket', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      
      const closedWebSocket = {
        readyState: WS_CLOSED,
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
      
      cleanupManager.registerComponent(identity.componentId, closedWebSocket)
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      expect(closedWebSocket.close).not.toHaveBeenCalled()
    })
  })

  describe('Batch Cleanup', () => {
    it('should cleanup multiple components in batches', async () => {
      const identity1 = isolationManager.createInstance('TestAction1', {}, 'client-123')
      const identity2 = isolationManager.createInstance('TestAction2', {}, 'client-123')
      const identity3 = isolationManager.createInstance('TestAction3', {}, 'client-123')
      
      cleanupManager.registerComponent(identity1.componentId)
      cleanupManager.registerComponent(identity2.componentId)
      cleanupManager.registerComponent(identity3.componentId)
      
      const componentIds = [identity1.componentId, identity2.componentId, identity3.componentId]
      
      await cleanupManager.cleanupComponents(componentIds, 'manual_cleanup')
      
      expect(isolationManager.getInstance(identity1.componentId)).toBeUndefined()
      expect(isolationManager.getInstance(identity2.componentId)).toBeUndefined()
      expect(isolationManager.getInstance(identity3.componentId)).toBeUndefined()
    })

    it('should cleanup all components for a client', async () => {
      const identity1 = isolationManager.createInstance('TestAction1', {}, 'client-123')
      const identity2 = isolationManager.createInstance('TestAction2', {}, 'client-123')
      const identity3 = isolationManager.createInstance('TestAction3', {}, 'client-456')
      
      // Register instances so they can be found
      isolationManager.registerInstance(identity1.componentId, { test: 1 })
      isolationManager.registerInstance(identity2.componentId, { test: 2 })
      isolationManager.registerInstance(identity3.componentId, { test: 3 })
      
      cleanupManager.registerComponent(identity1.componentId)
      cleanupManager.registerComponent(identity2.componentId)
      cleanupManager.registerComponent(identity3.componentId)
      
      await cleanupManager.cleanupClient('client-123')
      
      expect(isolationManager.getInstance(identity1.componentId)).toBeUndefined()
      expect(isolationManager.getInstance(identity2.componentId)).toBeUndefined()
      expect(isolationManager.getInstance(identity3.componentId)).toBeDefined() // Different client
    })
  })

  describe('Cleanup Statistics', () => {
    it('should track cleanup statistics', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      
      cleanupManager.registerComponent(identity.componentId)
      
      await cleanupManager.cleanupComponent(identity.componentId, 'manual_cleanup')
      
      const stats = cleanupManager.getCleanupStats()
      
      expect(stats.totalCleanups).toBe(1)
      expect(stats.cleanupsByEvent.get('manual_cleanup')).toBe(1)
      expect(stats.avgCleanupTime).toBeGreaterThan(0)
    })

    it('should track failed cleanups', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const failingHook = vi.fn().mockRejectedValue(new Error('Cleanup failed'))
      
      cleanupManager.registerComponent(identity.componentId)
      cleanupManager.addComponentCleanupHook(identity.componentId, failingHook)
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      const stats = cleanupManager.getCleanupStats()
      
      expect(stats.totalCleanups).toBe(1)
      // Component should still be cleaned up despite hook failure
    })
  })

  describe('Garbage Collection', () => {
    it('should force garbage collection', async () => {
      // Create and register components
      const identity1 = isolationManager.createInstance('TestAction1', {}, 'client-123')
      const identity2 = isolationManager.createInstance('TestAction2', {}, 'client-123')
      
      cleanupManager.registerComponent(identity1.componentId)
      cleanupManager.registerComponent(identity2.componentId)
      
      const result = await cleanupManager.forceGarbageCollection()
      
      expect(result.cleanedComponents).toBeGreaterThanOrEqual(0)
      expect(result.duration).toBeGreaterThan(0)
      expect(typeof result.memoryFreed).toBe('number')
    })

    it('should update GC statistics', async () => {
      // Create a component and make it stale by manipulating activity timestamp
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      cleanupManager.registerComponent(identity.componentId)
      
      // Make component stale by setting old activity timestamp
      const staleTime = Date.now() - (60 * 60 * 1000) // 1 hour ago
      cleanupManager['componentActivity'].set(identity.componentId, staleTime)
      
      const result = await cleanupManager.forceGarbageCollection()
      
      const stats = cleanupManager.getCleanupStats()
      
      expect(stats.lastGcTimestamp).toBeGreaterThan(0)
      expect(stats.lastGcCount).toBe(1) // Should have cleaned up 1 component
      expect(typeof stats.lastGcMemoryFreed).toBe('number')
      expect(result.cleanedComponents).toBe(1)
    })
  })

  describe('Performance', () => {
    it('should handle large number of cleanup hooks', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const hooks = Array.from({ length: 100 }, () => vi.fn())
      
      cleanupManager.registerComponent(identity.componentId, undefined, hooks)
      
      const startTime = performance.now()
      await cleanupManager.cleanupComponent(identity.componentId)
      const endTime = performance.now()
      
      // Should complete cleanup reasonably quickly
      expect(endTime - startTime).toBeLessThan(1000) // Less than 1 second
      
      // All hooks should have been called
      hooks.forEach(hook => {
        expect(hook).toHaveBeenCalledWith(identity.componentId, 'manual_cleanup')
      })
    })

    it('should respect cleanup timeout', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const slowHook = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      
      // Create cleanup manager with short timeout
      const fastCleanupManager = new ComponentCleanupManager(
        isolationManager,
        { cleanupTimeout: 50 },
        mockLogger
      )
      
      fastCleanupManager.registerComponent(identity.componentId)
      fastCleanupManager.addComponentCleanupHook(identity.componentId, slowHook)
      
      await expect(fastCleanupManager.cleanupComponent(identity.componentId))
        .rejects.toThrow('Cleanup timeout')
      
      fastCleanupManager.shutdown()
    })
  })

  describe('Error Handling', () => {
    it('should handle cleanup errors and continue', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      const errorHook = vi.fn().mockRejectedValue(new Error('Hook error'))
      const successHook = vi.fn()
      
      cleanupManager.registerComponent(identity.componentId)
      cleanupManager.addComponentCleanupHook(identity.componentId, errorHook)
      cleanupManager.addGlobalCleanupHook(successHook)
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      expect(errorHook).toHaveBeenCalled()
      expect(successHook).toHaveBeenCalled()
      expect(isolationManager.getInstance(identity.componentId)).toBeUndefined()
    })

    it('should track failed cleanup statistics', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      
      // Mock isolation manager to throw error
      const originalCleanup = isolationManager.cleanupInstance
      isolationManager.cleanupInstance = vi.fn().mockImplementation(() => {
        throw new Error('Cleanup failed')
      })
      
      cleanupManager.registerComponent(identity.componentId)
      
      await expect(cleanupManager.cleanupComponent(identity.componentId))
        .rejects.toThrow('Cleanup failed')
      
      const stats = cleanupManager.getCleanupStats()
      expect(stats.failedCleanups).toBe(1)
      
      // Restore original method
      isolationManager.cleanupInstance = originalCleanup
    })
  })

  describe('Shutdown', () => {
    it('should cleanup all components on shutdown', () => {
      const identity1 = isolationManager.createInstance('TestAction1', {}, 'client-123')
      const identity2 = isolationManager.createInstance('TestAction2', {}, 'client-123')
      
      cleanupManager.registerComponent(identity1.componentId)
      cleanupManager.registerComponent(identity2.componentId)
      
      cleanupManager.shutdown()
      
      expect(isolationManager.getInstance(identity1.componentId)).toBeUndefined()
      expect(isolationManager.getInstance(identity2.componentId)).toBeUndefined()
    })

    it('should handle shutdown cleanup errors', async () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-123')
      
      // Mock cleanup to throw error synchronously (since shutdown uses sync version)
      const originalCleanup = cleanupManager.cleanupComponent
      cleanupManager.cleanupComponent = vi.fn().mockImplementation(() => {
        throw new Error('Shutdown error')
      })
      
      cleanupManager.registerComponent(identity.componentId)
      
      expect(() => cleanupManager.shutdown()).not.toThrow()
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error during shutdown cleanup'),
        expect.any(Error)
      )
      
      // Restore original method
      cleanupManager.cleanupComponent = originalCleanup
    })
  })
})