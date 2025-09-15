/**
 * Task 4: Zustand Integration - Simplified Tests
 * 
 * Basic test suite to verify core functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { StateConflictResolver } from '../StateConflictResolver'
import { GlobalStateDebugger } from '../GlobalStateDebugger'

// Mock environment
if (typeof process === 'undefined') {
  globalThis.process = { env: { NODE_ENV: 'test' } } as any
}

if (typeof localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null
  } as any
}

describe('Task 4: Zustand Integration - Core Components', () => {
  let conflictResolver: StateConflictResolver
  let stateDebugger: GlobalStateDebugger
  
  beforeEach(() => {
    conflictResolver = new StateConflictResolver({
      detection: {
        enabled: true,
        monitorKeys: [],
        ignoreKeys: ['__internal'],
        conflictThreshold: 100,
        deepComparison: true,
        strictTypeComparison: false
      },
      enableAutoResolution: false
    })
    
    stateDebugger = new GlobalStateDebugger({
      enabled: true,
      logLevels: ['info', 'warn', 'error'],
      maxLogEntries: 100,
      autoSnapshot: false
    })
  })
  
  afterEach(() => {
    conflictResolver.shutdown()
    stateDebugger.shutdown()
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
        now - 50
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
      const resolved = await conflictResolver.resolveConflict(conflict!.id, 'localWins')
      expect(resolved).toEqual(localState)
      expect(conflict!.resolution.status).toBe('resolved')
    })
    
    it('should generate conflict reports', () => {
      // Create multiple conflicts
      conflictResolver.detectConflict('comp1', { a: 1 }, { a: 2 }, Date.now(), Date.now() - 50)
      conflictResolver.detectConflict('comp1', { b: 1 }, { b: 2 }, Date.now(), Date.now() - 50)
      conflictResolver.detectConflict('comp2', { c: 1 }, { c: 2 }, Date.now(), Date.now() - 50)
      
      const report = conflictResolver.generateConflictReport()
      
      expect(report.summary.totalConflicts).toBe(3)
      expect(report.summary.pendingConflicts).toBe(3)
      expect(report.byComponent['comp1'].conflicts).toBe(2)
      expect(report.byComponent['comp2'].conflicts).toBe(1)
    })
  })
  
  describe('GlobalStateDebugger', () => {
    it('should log debug entries', () => {
      stateDebugger.log('info', 'state', 'Test log message', { data: 'test' }, 'test-component')
      
      const logs = stateDebugger.getLogs()
      expect(logs.length).toBeGreaterThan(0)
      
      const testLog = logs.find(log => log.message === 'Test log message')
      expect(testLog).toBeDefined()
      expect(testLog!.level).toBe('info')
      expect(testLog!.category).toBe('state')
      expect(testLog!.componentId).toBe('test-component')
      expect(testLog!.data).toEqual({ data: 'test' })
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
      expect(changes.length).toBeGreaterThan(0)
      
      const testChange = changes.find(change => change.componentId === 'test-component')
      expect(testChange).toBeDefined()
      expect(testChange!.type).toBe('update')
      expect(testChange!.changedKeys).toEqual(['count', 'name'])
      expect(testChange!.source).toBe('local')
      expect(testChange!.metadata.action).toBe('increment')
    })
    
    it('should filter logs', () => {
      stateDebugger.log('info', 'state', 'Info message', {}, 'comp1')
      stateDebugger.log('error', 'performance', 'Error message', {}, 'comp2')
      stateDebugger.log('warn', 'state', 'Warn message', {}, 'comp1')
      
      // Filter by level
      const errorLogs = stateDebugger.getLogs({ level: 'error' })
      expect(errorLogs.some(log => log.level === 'error')).toBe(true)
      
      // Filter by category
      const stateLogs = stateDebugger.getLogs({ category: 'state' })
      expect(stateLogs.filter(log => log.category === 'state').length).toBeGreaterThan(0)
      
      // Filter by component
      const comp1Logs = stateDebugger.getLogs({ componentId: 'comp1' })
      expect(comp1Logs.filter(log => log.componentId === 'comp1').length).toBeGreaterThan(0)
    })
    
    it('should export and import debug data', () => {
      // Create some data
      stateDebugger.log('info', 'state', 'Test message')
      stateDebugger.trackStateChange('test', 'create', undefined, { value: 1 }, 'local')
      
      // Export data
      const exportedData = stateDebugger.exportDebugData()
      expect(exportedData).toBeDefined()
      
      const data = JSON.parse(exportedData)
      expect(data.logs).toBeDefined()
      expect(data.stateChanges).toBeDefined()
      
      // Clear data
      stateDebugger.clearDebugData()
      // The clear operation itself creates a log, so we expect 1 log
      expect(stateDebugger.getLogs().length).toBeLessThanOrEqual(1)
      expect(stateDebugger.getStateChanges()).toHaveLength(0)
      
      // Import data
      const imported = stateDebugger.importDebugData(exportedData)
      expect(imported).toBe(true)
      
      // Verify import
      expect(stateDebugger.getLogs().length).toBeGreaterThan(0)
      expect(stateDebugger.getStateChanges().length).toBeGreaterThan(0)
    })
    
    it('should generate debug reports', () => {
      // Create test data
      stateDebugger.log('error', 'performance', 'Performance issue', {}, 'comp1')
      stateDebugger.trackStateChange('comp1', 'update', { a: 1 }, { a: 2 }, 'local')
      stateDebugger.trackStateChange('comp1', 'update', { a: 2 }, { a: 3 }, 'local')
      stateDebugger.trackStateChange('comp2', 'create', undefined, { b: 1 }, 'server')
      
      const report = stateDebugger.generateDebugReport()
      
      expect(report.summary.totalLogs).toBeGreaterThan(0)
      expect(report.summary.totalStateChanges).toBeGreaterThan(0)
      expect(report.topComponents.length).toBeGreaterThan(0)
    })
  })
  
  describe('Integration Tests', () => {
    it('should work together - conflict resolver and debugger', () => {
      // Setup debugger to track resolver activity
      const mockLogger = {
        debug: () => {},
        info: () => {},
        warn: (message: string, data: any) => {
          stateDebugger.log('warn', 'conflict', message, data)
        },
        error: () => {}
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
      
      // Check that debugger received the warning
      const logs = stateDebugger.getLogs({ category: 'conflict' })
      expect(logs.some(log => log.message.includes('State conflict detected'))).toBe(true)
      
      resolverWithLogging.shutdown()
    })
    
    it('should handle performance testing', () => {
      const startTime = Date.now()
      
      // Create many state changes
      for (let i = 0; i < 50; i++) {
        stateDebugger.trackStateChange(
          `perf-test-${i}`,
          'update',
          { index: i },
          { index: i, updated: true },
          'local'
        )
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000)
      
      // Verify data integrity
      const changes = stateDebugger.getStateChanges()
      expect(changes.length).toBeGreaterThanOrEqual(50)
    })
  })
})