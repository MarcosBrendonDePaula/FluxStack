/**
 * ComponentIsolationManager Tests
 * 
 * Unit tests for the ComponentIsolationManager class covering
 * component identity, hierarchy management, cleanup, and memory management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ComponentIsolationManager } from '../ComponentIsolationManager'
import type { ComponentIdentity } from '../types'

describe('ComponentIsolationManager', () => {
  let manager: ComponentIsolationManager
  let mockLogger: any

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
    
    // Create fresh manager instance
    manager = new ComponentIsolationManager(mockLogger)
  })

  afterEach(() => {
    // Clean up manager
    manager.shutdown()
  })

  describe('Component Creation', () => {
    it('should create component with deterministic ID', () => {
      const identity = manager.createInstance(
        'CounterAction',
        { initialValue: 10 },
        'client-123'
      )

      expect(identity.componentId).toMatch(/^CounterAction-[a-z0-9]+-[a-z0-9]+$/)
      expect(identity.componentType).toBe('CounterAction')
      expect(identity.clientId).toBe('client-123')
      expect(identity.depth).toBe(0)
      expect(identity.parentId).toBeUndefined()
      expect(identity.childIds.size).toBe(0)
    })

    it('should create hierarchical component with parent', () => {
      // Create parent
      const parent = manager.createInstance(
        'DashboardAction',
        {},
        'client-123'
      )

      // Create child
      const child = manager.createInstance(
        'CounterAction',
        { initialValue: 5 },
        'client-123',
        undefined,
        parent.componentId
      )

      expect(child.parentId).toBe(parent.componentId)
      expect(child.depth).toBe(1)
      expect(child.path).toBe('dashboardaction.counteraction')
      expect(parent.childIds.has(child.componentId)).toBe(true)
    })

    it('should generate unique IDs for same component type with different props', async () => {
      const identity1 = manager.createInstance(
        'CounterAction',
        { initialValue: 10 },
        'client-123'
      )

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1))

      const identity2 = manager.createInstance(
        'CounterAction',
        { initialValue: 20 },
        'client-123'
      )

      expect(identity1.componentId).not.toBe(identity2.componentId)
      expect(identity1.fingerprint).not.toBe(identity2.fingerprint)
    })

    it('should accept custom component ID', () => {
      const identity = manager.createInstance(
        'CounterAction',
        {},
        'client-123',
        'my-custom-counter'
      )

      expect(identity.componentId).toMatch(/^my-custom-counter-[a-z0-9]+$/)
    })
  })

  describe('Component Hierarchy', () => {
    let parent: ComponentIdentity
    let child1: ComponentIdentity
    let child2: ComponentIdentity
    let grandchild: ComponentIdentity

    beforeEach(() => {
      parent = manager.createInstance('ParentAction', {}, 'client-123')
      child1 = manager.createInstance('Child1Action', {}, 'client-123', undefined, parent.componentId)
      child2 = manager.createInstance('Child2Action', {}, 'client-123', undefined, parent.componentId)
      grandchild = manager.createInstance('GrandchildAction', {}, 'client-123', undefined, child1.componentId)
    })

    it('should build correct hierarchy information', () => {
      const hierarchy = manager.getHierarchy(child1.componentId)

      expect(hierarchy.component?.componentId).toBe(child1.componentId)
      expect(hierarchy.parent?.componentId).toBe(parent.componentId)
      expect(hierarchy.children).toHaveLength(1)
      expect(hierarchy.children[0].componentId).toBe(grandchild.componentId)
      expect(hierarchy.siblings).toHaveLength(1)
      expect(hierarchy.siblings[0].componentId).toBe(child2.componentId)
      expect(hierarchy.ancestors).toHaveLength(1)
      expect(hierarchy.ancestors[0].componentId).toBe(parent.componentId)
      expect(hierarchy.descendants).toHaveLength(1)
      expect(hierarchy.descendants[0].componentId).toBe(grandchild.componentId)
    })

    it('should calculate correct component paths', () => {
      expect(parent.path).toBe('parentaction')
      expect(child1.path).toBe('parentaction.child1action')
      expect(grandchild.path).toBe('parentaction.child1action.grandchildaction')
    })

    it('should calculate correct depths', () => {
      expect(parent.depth).toBe(0)
      expect(child1.depth).toBe(1)
      expect(child2.depth).toBe(1)
      expect(grandchild.depth).toBe(2)
    })
  })

  describe('Component Instance Management', () => {
    it('should register and retrieve instances', () => {
      const identity = manager.createInstance('CounterAction', {}, 'client-123')
      const mockInstance = { count: 0, increment: () => {} }

      manager.registerInstance(identity.componentId, mockInstance)
      const retrieved = manager.getInstance(identity.componentId)

      expect(retrieved).toBe(mockInstance)
    })

    it('should warn when registering duplicate instance', () => {
      const identity = manager.createInstance('CounterAction', {}, 'client-123')
      const mockInstance1 = { count: 0 }
      const mockInstance2 = { count: 5 }

      manager.registerInstance(identity.componentId, mockInstance1)
      manager.registerInstance(identity.componentId, mockInstance2)

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Component instance already exists')
      )
    })
  })

  describe('Component Cleanup', () => {
    it('should cleanup single component', () => {
      const identity = manager.createInstance('CounterAction', {}, 'client-123')
      const mockInstance = { count: 0 }
      manager.registerInstance(identity.componentId, mockInstance)

      manager.cleanupInstance(identity.componentId)

      expect(manager.getInstance(identity.componentId)).toBeUndefined()
      expect(manager.getIdentity(identity.componentId)).toBeUndefined()
    })

    it('should cleanup hierarchical components (children first)', () => {
      const parent = manager.createInstance('ParentAction', {}, 'client-123')
      const child = manager.createInstance('ChildAction', {}, 'client-123', undefined, parent.componentId)
      const grandchild = manager.createInstance('GrandchildAction', {}, 'client-123', undefined, child.componentId)

      const cleanupOrder: string[] = []
      const mockCleanup = (componentId: string) => () => {
        cleanupOrder.push(componentId)
      }

      manager.addCleanupFunction(parent.componentId, mockCleanup(parent.componentId))
      manager.addCleanupFunction(child.componentId, mockCleanup(child.componentId))
      manager.addCleanupFunction(grandchild.componentId, mockCleanup(grandchild.componentId))

      manager.cleanupInstance(parent.componentId)

      // Should cleanup grandchild, then child, then parent
      expect(cleanupOrder).toEqual([grandchild.componentId, child.componentId, parent.componentId])
    })

    it('should cleanup all components for client', () => {
      const identity1 = manager.createInstance('Counter1Action', {}, 'client-123')
      const identity2 = manager.createInstance('Counter2Action', {}, 'client-123')
      const identity3 = manager.createInstance('Counter3Action', {}, 'client-456')

      // Register instances so they can be found
      manager.registerInstance(identity1.componentId, { counter: 1 })
      manager.registerInstance(identity2.componentId, { counter: 2 })
      manager.registerInstance(identity3.componentId, { counter: 3 })

      manager.cleanupClient('client-123')

      expect(manager.getInstance(identity1.componentId)).toBeUndefined()
      expect(manager.getInstance(identity2.componentId)).toBeUndefined()
      expect(manager.getInstance(identity3.componentId)).toBeDefined() // Different client
    })

    it('should handle cleanup functions errors gracefully', () => {
      const identity = manager.createInstance('CounterAction', {}, 'client-123')
      
      const errorCleanup = () => {
        throw new Error('Cleanup failed')
      }
      const asyncErrorCleanup = async () => {
        throw new Error('Async cleanup failed')
      }

      manager.addCleanupFunction(identity.componentId, errorCleanup)
      manager.addCleanupFunction(identity.componentId, asyncErrorCleanup)

      expect(() => manager.cleanupInstance(identity.componentId)).not.toThrow()
      
      // Sync error should be logged immediately, async error will be logged later
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup function error'),
        expect.any(Error)
      )
    })
  })

  describe('Memory Management', () => {
    it('should track memory statistics', () => {
      const identity1 = manager.createInstance('CounterAction', {}, 'client-123')
      const identity2 = manager.createInstance('TimerAction', {}, 'client-123')

      const stats = manager.getMemoryStats()

      expect(stats.activeInstances).toBe(2)
      expect(stats.totalMemoryUsage).toBeGreaterThan(0)
      expect(stats.memoryByType.get('CounterAction')).toBe(1024) // Estimated
      expect(stats.memoryByType.get('TimerAction')).toBe(1024)
    })

    it('should detect orphaned instances', () => {
      const identity = manager.createInstance('CounterAction', {}, 'client-123')
      
      // Simulate orphaned instance by removing from tree but keeping instance
      manager['componentTree'].delete(identity.componentId)
      manager['instances'].set(identity.componentId, { count: 0 })

      manager.detectMemoryLeaks()

      const stats = manager.getMemoryStats()
      expect(stats.memoryLeaks.some(leak => 
        leak.componentId === identity.componentId && leak.leakType === 'instance'
      )).toBe(true)
    })
  })

  describe('Performance Metrics', () => {
    it('should initialize component metrics', () => {
      const identity = manager.createInstance('CounterAction', {}, 'client-123')
      const metrics = manager.getMetrics(identity.componentId)

      expect(metrics).toBeDefined()
      expect(metrics!.componentId).toBe(identity.componentId)
      expect(metrics!.updateCount).toBe(0)
      expect(metrics!.healthScore).toBe(100)
    })

    it('should update component metrics', () => {
      const identity = manager.createInstance('CounterAction', {}, 'client-123')
      
      manager.updateMetrics(identity.componentId, {
        updateCount: 5,
        avgUpdateTime: 50,
        warnings: ['Performance warning']
      })

      const metrics = manager.getMetrics(identity.componentId)
      expect(metrics!.updateCount).toBe(5)
      expect(metrics!.avgUpdateTime).toBe(50)
      expect(metrics!.warnings).toEqual(['Performance warning'])
      expect(metrics!.lastUpdated).toBeGreaterThan(0)
    })
  })

  describe('Query Operations', () => {
    beforeEach(() => {
      // Use different props to ensure different fingerprints/IDs
      manager.createInstance('CounterAction', { id: 1 }, 'client-123')
      manager.createInstance('CounterAction', { id: 2 }, 'client-123')
      manager.createInstance('TimerAction', { id: 1 }, 'client-456')
    })

    it('should get all components', () => {
      const components = manager.getAllComponents()
      expect(components).toHaveLength(3)
    })

    it('should get components by type', () => {
      const counterComponents = manager.getComponentsByType('CounterAction')
      expect(counterComponents).toHaveLength(2)
      counterComponents.forEach(c => {
        expect(c.componentType).toBe('CounterAction')
      })
    })

    it('should get components by client', () => {
      const client123Components = manager.getComponentsByClient('client-123')
      expect(client123Components).toHaveLength(2)
      client123Components.forEach(c => {
        expect(c.clientId).toBe('client-123')
      })

      const client456Components = manager.getComponentsByClient('client-456')
      expect(client456Components).toHaveLength(1)
      expect(client456Components[0].componentType).toBe('TimerAction')
    })
  })

  describe('Shutdown', () => {
    it('should shutdown cleanly', () => {
      const identity1 = manager.createInstance('CounterAction', {}, 'client-123')
      const identity2 = manager.createInstance('TimerAction', {}, 'client-456')

      manager.shutdown()

      expect(manager.getInstance(identity1.componentId)).toBeUndefined()
      expect(manager.getInstance(identity2.componentId)).toBeUndefined()
      expect(manager.getAllComponents()).toHaveLength(0)
    })
  })
})