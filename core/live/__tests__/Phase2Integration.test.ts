/**
 * Phase 2 Integration Tests
 * 
 * Comprehensive integration tests for Phase 2: Integration & Communication
 * Testing WebSocket communication, state bridge, event system, and FluxStack plugin.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ComponentIsolationManager } from '../ComponentIsolationManager'
import { ComponentCleanupManager } from '../ComponentCleanupManager'
import { WebSocketManager } from '../WebSocketManager'
import { LiveComponentStateBridge } from '../LiveComponentStateBridge'
import { LiveComponentEventSystem } from '../LiveComponentEventSystem'

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  readyState: 1,
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
})) as any

Object.assign(global.WebSocket, {
  OPEN: 1,
  CLOSED: 3
})

describe('Phase 2: Integration & Communication', () => {
  let isolationManager: ComponentIsolationManager
  let cleanupManager: ComponentCleanupManager
  let wsManager: WebSocketManager
  let stateBridge: LiveComponentStateBridge
  let eventSystem: LiveComponentEventSystem
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }

    // Initialize core managers
    isolationManager = new ComponentIsolationManager(mockLogger)
    cleanupManager = new ComponentCleanupManager(isolationManager, {
      enableGarbageCollection: false,
      gcInterval: 60000,
      staleThreshold: 30000,
      maxCleanupBatch: 10,
      enableBrowserCloseDetection: false
    }, mockLogger)

    wsManager = new WebSocketManager({
      url: 'ws://localhost:3000/test',
      maxReconnectAttempts: 3,
      reconnectDelay: 100,
      heartbeatInterval: 1000,
      maxQueueSize: 10,
      connectionTimeout: 1000,
      enableBatching: false
    }, mockLogger)

    stateBridge = new LiveComponentStateBridge(
      wsManager,
      isolationManager,
      {
        enableOptimisticUpdates: true,
        conflictStrategy: 'last_write_wins',
        enablePersistence: false,
        debounceDelay: 50
      },
      mockLogger
    )

    eventSystem = new LiveComponentEventSystem(
      wsManager,
      isolationManager,
      {
        maxQueueSize: 100,
        processingTimeout: 1000,
        enableBatching: true,
        batchSize: 5,
        enableHistory: true
      },
      mockLogger
    )

    vi.clearAllMocks()
  })

  afterEach(() => {
    eventSystem?.shutdown()
    stateBridge?.shutdown()
    wsManager?.shutdown()
    cleanupManager?.shutdown()
    isolationManager?.shutdown()
  })

  describe('Integration Architecture', () => {
    it('should initialize all Phase 2 systems successfully', () => {
      expect(isolationManager).toBeDefined()
      expect(cleanupManager).toBeDefined()
      expect(wsManager).toBeDefined()
      expect(stateBridge).toBeDefined()
      expect(eventSystem).toBeDefined()
    })

    it('should have proper system dependencies', () => {
      // WebSocketManager should be independent
      expect(wsManager.getConnectionState()).toBe('disconnected')
      
      // StateBridge should depend on WebSocketManager and IsolationManager
      expect(stateBridge).toBeDefined()
      
      // EventSystem should depend on WebSocketManager and IsolationManager
      expect(eventSystem).toBeDefined()
      
      // CleanupManager should depend on IsolationManager
      expect(cleanupManager.getCleanupStats()).toBeDefined()
    })
  })

  describe('Component Lifecycle Integration', () => {
    it('should handle complete component lifecycle', async () => {
      // Create component
      const identity = isolationManager.createInstance('TestComponent', { name: 'test' }, 'client-123')
      
      // Register for cleanup
      cleanupManager.registerComponent(identity.componentId)
      
      // Update component activity
      cleanupManager.updateComponentActivity(identity.componentId)
      
      // Subscribe to events
      const eventHandler = vi.fn()
      const unsubscribe = eventSystem.on(identity.componentId, 'test-event', eventHandler)
      
      // Emit event
      await eventSystem.emit(identity.componentId, 'test-event', { message: 'hello' })
      
      // Update state through bridge
      await stateBridge.updateState(identity.componentId, 'set', 'message', 'updated', false)
      
      // Verify state
      const currentState = stateBridge.getState(identity.componentId)
      expect(currentState).toBeDefined()
      
      // Cleanup
      await cleanupManager.cleanupComponent(identity.componentId)
      unsubscribe()
      
      // Verify cleanup
      expect(isolationManager.getInstance(identity.componentId)).toBeUndefined()
    })

    it('should handle multiple components with isolation', async () => {
      // Create multiple components
      const identity1 = isolationManager.createInstance('Component1', { id: 1 }, 'client-123')
      const identity2 = isolationManager.createInstance('Component2', { id: 2 }, 'client-456')
      
      // Register for cleanup
      cleanupManager.registerComponent(identity1.componentId)
      cleanupManager.registerComponent(identity2.componentId)
      
      // Set different states
      await stateBridge.setState(identity1.componentId, { value: 'first' }, false)
      await stateBridge.setState(identity2.componentId, { value: 'second' }, false)
      
      // Verify isolation
      const state1 = stateBridge.getState(identity1.componentId)
      const state2 = stateBridge.getState(identity2.componentId)
      
      expect(state1.value).toBe('first')
      expect(state2.value).toBe('second')
      expect(state1).not.toBe(state2) // Different references
      
      // Cleanup
      await cleanupManager.cleanupComponent(identity1.componentId)
      await cleanupManager.cleanupComponent(identity2.componentId)
    })
  })

  describe('State Bridge Integration', () => {
    it('should handle state updates with optimistic mode', async () => {
      const identity = isolationManager.createInstance('StateComponent', {}, 'client-123')
      
      // Set initial state
      await stateBridge.setState(identity.componentId, { count: 0 }, true)
      
      // Update with optimistic mode
      await stateBridge.updateState(identity.componentId, 'set', 'count', 5, true)
      
      // State should be updated immediately (optimistic)
      const currentState = stateBridge.getState(identity.componentId)
      expect(currentState.count).toBe(5)
      
      // Cleanup
      await cleanupManager.cleanupComponent(identity.componentId)
    })

    it('should handle merge operations', async () => {
      const identity = isolationManager.createInstance('MergeComponent', {}, 'client-123')
      
      // Set initial state
      await stateBridge.setState(identity.componentId, { a: 1, b: 2 }, false)
      
      // Merge partial state
      await stateBridge.mergeState(identity.componentId, { b: 3, c: 4 }, false)
      
      const currentState = stateBridge.getState(identity.componentId)
      expect(currentState).toEqual({ a: 1, b: 3, c: 4 })
      
      // Cleanup
      await cleanupManager.cleanupComponent(identity.componentId)
    })
  })

  describe('Event System Integration', () => {
    it('should handle event communication between components', async () => {
      const identity1 = isolationManager.createInstance('Emitter', {}, 'client-123')
      const identity2 = isolationManager.createInstance('Listener', {}, 'client-123')
      
      // Setup listener
      const receivedEvents: any[] = []
      const unsubscribe = eventSystem.on(identity2.componentId, 'message', (event) => {
        receivedEvents.push(event)
      })
      
      // Emit events
      await eventSystem.emit(identity1.componentId, 'message', { text: 'Hello!' }, {
        scope: 'global'
      })
      
      // Process events (simulate async processing)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(receivedEvents).toHaveLength(1)
      expect(receivedEvents[0].payload.text).toBe('Hello!')
      
      // Cleanup
      unsubscribe()
      await cleanupManager.cleanupComponent(identity1.componentId)
      await cleanupManager.cleanupComponent(identity2.componentId)
    })

    it('should handle event scoping correctly', async () => {
      const parent = isolationManager.createInstance('Parent', {}, 'client-123')
      const child1 = isolationManager.createInstance('Child1', {}, 'client-123', parent.componentId)
      const child2 = isolationManager.createInstance('Child2', {}, 'client-123', parent.componentId)
      
      const child1Events: any[] = []
      const child2Events: any[] = []
      
      // Subscribe to events
      const unsub1 = eventSystem.on(child1.componentId, 'parent-message', (event) => {
        child1Events.push(event)
      })
      
      const unsub2 = eventSystem.on(child2.componentId, 'parent-message', (event) => {
        child2Events.push(event)
      })
      
      // Emit to children
      await eventSystem.emit(parent.componentId, 'parent-message', { from: 'parent' }, {
        scope: 'children'
      })
      
      // Process events
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(child1Events).toHaveLength(1)
      expect(child2Events).toHaveLength(1)
      
      // Cleanup
      unsub1()
      unsub2()
      await cleanupManager.cleanupComponent(parent.componentId)
      await cleanupManager.cleanupComponent(child1.componentId)
      await cleanupManager.cleanupComponent(child2.componentId)
    })
  })

  describe('WebSocket Manager Integration', () => {
    it('should handle message queuing when disconnected', async () => {
      // Ensure disconnected
      wsManager.disconnect()
      
      // Send messages while disconnected
      await wsManager.send({
        type: 'test_message',
        componentId: 'test',
        payload: { data: 'queued' }
      })
      
      const stats = wsManager.getStats()
      expect(stats.queueSize).toBeGreaterThan(0)
      
      // Cleanup
      wsManager.shutdown()
    })

    it('should provide connection status', () => {
      expect(wsManager.isConnected()).toBe(false)
      expect(wsManager.getConnectionState()).toBe('disconnected')
      
      const stats = wsManager.getStats()
      expect(stats.connectionState).toBe('disconnected')
      expect(stats.messagesSent).toBe(0)
      expect(stats.messagesReceived).toBe(0)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle state update errors gracefully', async () => {
      const identity = isolationManager.createInstance('ErrorComponent', {}, 'client-123')
      
      // Mock error in state update
      const originalLogger = stateBridge['logger']
      const errorLogger = { ...originalLogger, error: vi.fn() }
      stateBridge['logger'] = errorLogger
      
      // This should not throw but log error
      await stateBridge.updateState(identity.componentId, 'set', 'invalid.path.that.might.fail', 'value', true)
      
      // Restore logger
      stateBridge['logger'] = originalLogger
      
      // Cleanup
      await cleanupManager.cleanupComponent(identity.componentId)
    })

    it('should handle event processing errors gracefully', async () => {
      const identity = isolationManager.createInstance('ErrorEmitter', {}, 'client-123')
      
      // Add failing listener
      const failingListener = vi.fn(() => {
        throw new Error('Listener failed')
      })
      
      const unsubscribe = eventSystem.on(identity.componentId, 'error-event', failingListener)
      
      // Emit event - should not throw
      await expect(eventSystem.emit(identity.componentId, 'error-event', {})).resolves.not.toThrow()
      
      // Process events
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(failingListener).toHaveBeenCalled()
      
      // Cleanup
      unsubscribe()
      await cleanupManager.cleanupComponent(identity.componentId)
    })
  })

  describe('Performance and Metrics', () => {
    it('should track cleanup statistics', async () => {
      const identity = isolationManager.createInstance('PerfComponent', {}, 'client-123')
      cleanupManager.registerComponent(identity.componentId)
      
      await cleanupManager.cleanupComponent(identity.componentId)
      
      const stats = cleanupManager.getCleanupStats()
      expect(stats.totalCleanups).toBe(1)
      expect(stats.avgCleanupTime).toBeGreaterThan(0)
    })

    it('should track event metrics', async () => {
      const identity = isolationManager.createInstance('MetricsComponent', {}, 'client-123')
      
      await eventSystem.emit(identity.componentId, 'metric-event', {})
      
      // Process events
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const metrics = eventSystem.getMetrics()
      expect(metrics.totalEvents).toBeGreaterThan(0)
      
      // Cleanup
      await cleanupManager.cleanupComponent(identity.componentId)
    })

    it('should provide WebSocket statistics', () => {
      const stats = wsManager.getStats()
      
      expect(typeof stats.messagesSent).toBe('number')
      expect(typeof stats.messagesReceived).toBe('number')
      expect(typeof stats.failedMessages).toBe('number')
      expect(typeof stats.queueSize).toBe('number')
      expect(stats.connectionState).toBe('disconnected')
    })
  })

  describe('System Integration Validation', () => {
    it('should verify all Phase 2 systems work together', async () => {
      // Create a component
      const identity = isolationManager.createInstance('IntegrationTest', { value: 'initial' }, 'client-123')
      
      // Register with all systems
      cleanupManager.registerComponent(identity.componentId)
      
      // Setup state tracking
      const stateChanges: any[] = []
      const stateUnsubscribe = stateBridge.onStateChange((change) => {
        stateChanges.push(change)
      })
      
      // Setup event tracking
      const events: any[] = []
      const eventUnsubscribe = eventSystem.on(identity.componentId, 'integration-event', (event) => {
        events.push(event)
      })
      
      // Update state
      await stateBridge.setState(identity.componentId, { value: 'updated' }, false)
      
      // Emit event
      await eventSystem.emit(identity.componentId, 'integration-event', { message: 'test' })
      
      // Process async operations
      await new Promise(resolve => setTimeout(resolve, 20))
      
      // Verify state was updated
      const finalState = stateBridge.getState(identity.componentId)
      expect(finalState.value).toBe('updated')
      
      // Verify state change was tracked
      expect(stateChanges.length).toBeGreaterThan(0)
      
      // Verify event was processed
      expect(events.length).toBeGreaterThan(0)
      expect(events[0].payload.message).toBe('test')
      
      // Verify all systems have metrics
      const cleanupStats = cleanupManager.getCleanupStats()
      const eventMetrics = eventSystem.getMetrics()
      const wsStats = wsManager.getStats()
      
      expect(cleanupStats).toBeDefined()
      expect(eventMetrics).toBeDefined()
      expect(wsStats).toBeDefined()
      
      // Final cleanup
      stateUnsubscribe()
      eventUnsubscribe()
      await cleanupManager.cleanupComponent(identity.componentId)
      
      // Verify component was cleaned up
      expect(isolationManager.getInstance(identity.componentId)).toBeUndefined()
    })
  })
})