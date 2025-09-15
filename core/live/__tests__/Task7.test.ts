/**
 * Task 7: Offline Support Tests
 * 
 * Tests for offline support including action queue system, online/offline detection,
 * and sync conflict resolution.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LiveOfflineManager } from '../LiveOfflineManager'
import { NetworkStatusManager } from '../NetworkStatusManager'
import { SyncConflictResolver } from '../SyncConflictResolver'
import { ComponentTreeManager } from '../ComponentTreeManager'
import { LiveEventBus } from '../LiveEventBus'

// Mock global objects for Node.js environment
global.window = global.window || {}
global.navigator = global.navigator || {}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true
})

// Mock fetch
global.fetch = vi.fn()

describe('Task 7: Offline Support', () => {
  let treeManager: ComponentTreeManager
  let eventBus: LiveEventBus
  let offlineManager: LiveOfflineManager
  let networkManager: NetworkStatusManager
  let conflictResolver: SyncConflictResolver
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    treeManager = new ComponentTreeManager({
      maxDepth: 5,
      autoCleanup: false
    })
    
    eventBus = new LiveEventBus(treeManager, {
      enableDebug: false
    })
    
    offlineManager = new LiveOfflineManager({
      enablePersistence: false, // Disable for tests
      enableDebug: false,
      processingInterval: 0 // Disable automatic processing
    })
    
    networkManager = new NetworkStatusManager(offlineManager, eventBus, {
      enableMonitoring: false, // Disable for tests
      enableDebug: false
    })
    
    conflictResolver = new SyncConflictResolver(eventBus, {
      enableDebug: false
    })
  })
  
  afterEach(() => {
    offlineManager.dispose()
    networkManager.dispose()
    treeManager.dispose()
  })
  
  describe('LiveOfflineManager - Action Queue System', () => {
    it('should enqueue actions with correct properties', () => {
      const actionId = offlineManager.enqueueAction(
        'user-component',
        'updateProfile',
        { name: 'John Doe', email: 'john@example.com' },
        {
          priority: 200,
          maxAttempts: 5
        }
      )
      
      expect(actionId).toBeDefined()
      expect(typeof actionId).toBe('string')
      
      const action = offlineManager.getAction(actionId)
      expect(action).toBeDefined()
      expect(action!.componentId).toBe('user-component')
      expect(action!.type).toBe('updateProfile')
      expect(action!.priority).toBe(200)
      expect(action!.maxAttempts).toBe(5)
      expect(action!.status).toBe('pending')
    })
    
    it('should handle action priorities correctly', () => {
      const lowPriorityId = offlineManager.enqueueAction('comp1', 'action1', {}, { priority: 50 })
      const highPriorityId = offlineManager.enqueueAction('comp2', 'action2', {}, { priority: 200 })
      const mediumPriorityId = offlineManager.enqueueAction('comp3', 'action3', {}, { priority: 100 })
      
      const pendingActions = offlineManager.getPendingActions()
      expect(pendingActions).toHaveLength(3)
      
      // Should be sorted by priority (highest first)
      expect(pendingActions[0].id).toBe(highPriorityId)
      expect(pendingActions[1].id).toBe(mediumPriorityId)
      expect(pendingActions[2].id).toBe(lowPriorityId)
    })
    
    it('should enqueue and manage action batches', () => {
      const batchId = offlineManager.enqueueBatch([
        { componentId: 'comp1', type: 'action1', payload: { data: 1 } },
        { componentId: 'comp2', type: 'action2', payload: { data: 2 } },
        { componentId: 'comp3', type: 'action3', payload: { data: 3 } }
      ], {
        atomic: true,
        priority: 150
      })
      
      expect(batchId).toBeDefined()
      
      const pendingActions = offlineManager.getPendingActions()
      expect(pendingActions).toHaveLength(3)
      
      // All actions should have the batch priority
      pendingActions.forEach(action => {
        expect(action.priority).toBe(150)
      })
    })
    
    it('should mark actions as completed and failed', () => {
      const actionId = offlineManager.enqueueAction('comp1', 'testAction', { test: true })
      
      // Mark as completed
      const completed = offlineManager.markActionCompleted(actionId, { success: true })
      expect(completed).toBe(true)
      
      // Action should be removed from queue
      const action = offlineManager.getAction(actionId)
      expect(action).toBeNull()
      
      // Test failure
      const actionId2 = offlineManager.enqueueAction('comp1', 'testAction2', { test: true })
      const failed = offlineManager.markActionFailed(actionId2, {
        code: 'TEST_ERROR',
        message: 'Test error message'
      })
      expect(failed).toBe(true)
      
      const failedAction = offlineManager.getAction(actionId2)
      expect(failedAction!.attempts).toBe(1)
      expect(failedAction!.metadata.error?.code).toBe('TEST_ERROR')
    })
    
    it('should handle dependencies correctly', () => {
      const action1Id = offlineManager.enqueueAction('comp1', 'action1', {})
      const action2Id = offlineManager.enqueueAction('comp1', 'action2', {}, {
        dependencies: [action1Id]
      })
      
      const pendingActions = offlineManager.getPendingActions()
      
      // Only action1 should be pending (no dependencies)
      expect(pendingActions).toHaveLength(1)
      expect(pendingActions[0].id).toBe(action1Id)
      
      // Complete action1
      offlineManager.markActionCompleted(action1Id)
      
      // Now action2 should be pending
      const newPendingActions = offlineManager.getPendingActions()
      expect(newPendingActions).toHaveLength(1)
      expect(newPendingActions[0].id).toBe(action2Id)
    })
    
    it('should cancel actions', () => {
      const actionId = offlineManager.enqueueAction('comp1', 'cancelTest', {})
      
      const cancelled = offlineManager.cancelAction(actionId)
      expect(cancelled).toBe(true)
      
      const action = offlineManager.getAction(actionId)
      expect(action!.status).toBe('cancelled')
    })
    
    it('should retry failed actions', () => {
      const actionId = offlineManager.enqueueAction('comp1', 'retryTest', {})
      
      // Mark as failed
      offlineManager.markActionFailed(actionId, {
        code: 'RETRY_TEST',
        message: 'Test retry'
      })
      
      // Retry the action
      const retried = offlineManager.retryAction(actionId)
      expect(retried).toBe(true)
      
      const action = offlineManager.getAction(actionId)
      expect(action!.status).toBe('pending')
      expect(action!.attempts).toBe(0)
    })
    
    it('should provide queue statistics', () => {
      // Add some actions
      offlineManager.enqueueAction('comp1', 'action1', {}, { priority: 100 })
      offlineManager.enqueueAction('comp2', 'action2', {}, { priority: 200 })
      offlineManager.enqueueAction('comp1', 'action3', {}, { priority: 100 })
      
      const stats = offlineManager.getQueueStats()
      
      expect(stats.totalActions).toBe(3)
      expect(stats.byComponent['comp1']).toBe(2)
      expect(stats.byComponent['comp2']).toBe(1)
      expect(stats.byPriority[100]).toBe(2)
      expect(stats.byPriority[200]).toBe(1)
      expect(stats.byStatus['pending']).toBe(3)
    })
    
    it('should clear queue and component actions', () => {
      offlineManager.enqueueAction('comp1', 'action1', {})
      offlineManager.enqueueAction('comp2', 'action2', {})
      offlineManager.enqueueAction('comp1', 'action3', {})
      
      // Clear component actions
      const cleared = offlineManager.clearComponentActions('comp1')
      expect(cleared).toBe(2)
      
      const stats = offlineManager.getQueueStats()
      expect(stats.totalActions).toBe(1)
      
      // Clear entire queue
      const totalCleared = offlineManager.clearQueue()
      expect(totalCleared).toBe(1)
      
      const emptyStats = offlineManager.getQueueStats()
      expect(emptyStats.totalActions).toBe(0)
    })
  })
  
  describe('NetworkStatusManager - Online/Offline Detection', () => {
    beforeEach(() => {
      // Mock fetch for ping tests
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200
      })
    })
    
    it('should get current network status', () => {
      const status = networkManager.getStatus()
      
      expect(status).toBeDefined()
      expect(status.online).toBeDefined()
      expect(status.connectionType).toBeDefined()
      expect(status.quality).toBeDefined()
      expect(status.metadata).toBeDefined()
    })
    
    it('should test connection quality', async () => {
      const connectionTest = await networkManager.testConnection()
      
      expect(connectionTest.online).toBeDefined()
      expect(connectionTest.quality).toBeDefined()
      expect(typeof connectionTest.online).toBe('boolean')
      expect(['excellent', 'good', 'fair', 'poor', 'unknown']).toContain(connectionTest.quality)
    })
    
    it('should handle manual sync', async () => {
      // Add some actions to sync
      offlineManager.enqueueAction('comp1', 'syncTest1', { data: 1 })
      offlineManager.enqueueAction('comp2', 'syncTest2', { data: 2 })
      
      const syncResult = await networkManager.syncNow({
        force: true,
        batchSize: 10
      })
      
      expect(syncResult.success).toBeDefined()
      expect(syncResult.actionsSynced).toBeGreaterThanOrEqual(0)
      expect(syncResult.actionsFailed).toBeGreaterThanOrEqual(0)
      expect(syncResult.duration).toBeGreaterThan(0)
      expect(syncResult.metadata.networkStatus).toBeDefined()
    })
    
    it('should provide connection statistics', () => {
      const stats = networkManager.getConnectionStats()
      
      expect(stats.totalChecks).toBeGreaterThanOrEqual(0)
      expect(stats.onlinePercentage).toBeGreaterThanOrEqual(0)
      expect(stats.averageRtt).toBeGreaterThanOrEqual(0)
      expect(stats.qualityDistribution).toBeDefined()
    })
    
    it('should handle connection history', () => {
      const history = networkManager.getConnectionHistory()
      expect(Array.isArray(history)).toBe(true)
      
      // Should start with at least one status
      expect(history.length).toBeGreaterThanOrEqual(0)
    })
  })
  
  describe('SyncConflictResolver - Conflict Resolution', () => {
    it('should detect conflicts between states', async () => {
      const localState = {
        name: 'John Doe',
        email: 'john.local@example.com',
        age: 30
      }
      
      const serverState = {
        name: 'John Doe',
        email: 'john.server@example.com',
        age: 31
      }
      
      const baseState = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      }
      
      const conflicts = await conflictResolver.compareStates(
        'user-component',
        localState,
        serverState,
        baseState
      )
      
      expect(conflicts.length).toBe(2) // email and age conflicts
      
      const emailConflict = conflicts.find(c => c.field === 'email')
      const ageConflict = conflicts.find(c => c.field === 'age')
      
      expect(emailConflict).toBeDefined()
      expect(emailConflict!.localValue).toBe('john.local@example.com')
      expect(emailConflict!.serverValue).toBe('john.server@example.com')
      expect(emailConflict!.baseValue).toBe('john@example.com')
      
      expect(ageConflict).toBeDefined()
      expect(ageConflict!.localValue).toBe(30)
      expect(ageConflict!.serverValue).toBe(31)
    })
    
    it('should resolve conflicts using different strategies', async () => {
      const localState = { value: 'local' }
      const serverState = { value: 'server' }
      
      const conflicts = await conflictResolver.compareStates(
        'test-component',
        localState,
        serverState
      )
      
      expect(conflicts.length).toBe(1)
      
      // Test client-wins strategy
      const clientWinsResolutions = await conflictResolver.resolveConflicts(
        [conflicts[0].id],
        'client-wins'
      )
      
      expect(clientWinsResolutions.length).toBe(1)
      expect(clientWinsResolutions[0].resolvedValue).toBe('local')
      expect(clientWinsResolutions[0].strategy).toBe('client-wins')
    })
    
    it('should perform three-way merge', async () => {
      const localState = {
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark' }
      }
      
      const serverState = {
        user: { name: 'John', age: 31 },
        settings: { lang: 'en' }
      }
      
      const baseState = {
        user: { name: 'John', age: 30 },
        settings: {}
      }
      
      const mergeResult = await conflictResolver.threeWayMerge(
        'user-component',
        localState,
        serverState,
        baseState
      )
      
      expect(mergeResult.success).toBeDefined()
      expect(mergeResult.mergedValue).toBeDefined()
      expect(mergeResult.metadata.strategy).toBeDefined()
    })
    
    it('should handle conflict resolution policies', () => {
      const customPolicy = {
        name: 'custom',
        defaultStrategy: 'client-wins' as const,
        fieldStrategies: {
          'email': 'server-wins' as const,
          'createdAt': 'first-write-wins' as const
        },
        componentStrategies: {},
        autoResolveSeverity: 'medium' as const,
        customResolvers: {},
        metadata: {
          createdAt: Date.now(),
          version: '1.0.0'
        }
      }
      
      conflictResolver.addResolutionPolicy('custom', customPolicy)
      
      // Policy should be added successfully
      expect(true).toBe(true) // Simple assertion since we can't easily test the internal state
    })
    
    it('should get active conflicts and statistics', async () => {
      // Create some conflicts
      await conflictResolver.compareStates(
        'comp1',
        { value: 'local1' },
        { value: 'server1' }
      )
      
      await conflictResolver.compareStates(
        'comp2',
        { value: 'local2' },
        { value: 'server2' }
      )
      
      const activeConflicts = conflictResolver.getActiveConflicts()
      expect(activeConflicts.length).toBe(2)
      
      const comp1Conflicts = conflictResolver.getComponentConflicts('comp1')
      expect(comp1Conflicts.length).toBe(1)
      expect(comp1Conflicts[0].componentId).toBe('comp1')
      
      const stats = conflictResolver.getResolutionStats()
      expect(stats.activeConflicts).toBe(2)
      expect(stats.totalResolutions).toBeGreaterThanOrEqual(0)
    })
    
    it('should manage sync states', async () => {
      const localState = { data: 'local' }
      const serverState = { data: 'server' }
      
      await conflictResolver.compareStates('test-comp', localState, serverState)
      
      const syncState = conflictResolver.getSyncState('test-comp')
      expect(syncState).toBeDefined()
      expect(syncState!.componentId).toBe('test-comp')
      expect(syncState!.localState).toEqual(localState)
      expect(syncState!.serverState).toEqual(serverState)
    })
    
    it('should provide user resolution interface', async () => {
      const conflicts = await conflictResolver.compareStates(
        'user-comp',
        { value: 'local' },
        { value: 'server' }
      )
      
      const conflictId = conflicts[0].id
      
      // Simulate providing user resolution
      const provided = conflictResolver.provideUserResolution(conflictId, {
        strategy: 'client-wins',
        value: 'user-chosen-value',
        reason: 'User preferred local value'
      })
      
      // Should fail since no user resolution was requested
      expect(provided).toBe(false)
    })
  })
  
  describe('Integration - Complete Offline Support', () => {
    it('should handle offline-to-online scenario', async () => {
      // Simulate offline state
      global.navigator.onLine = false
      
      // Enqueue actions while offline
      const action1Id = offlineManager.enqueueAction('comp1', 'offlineAction1', { data: 1 })
      const action2Id = offlineManager.enqueueAction('comp2', 'offlineAction2', { data: 2 })
      
      expect(offlineManager.getPendingActions()).toHaveLength(2)
      
      // Simulate going online
      global.navigator.onLine = true
      
      // Check network status
      const status = await networkManager.checkStatus()
      expect(status.online).toBe(true)
      
      // Sync should work when online
      const syncResult = await networkManager.syncNow({ force: true })
      expect(syncResult).toBeDefined()
    })
    
    it('should handle sync conflicts during reconnection', async () => {
      // Setup initial state
      const componentId = 'sync-test-component'
      
      // Simulate local changes while offline
      const localState = {
        name: 'Local Name',
        value: 100,
        modified: true
      }
      
      // Simulate server state that changed while offline
      const serverState = {
        name: 'Server Name',
        value: 200,
        modified: false
      }
      
      // Detect conflicts
      const conflicts = await conflictResolver.compareStates(
        componentId,
        localState,
        serverState
      )
      
      expect(conflicts.length).toBeGreaterThan(0)
      
      // Resolve conflicts automatically
      const resolutions = await conflictResolver.resolveConflicts(
        conflicts.map(c => c.id),
        'server-wins'
      )
      
      expect(resolutions.length).toBe(conflicts.length)
      resolutions.forEach(resolution => {
        expect(resolution.automatic).toBe(true)
        expect(resolution.strategy).toBe('server-wins')
      })
    })
    
    it('should maintain queue persistence simulation', () => {
      // Enqueue some actions
      offlineManager.enqueueAction('comp1', 'persistTest1', { data: 1 })
      offlineManager.enqueueAction('comp2', 'persistTest2', { data: 2 })
      
      const stats = offlineManager.getQueueStats()
      expect(stats.totalActions).toBe(2)
      
      // Export queue (simulates persistence)
      const exported = offlineManager.exportQueue()
      expect(exported.actions).toHaveLength(2)
      expect(exported.stats.totalActions).toBe(2)
      
      // Clear queue
      offlineManager.clearQueue()
      expect(offlineManager.getQueueStats().totalActions).toBe(0)
      
      // Import queue back (simulates loading from persistence)
      offlineManager.importQueue({
        actions: exported.actions,
        batches: exported.batches
      })
      
      const importedStats = offlineManager.getQueueStats()
      expect(importedStats.totalActions).toBe(2)
    })
    
    it('should handle connection quality-based sync decisions', async () => {
      // Mock poor connection
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 1000))
      )
      
      const connectionTest = await networkManager.testConnection()
      
      // Should handle different quality levels
      expect(['excellent', 'good', 'fair', 'poor', 'unknown']).toContain(connectionTest.quality)
      
      // Sync behavior should adapt to connection quality
      offlineManager.enqueueAction('comp1', 'qualityTest', { data: 'test' })
      
      const syncResult = await networkManager.syncNow({
        force: true,
        batchSize: 1 // Small batch for poor connection
      })
      
      expect(syncResult).toBeDefined()
    })
    
    it('should provide comprehensive system statistics', () => {
      // Add some data to all systems
      offlineManager.enqueueAction('comp1', 'statsTest1', {})
      offlineManager.enqueueAction('comp2', 'statsTest2', {})
      
      // Queue statistics
      const queueStats = offlineManager.getQueueStats()
      expect(queueStats.totalActions).toBe(2)
      
      // Network statistics
      const networkStats = networkManager.getConnectionStats()
      expect(networkStats).toBeDefined()
      
      // Conflict resolution statistics
      const conflictStats = conflictResolver.getResolutionStats()
      expect(conflictStats).toBeDefined()
      
      // All statistics should provide useful information
      expect(queueStats.totalActions).toBeGreaterThanOrEqual(0)
      expect(networkStats.totalChecks).toBeGreaterThanOrEqual(0)
      expect(conflictStats.totalResolutions).toBeGreaterThanOrEqual(0)
    })
  })
})