/**
 * Task 4: Zustand Integration - Integration Tests
 * 
 * Comprehensive test suite for Zustand integration features including:
 * - LiveComponentsSlice functionality
 * - Enhanced hooks with global state
 * - State conflict resolution
 * - Global state debugging tools
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { create } from 'zustand'
import { createLiveComponentsSlice } from '../zustand/LiveComponentsSlice'
import { StateConflictResolver } from '../StateConflictResolver'
import { GlobalStateDebugger } from '../GlobalStateDebugger'
import type { 
  LiveComponentsSlice,
  ComponentStateEntry,
  ConflictStrategy,
  StateConflict
} from '../index'

// Mock environment variables for testing
if (typeof process === 'undefined') {
  globalThis.process = { env: { NODE_ENV: 'test' } } as any
}

// Mock localStorage for testing
if (typeof localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(() => null)
  } as any
}

describe('Task 4: Zustand Integration', () => {
  let store: ReturnType<typeof create<LiveComponentsSlice>>
  let conflictResolver: StateConflictResolver
  let stateDebugger: GlobalStateDebugger
  
  beforeEach(() => {
    // Create store with slice
    store = create<LiveComponentsSlice>()(createLiveComponentsSlice)
    
    // Create conflict resolver
    conflictResolver = new StateConflictResolver({
      detection: {
        enabled: true,
        monitorKeys: [],
        ignoreKeys: ['__internal'],
        conflictThreshold: 100,
        deepComparison: true,
        strictTypeComparison: false
      },
      enableAutoResolution: false // Disable for testing
    })
    
    // Create debugger
    stateDebugger = new GlobalStateDebugger({
      enabled: true,
      logLevels: ['debug', 'info', 'warn', 'error'],
      maxLogEntries: 1000,
      autoSnapshot: false
    })
    stateDebugger.initialize(() => store.getState())
    
    // Clear any existing logs from initialization
    stateDebugger.clearDebugData(['logs'])
  })
  
  afterEach(() => {
    conflictResolver.shutdown()
    stateDebugger.shutdown()
  })
  
  describe('LiveComponentsSlice', () => {
    it('should register and manage components', () => {
      const state = store.getState()
      
      // Register component
      state.registerComponent(
        'test-component-1',
        'TestComponent',
        { count: 0, name: 'test' },
        { isActive: true, props: { id: 1 } }
      )
      
      // Check component registration
      expect(state.components.has('test-component-1')).toBe(true)
      const component = state.components.get('test-component-1')
      expect(component).toBeDefined()
      expect(component!.type).toBe('TestComponent')
      expect(component!.state).toEqual({ count: 0, name: 'test' })
      expect(component!.metadata.isActive).toBe(true)
      
      // Check metrics update
      expect(state.metrics.totalComponents).toBe(1)
      expect(state.metrics.activeComponents).toBe(1)
    })
    
    it('should update component state', () => {
      const state = store.getState()
      
      // Register component
      state.registerComponent('test-comp', 'Test', { value: 10 })
      
      // Update state
      state.updateComponentState('test-comp', { value: 20, new: 'data' })
      
      const component = state.components.get('test-comp')
      expect(component!.state).toEqual({ value: 20, new: 'data' })
      expect(state.metrics.totalStateUpdates).toBe(1)
    })
    
    it('should manage component hierarchy', () => {
      const state = store.getState()
      
      // Register parent and child
      state.registerComponent('parent', 'Parent', { parentData: true })
      state.registerComponent('child', 'Child', { childData: true })
      
      // Set parent-child relationship
      state.setParentChild('parent', 'child')
      
      const parent = state.components.get('parent')
      const child = state.components.get('child')
      
      expect(parent!.metadata.childIds).toContain('child')
      expect(child!.metadata.parentId).toBe('parent')
      expect(child!.metadata.depth).toBe(1)
      expect(child!.metadata.path).toBe('parent.child')
      
      // Get hierarchy
      const hierarchy = state.getComponentHierarchy('child')
      expect(hierarchy.parent?.id).toBe('parent')
      expect(hierarchy.children).toHaveLength(0)
    })
    
    it('should handle event emission and processing', async () => {
      const state = store.getState()
      
      // Register components
      state.registerComponent('source', 'Source', {})
      state.registerComponent('target', 'Target', {})
      
      // Emit event
      const eventId = state.emitEvent({
        type: 'test-event',
        name: 'testEvent',
        sourceId: 'source',
        targetIds: ['target'],
        payload: { message: 'hello' },
        priority: 'normal',
        scope: 'local'
      })
      
      expect(eventId).toBeDefined()
      expect(state.events).toHaveLength(1)
      
      const event = state.events[0]
      expect(event.type).toBe('test-event')
      expect(event.sourceId).toBe('source')
      expect(event.targetIds).toContain('target')
      expect(event.status).toBe('pending')
      
      // Process event
      await state.processEvent(eventId)
      
      const processedEvent = state.events.find(e => e.id === eventId)
      expect(processedEvent!.status).toBe('completed')
      expect(processedEvent!.results?.success).toContain('target')
    })
    
    it('should manage subscriptions', () => {
      const state = store.getState()
      const mockCallback = vi.fn()
      
      // Subscribe to component
      const unsubscribe = state.subscribe('test-comp', mockCallback)
      
      expect(state.subscriptions.has('test-comp')).toBe(true)
      expect(state.subscriptions.get('test-comp')!.size).toBe(1)
      
      // Register and update component to trigger callback
      state.registerComponent('test-comp', 'Test', { value: 1 })
      state.updateComponentState('test-comp', { value: 2 })
      
      expect(mockCallback).toHaveBeenCalledWith({ value: 2 })
      
      // Unsubscribe
      unsubscribe()
      expect(state.subscriptions.has('test-comp')).toBe(false)
    })
    
    it('should handle persistence operations', async () => {
      const state = store.getState()
      
      // Configure persistence
      state.configurePersistence({
        enabled: true,
        storage: 'localStorage',
        key: 'test-persistence'
      })
      
      // Register component
      state.registerComponent('persist-test', 'PersistTest', { data: 'test' })
      
      // Save state (would use localStorage in real environment)
      await expect(state.saveState()).resolves.toBeUndefined()
      
      // Load state (would load from localStorage in real environment)
      await expect(state.loadState()).resolves.toBeUndefined()
    })
  })
  
  describe('StateConflictResolver', () => {
    it('should detect conflicts between states', () => {
      const localState = { count: 5, name: 'local' }
      const globalState = { count: 3, name: 'local' }
      const now = Date.now()
      
      const conflict = conflictResolver.detectConflict(
        'test-component',
        localState,
        globalState,
        now,
        now - 50, // Global state is older
        { localSource: 'user', globalSource: 'server' }
      )
      
      expect(conflict).toBeDefined()
      expect(conflict!.conflictingKeys).toEqual(['count'])
      expect(conflict!.severity).toBe('low')
      expect(conflict!.resolution.status).toBe('pending')
    })
    
    it('should resolve conflicts with different strategies', async () => {
      const localState = { value: 'local', shared: 'data' }
      const globalState = { value: 'global', shared: 'data' }
      
      const conflict = conflictResolver.detectConflict(
        'test-comp',
        localState,
        globalState,
        Date.now(),
        Date.now() - 50
      )
      
      expect(conflict).toBeDefined()
      
      // Test localWins strategy
      let resolved = await conflictResolver.resolveConflict(conflict!.id, 'localWins')
      expect(resolved).toEqual(localState)
      
      // Create another conflict for globalWins test
      const conflict2 = conflictResolver.detectConflict(
        'test-comp-2',
        localState,
        globalState,
        Date.now(),
        Date.now() - 50
      )
      
      resolved = await conflictResolver.resolveConflict(conflict2!.id, 'globalWins')
      expect(resolved).toEqual(globalState)
      
      // Test merge strategy
      const conflict3 = conflictResolver.detectConflict(
        'test-comp-3',
        { a: 'local', b: 'local' },
        { a: 'global', c: 'global' },
        Date.now(),
        Date.now() - 50
      )
      
      resolved = await conflictResolver.resolveConflict(conflict3!.id, 'merge')
      expect(resolved).toEqual({ a: 'local', b: 'local', c: 'global' })
    })
    
    it('should handle custom resolvers', async () => {
      // Register custom resolver
      conflictResolver.registerCustomResolver('testResolver', async (conflict, context) => {
        return { resolved: 'custom', original: conflict.localState.value }
      })
      
      const conflict = conflictResolver.detectConflict(
        'test-comp',
        { value: 'local' },
        { value: 'global' },
        Date.now(),
        Date.now() - 50
      )
      
      const resolved = await conflictResolver.resolveConflict(conflict!.id, 'custom')
      expect(resolved).toEqual({ resolved: 'custom', original: 'local' })
    })
    
    it('should generate conflict analysis reports', () => {
      // Create multiple conflicts
      conflictResolver.detectConflict('comp1', { a: 1 }, { a: 2 }, Date.now(), Date.now() - 50)
      conflictResolver.detectConflict('comp1', { b: 1 }, { b: 2 }, Date.now(), Date.now() - 50)
      conflictResolver.detectConflict('comp2', { c: 1 }, { c: 2 }, Date.now(), Date.now() - 50)
      
      const report = conflictResolver.generateConflictReport()
      
      expect(report.summary.totalConflicts).toBe(3)
      expect(report.summary.pendingConflicts).toBe(3)
      expect(report.byComponent['comp1'].conflicts).toBe(2)
      expect(report.byComponent['comp2'].conflicts).toBe(1)
      expect(report.bySeverity.low).toBe(3)
    })
  })
  
  describe('GlobalStateDebugger', () => {
    it('should log debug entries', () => {
      stateDebugger.log('info', 'state', 'Test log message', { data: 'test' }, 'test-component')
      
      const logs = stateDebugger.getLogs()
      expect(logs).toHaveLength(1)
      
      const log = logs[0]
      expect(log.level).toBe('info')
      expect(log.category).toBe('state')
      expect(log.message).toBe('Test log message')
      expect(log.componentId).toBe('test-component')
      expect(log.data).toEqual({ data: 'test' })
    })
    
    it('should track state changes', () => {
      const previousState = { count: 0 }
      const newState = { count: 1, name: 'test' }
      
      stateDebugger.trackStateChange(
        'test-component',
        'update',
        previousState,
        newState,
        'local',
        { action: 'increment' }
      )
      
      const changes = stateDebugger.getStateChanges()
      expect(changes).toHaveLength(1)
      
      const change = changes[0]
      expect(change.componentId).toBe('test-component')
      expect(change.type).toBe('update')
      expect(change.changedKeys).toEqual(['count', 'name'])
      expect(change.source).toBe('local')
      expect(change.metadata.action).toBe('increment')
    })
    
    it('should create and restore snapshots', () => {
      // Setup state
      const state = store.getState()
      state.registerComponent('snap-test', 'SnapTest', { value: 42 })
      
      // Create snapshot
      const snapshot = stateDebugger.createSnapshot('Test snapshot', { version: '1.0' })
      
      expect(snapshot.label).toBe('Test snapshot')
      expect(snapshot.metadata?.version).toBe('1.0')
      expect(snapshot.globalState.components).toHaveLength(1)
      
      // Modify state
      state.updateComponentState('snap-test', { value: 100 })
      expect(state.components.get('snap-test')!.state.value).toBe(100)
      
      // Restore snapshot
      const restored = stateDebugger.restoreFromSnapshot(snapshot.id)
      expect(restored).toBe(true)
      
      // Verify restoration
      const restoredComponent = state.components.get('snap-test')
      expect(restoredComponent!.state.value).toBe(42)
    })
    
    it('should inspect component state', () => {
      const state = store.getState()
      
      // Register component with hierarchy
      state.registerComponent('parent', 'Parent', { parentData: true })
      state.registerComponent('child', 'Child', { childData: true })
      state.setParentChild('parent', 'child')
      
      // Track some changes
      stateDebugger.trackStateChange('child', 'update', { childData: true }, { childData: true, updated: true }, 'local')
      
      const inspection = stateDebugger.inspectComponent('child')
      
      expect(inspection).toBeDefined()
      expect(inspection!.component.id).toBe('child')
      expect(inspection!.hierarchy.parent?.id).toBe('parent')
      expect(inspection!.recentChanges).toHaveLength(1)
    })
    
    it('should filter logs and changes', () => {
      // Create multiple log entries
      stateDebugger.log('info', 'state', 'Info message', {}, 'comp1')
      stateDebugger.log('error', 'performance', 'Error message', {}, 'comp2')
      stateDebugger.log('debug', 'state', 'Debug message', {}, 'comp1')
      
      // Filter by level
      const errorLogs = stateDebugger.getLogs({ level: 'error' })
      expect(errorLogs).toHaveLength(1)
      expect(errorLogs[0].level).toBe('error')
      
      // Filter by category
      const stateLogs = stateDebugger.getLogs({ category: 'state' })
      expect(stateLogs).toHaveLength(2)
      
      // Filter by component
      const comp1Logs = stateDebugger.getLogs({ componentId: 'comp1' })
      expect(comp1Logs).toHaveLength(2)
      
      // Create state changes
      stateDebugger.trackStateChange('comp1', 'create', undefined, { value: 1 }, 'local')
      stateDebugger.trackStateChange('comp1', 'update', { value: 1 }, { value: 2 }, 'server')
      stateDebugger.trackStateChange('comp2', 'delete', { value: 3 }, {}, 'local')
      
      // Filter changes by type
      const updateChanges = stateDebugger.getStateChanges({ type: 'update' })
      expect(updateChanges).toHaveLength(1)
      expect(updateChanges[0].type).toBe('update')
      
      // Filter changes by source
      const localChanges = stateDebugger.getStateChanges({ source: 'local' })
      expect(localChanges).toHaveLength(2)
    })
    
    it('should export and import debug data', () => {
      // Create some data
      stateDebugger.log('info', 'state', 'Test message')
      stateDebugger.trackStateChange('test', 'create', undefined, { value: 1 }, 'local')
      stateDebugger.createSnapshot('Test snapshot')
      
      // Export data
      const exportedData = stateDebugger.exportDebugData()
      expect(exportedData).toBeDefined()
      
      const data = JSON.parse(exportedData)
      expect(data.logs).toHaveLength(1)
      expect(data.stateChanges).toHaveLength(1)
      expect(data.snapshots).toHaveLength(1)
      
      // Clear data
      stateDebugger.clearDebugData()
      expect(stateDebugger.getLogs()).toHaveLength(0)
      expect(stateDebugger.getStateChanges()).toHaveLength(0)
      expect(stateDebugger.getSnapshots()).toHaveLength(0)
      
      // Import data
      const imported = stateDebugger.importDebugData(exportedData)
      expect(imported).toBe(true)
      
      // Verify import
      expect(stateDebugger.getLogs()).toHaveLength(1)
      expect(stateDebugger.getStateChanges()).toHaveLength(1)
      expect(stateDebugger.getSnapshots()).toHaveLength(1)
    })
    
    it('should generate debug reports', () => {
      // Create test data
      stateDebugger.log('error', 'performance', 'Performance issue', {}, 'comp1')
      stateDebugger.trackStateChange('comp1', 'update', { a: 1 }, { a: 2 }, 'local')
      stateDebugger.trackStateChange('comp1', 'update', { a: 2 }, { a: 3 }, 'local')
      stateDebugger.trackStateChange('comp2', 'create', undefined, { b: 1 }, 'server')
      
      const report = stateDebugger.generateDebugReport()
      
      expect(report.summary.totalLogs).toBeGreaterThan(0)
      expect(report.summary.totalStateChanges).toBe(3)
      expect(report.topComponents).toHaveLength(2)
      expect(report.topComponents[0].componentId).toBe('comp1')
      expect(report.topComponents[0].changeCount).toBe(2)
    })
  })
  
  describe('Integration Tests', () => {
    it('should integrate debugger with conflict resolver', () => {
      // Initialize debugger to track resolver activity
      const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
      
      const resolverWithLogging = new StateConflictResolver({
        logger: mockLogger,
        enableWarnings: true
      })
      
      // Create conflict
      const conflict = resolverWithLogging.detectConflict(
        'test-comp',
        { value: 'local' },
        { value: 'global' },
        Date.now(),
        Date.now() - 50
      )
      
      expect(conflict).toBeDefined()
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'State conflict detected',
        expect.objectContaining({
          componentId: 'test-comp',
          conflictId: conflict!.id
        })
      )
      
      resolverWithLogging.shutdown()
    })
    
    it('should handle complex state synchronization scenarios', async () => {
      const state = store.getState()
      
      // Setup components with sync enabled
      state.registerComponent(
        'sync-test',
        'SyncTest',
        { counter: 0, name: 'test' },
        { isActive: true },
        { 
          enabled: true,
          direction: 'bidirectional',
          conflictResolution: 'merge'
        }
      )
      
      // Create conflict scenario
      const conflict = conflictResolver.detectConflict(
        'sync-test',
        { counter: 5, name: 'local' },
        { counter: 3, name: 'test' },
        Date.now(),
        Date.now() - 100
      )
      
      expect(conflict).toBeDefined()
      
      // Resolve conflict
      const resolved = await conflictResolver.resolveConflict(conflict!.id, 'merge')
      expect(resolved).toEqual({ counter: 5, name: 'local' })
      
      // Update component with resolved state
      state.updateComponentState('sync-test', resolved!)
      
      // Track in debugger
      stateDebugger.trackStateChange(
        'sync-test',
        'conflict_resolution',
        conflict!.globalState,
        resolved!,
        'resolver',
        { conflictId: conflict!.id, strategy: 'merge' }
      )
      
      // Verify tracking
      const changes = stateDebugger.getStateChanges({ componentId: 'sync-test' })
      expect(changes).toHaveLength(1)
      expect(changes[0].type).toBe('conflict_resolution')
      expect(changes[0].source).toBe('resolver')
    })
    
    it('should maintain performance under load', async () => {
      const startTime = Date.now()
      
      // Register many components
      for (let i = 0; i < 100; i++) {
        store.getState().registerComponent(
          `perf-test-${i}`,
          'PerfTest',
          { index: i, data: `test-${i}` }
        )
      }
      
      // Perform many updates
      for (let i = 0; i < 100; i++) {
        store.getState().updateComponentState(`perf-test-${i}`, { 
          index: i, 
          data: `updated-${i}`,
          timestamp: Date.now()
        })
        
        stateDebugger.trackStateChange(
          `perf-test-${i}`,
          'update',
          { index: i, data: `test-${i}` },
          { index: i, data: `updated-${i}`, timestamp: Date.now() },
          'local'
        )
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time (less than 1 second for 200 operations)
      expect(duration).toBeLessThan(1000)
      
      // Verify data integrity
      expect(store.getState().components.size).toBe(100)
      expect(stateDebugger.getStateChanges()).toHaveLength(100)
      
      // Check metrics
      const metrics = store.getState().getMetrics()
      expect(metrics.totalComponents).toBe(100)
      expect(metrics.totalStateUpdates).toBe(100)
    })
  })
})