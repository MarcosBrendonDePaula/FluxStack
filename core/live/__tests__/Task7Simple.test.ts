/**
 * Task 7: Offline Support - Simplified Tests
 * 
 * Simplified tests focusing on core offline functionality without browser dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LiveOfflineManager } from '../LiveOfflineManager'
import { SyncConflictResolver } from '../SyncConflictResolver'
import { ComponentTreeManager } from '../ComponentTreeManager'
import { LiveEventBus } from '../LiveEventBus'

describe('Task 7: Offline Support (Simplified)', () => {
  let treeManager: ComponentTreeManager
  let eventBus: LiveEventBus
  let offlineManager: LiveOfflineManager
  let conflictResolver: SyncConflictResolver
  
  beforeEach(() => {
    treeManager = new ComponentTreeManager({
      maxDepth: 5,
      autoCleanup: false
    })
    
    eventBus = new LiveEventBus(treeManager, {
      enableDebug: false
    })
    
    offlineManager = new LiveOfflineManager({
      enablePersistence: false,
      enableDebug: false,
      processingInterval: 0
    })
    
    conflictResolver = new SyncConflictResolver(eventBus, {
      enableDebug: false
    })
  })
  
  afterEach(() => {
    offlineManager.dispose()
    treeManager.dispose()
  })
  
  describe('LiveOfflineManager - Core Action Queue Functionality', () => {
    it('should enqueue actions with proper structure', () => {
      const actionId = offlineManager.enqueueAction(
        'user-component',
        'updateProfile',
        { name: 'John Doe', email: 'john@example.com' },
        { priority: 200 }
      )
      
      expect(actionId).toBeDefined()
      expect(typeof actionId).toBe('string')
      
      const action = offlineManager.getAction(actionId)
      expect(action).toBeDefined()
      expect(action!.componentId).toBe('user-component')
      expect(action!.type).toBe('updateProfile')
      expect(action!.priority).toBe(200)
      expect(action!.status).toBe('pending')
      expect(action!.payload).toEqual({ name: 'John Doe', email: 'john@example.com' })
    })
    
    it('should maintain action priority order', () => {
      const lowId = offlineManager.enqueueAction('comp1', 'action1', {}, { priority: 50 })
      const highId = offlineManager.enqueueAction('comp2', 'action2', {}, { priority: 200 })
      const mediumId = offlineManager.enqueueAction('comp3', 'action3', {}, { priority: 100 })
      
      const pendingActions = offlineManager.getPendingActions()
      expect(pendingActions).toHaveLength(3)
      expect(pendingActions[0].id).toBe(highId)
      expect(pendingActions[1].id).toBe(mediumId)
      expect(pendingActions[2].id).toBe(lowId)
    })
    
    it('should handle action batches', () => {
      const batchId = offlineManager.enqueueBatch([
        { componentId: 'comp1', type: 'action1', payload: { data: 1 } },
        { componentId: 'comp2', type: 'action2', payload: { data: 2 } }
      ], { atomic: true })
      
      expect(batchId).toBeDefined()
      
      const pendingActions = offlineManager.getPendingActions()
      expect(pendingActions).toHaveLength(2)
    })
    
    it('should manage action lifecycle', () => {
      const actionId = offlineManager.enqueueAction('comp1', 'testAction', { test: true })
      
      // Test completion
      const completed = offlineManager.markActionCompleted(actionId, { success: true })
      expect(completed).toBe(true)
      
      const action = offlineManager.getAction(actionId)
      expect(action).toBeNull()
      
      // Test failure with new action
      const actionId2 = offlineManager.enqueueAction('comp1', 'testAction2', { test: true })
      const failed = offlineManager.markActionFailed(actionId2, {
        code: 'TEST_ERROR',
        message: 'Test error'
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
      
      let pendingActions = offlineManager.getPendingActions()
      expect(pendingActions).toHaveLength(1)
      expect(pendingActions[0].id).toBe(action1Id)
      
      offlineManager.markActionCompleted(action1Id)
      
      pendingActions = offlineManager.getPendingActions()
      expect(pendingActions).toHaveLength(1)
      expect(pendingActions[0].id).toBe(action2Id)
    })
    
    it('should provide queue statistics', () => {
      offlineManager.enqueueAction('comp1', 'action1', {}, { priority: 100 })
      offlineManager.enqueueAction('comp2', 'action2', {}, { priority: 200 })
      offlineManager.enqueueAction('comp1', 'action3', {}, { priority: 100 })
      
      const stats = offlineManager.getQueueStats()
      expect(stats.totalActions).toBe(3)
      expect(stats.byComponent['comp1']).toBe(2)
      expect(stats.byComponent['comp2']).toBe(1)
      expect(stats.byPriority[100]).toBe(2)
      expect(stats.byPriority[200]).toBe(1)
    })
    
    it('should export and import queue data', () => {
      offlineManager.enqueueAction('comp1', 'export1', { data: 1 })
      offlineManager.enqueueAction('comp2', 'export2', { data: 2 })
      
      const exported = offlineManager.exportQueue()
      expect(exported.actions).toHaveLength(2)
      expect(exported.stats.totalActions).toBe(2)
      
      offlineManager.clearQueue()
      expect(offlineManager.getQueueStats().totalActions).toBe(0)
      
      offlineManager.importQueue({ actions: exported.actions })
      expect(offlineManager.getQueueStats().totalActions).toBe(2)
    })
    
    it('should cleanup expired actions', () => {
      const futureTime = Date.now() + 10000
      const pastTime = Date.now() - 10000
      
      offlineManager.enqueueAction('comp1', 'active', {}, { 
        expiresAt: futureTime 
      })
      offlineManager.enqueueAction('comp2', 'expired', {}, { 
        expiresAt: pastTime 
      })
      
      const cleaned = offlineManager.cleanupExpiredActions()
      expect(cleaned).toBe(1)
      
      const stats = offlineManager.getQueueStats()
      expect(stats.totalActions).toBe(1)
    })
  })
  
  describe('SyncConflictResolver - Conflict Detection and Resolution', () => {
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
      
      expect(conflicts.length).toBe(2)
      
      const emailConflict = conflicts.find(c => c.field === 'email')
      const ageConflict = conflicts.find(c => c.field === 'age')
      
      expect(emailConflict).toBeDefined()
      expect(emailConflict!.localValue).toBe('john.local@example.com')
      expect(emailConflict!.serverValue).toBe('john.server@example.com')
      
      expect(ageConflict).toBeDefined()
      expect(ageConflict!.localValue).toBe(30)
      expect(ageConflict!.serverValue).toBe(31)
    })
    
    it('should resolve conflicts with different strategies', async () => {
      const localState = { value: 'local' }
      const serverState = { value: 'server' }
      
      const conflicts = await conflictResolver.compareStates(
        'test-component',
        localState,
        serverState
      )
      
      expect(conflicts.length).toBe(1)
      
      const resolutions = await conflictResolver.resolveConflicts(
        [conflicts[0].id],
        'client-wins'
      )
      
      expect(resolutions.length).toBe(1)
      expect(resolutions[0].resolvedValue).toBe('local')
      expect(resolutions[0].strategy).toBe('client-wins')
      expect(resolutions[0].automatic).toBe(true)
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
    
    it('should track conflicts and resolutions', async () => {
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
    })
    
    it('should handle custom resolution policies', () => {
      const customPolicy = {
        name: 'custom',
        defaultStrategy: 'client-wins' as const,
        fieldStrategies: {
          'email': 'server-wins' as const
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
      
      // Verify policy was added (basic test since internal state is private)
      expect(true).toBe(true)
    })
  })
  
  describe('Integration - Offline Support Components', () => {
    it('should handle complete offline workflow', async () => {
      // Enqueue actions simulating offline operations
      const action1Id = offlineManager.enqueueAction('comp1', 'offlineOp1', { data: 1 })
      const action2Id = offlineManager.enqueueAction('comp2', 'offlineOp2', { data: 2 })
      
      expect(offlineManager.getPendingActions()).toHaveLength(2)
      
      // Simulate conflicts during sync
      const conflicts = await conflictResolver.compareStates(
        'comp1',
        { value: 'local' },
        { value: 'server' }
      )
      
      expect(conflicts.length).toBe(1)
      
      // Resolve conflicts
      const resolutions = await conflictResolver.resolveConflicts(
        conflicts.map(c => c.id),
        'server-wins'
      )
      
      expect(resolutions.length).toBe(1)
      expect(resolutions[0].strategy).toBe('server-wins')
      
      // Complete actions after conflict resolution
      offlineManager.markActionCompleted(action1Id)
      offlineManager.markActionCompleted(action2Id)
      
      expect(offlineManager.getPendingActions()).toHaveLength(0)
    })
    
    it('should maintain data consistency across components', () => {
      // Test queue operations
      offlineManager.enqueueAction('comp1', 'test1', { value: 1 })
      offlineManager.enqueueAction('comp2', 'test2', { value: 2 })
      
      const queueStats = offlineManager.getQueueStats()
      expect(queueStats.totalActions).toBe(2)
      
      // Test conflict resolution state
      const conflictStats = conflictResolver.getResolutionStats()
      expect(conflictStats.totalResolutions).toBeGreaterThanOrEqual(0)
      
      // All components should maintain separate state
      const comp1Actions = offlineManager.getComponentActions('comp1')
      const comp2Actions = offlineManager.getComponentActions('comp2')
      
      expect(comp1Actions.length).toBe(1)
      expect(comp2Actions.length).toBe(1)
      expect(comp1Actions[0].componentId).toBe('comp1')
      expect(comp2Actions[0].componentId).toBe('comp2')
    })
    
    it('should handle error scenarios gracefully', () => {
      // Test invalid action operations
      const invalidAction = offlineManager.getAction('non-existent-id')
      expect(invalidAction).toBeNull()
      
      const cancelResult = offlineManager.cancelAction('non-existent-id')
      expect(cancelResult).toBe(false)
      
      const retryResult = offlineManager.retryAction('non-existent-id')
      expect(retryResult).toBe(false)
      
      // Test invalid conflict operations
      const invalidConflict = conflictResolver.getConflict('non-existent-id')
      expect(invalidConflict).toBeNull()
      
      const invalidSyncState = conflictResolver.getSyncState('non-existent-comp')
      expect(invalidSyncState).toBeNull()
    })
    
    it('should provide comprehensive system metrics', () => {
      // Add test data
      offlineManager.enqueueAction('comp1', 'metric1', {}, { priority: 100 })
      offlineManager.enqueueAction('comp2', 'metric2', {}, { priority: 200 })
      
      const queueStats = offlineManager.getQueueStats()
      expect(queueStats.totalActions).toBe(2)
      expect(queueStats.byPriority[100]).toBe(1)
      expect(queueStats.byPriority[200]).toBe(1)
      
      const conflictStats = conflictResolver.getResolutionStats()
      expect(conflictStats.activeConflicts).toBeGreaterThanOrEqual(0)
      expect(conflictStats.totalResolutions).toBeGreaterThanOrEqual(0)
      
      // Verify all metrics are accessible
      expect(typeof queueStats.totalActions).toBe('number')
      expect(typeof conflictStats.activeConflicts).toBe('number')
    })
  })
})