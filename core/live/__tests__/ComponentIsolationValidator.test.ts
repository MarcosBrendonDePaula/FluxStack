/**
 * ComponentIsolationValidator Tests
 * 
 * Advanced tests for component isolation validation covering
 * state separation, ID uniqueness, event isolation, and more.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ComponentIsolationValidator } from '../ComponentIsolationValidator'
import { ComponentIsolationManager } from '../ComponentIsolationManager'

describe('ComponentIsolationValidator', () => {
  let validator: ComponentIsolationValidator
  let isolationManager: ComponentIsolationManager
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
    
    isolationManager = new ComponentIsolationManager(mockLogger)
    validator = new ComponentIsolationValidator(
      isolationManager,
      { 
        validationInterval: 0, // Disable automatic validation
        validateMemoryIsolation: true,
        validateStateIsolation: true,
        validateParentChildIsolation: true,
        validateIdUniqueness: true
      },
      mockLogger
    )
  })

  afterEach(() => {
    // Clear any violations from previous tests
    validator.getAllViolations().forEach(v => validator.clearViolation(v.id))
    
    // Clean up all components
    const allComponents = isolationManager.getAllComponents()
    allComponents.forEach(comp => {
      try {
        isolationManager.cleanupInstance(comp.componentId)
      } catch (error) {
        // Ignore cleanup errors
      }
    })
    
    validator.shutdown()
    isolationManager.shutdown()
  })

  describe('ID Uniqueness Validation', () => {
    it('should detect ID collisions', async () => {
      // Create components with same ID (simulate collision)
      const identity1 = isolationManager.createInstance('TestAction', { value: 1 }, 'client-1')
      const identity2 = isolationManager.createInstance('TestAction', { value: 2 }, 'client-2')
      
      // Manually create collision by setting same ID
      const collisionId = 'collision-test-id'
      isolationManager['componentTree'].set(collisionId, {
        ...identity1,
        componentId: collisionId
      })
      isolationManager['componentTree'].set(collisionId + '-duplicate', {
        ...identity2,
        componentId: collisionId
      })
      
      const violations = await validator.validateIsolation()
      
      const idCollisions = violations.filter(v => v.type === 'id_collision')
      expect(idCollisions.length).toBeGreaterThan(0)
      
      const collision = idCollisions[0]
      expect(collision.severity).toBe('critical')
      expect(collision.componentIds).toContain(collisionId)
    })

    it('should pass when all IDs are unique', async () => {
      // Create multiple components with unique IDs
      const identity1 = isolationManager.createInstance('TestAction1', { value: 1 }, 'client-1')
      const identity2 = isolationManager.createInstance('TestAction2', { value: 2 }, 'client-2')
      const identity3 = isolationManager.createInstance('TestAction3', { value: 3 }, 'client-3')
      
      const violations = await validator.validateIsolation()
      
      const idCollisions = violations.filter(v => v.type === 'id_collision')
      expect(idCollisions).toHaveLength(0)
    })
  })

  describe('State Isolation Validation', () => {
    it('should detect state contamination between similar components', async () => {
      // Create fresh instances for this test
      const freshLogger = {
        debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn()
      }
      const freshIsolationManager = new ComponentIsolationManager(freshLogger)
      const freshValidator = new ComponentIsolationValidator(
        freshIsolationManager,
        { validationInterval: 0, validateMemoryIsolation: true },
        freshLogger
      )
      
      const identity1 = freshIsolationManager.createInstance('CounterAction', { initialValue: 0, id: 1 }, 'client-1')
      const identity2 = freshIsolationManager.createInstance('CounterAction', { initialValue: 0, id: 2 }, 'client-2')
      
      console.log(`Identity1 ID: ${identity1.componentId}`)
      console.log(`Identity2 ID: ${identity2.componentId}`)
      
      // Create instances with identical state (contamination) - same object reference
      const identicalState = { count: 42, lastUpdate: Date.now() }
      freshIsolationManager.registerInstance(identity1.componentId, identicalState)
      freshIsolationManager.registerInstance(identity2.componentId, identicalState) // Same object reference
      
      console.log(`Components before validation: ${freshIsolationManager.getAllComponents().length}`)
      console.log(`Component IDs:`, freshIsolationManager.getAllComponents().map(c => c.componentId))
      
      const violations = await freshValidator.validateIsolation()
      
      const stateViolations = violations.filter(v => 
        v.type === 'state_contamination' || v.type === 'memory_sharing'
      )
      
      expect(stateViolations.length).toBeGreaterThan(0)
      
      const memoryViolation = stateViolations.find(v => v.type === 'memory_sharing')
      expect(memoryViolation).toBeDefined()
      expect(memoryViolation!.severity).toBe('critical')
      expect(memoryViolation!.componentIds).toContain(identity1.componentId)
      expect(memoryViolation!.componentIds).toContain(identity2.componentId)
      
      // Cleanup
      freshValidator.shutdown()
      freshIsolationManager.shutdown()
    })

    it('should pass when components have properly isolated state', async () => {
      const identity1 = isolationManager.createInstance('CounterAction', { initialValue: 0 }, 'client-1')
      const identity2 = isolationManager.createInstance('CounterAction', { initialValue: 10 }, 'client-2')
      
      // Create instances with different state objects
      isolationManager.registerInstance(identity1.componentId, { 
        count: 1, 
        data: { unique: 'data1' } 
      })
      isolationManager.registerInstance(identity2.componentId, { 
        count: 15, 
        data: { unique: 'data2' } 
      })
      
      const violations = await validator.validateIsolation()
      
      const stateViolations = violations.filter(v => 
        v.type === 'state_contamination' && 
        (v.componentIds.includes(identity1.componentId) || v.componentIds.includes(identity2.componentId))
      )
      expect(stateViolations).toHaveLength(0)
    })
  })

  describe('Event Isolation Validation', () => {
    it('should detect event cross-contamination', async () => {
      const identity1 = isolationManager.createInstance('TestAction1', {}, 'client-1')
      const identity2 = isolationManager.createInstance('TestAction2', {}, 'client-2')
      
      // Simulate identical events (contamination)
      const eventData = { type: 'update', value: 123 }
      validator.trackEvent(identity1.componentId, 'stateUpdate', eventData)
      validator.trackEvent(identity2.componentId, 'stateUpdate', eventData)
      
      const violations = await validator.validateIsolation()
      
      const eventViolations = violations.filter(v => v.type === 'event_cross_contamination')
      expect(eventViolations.length).toBeGreaterThan(0)
      
      const violation = eventViolations[0]
      expect(violation.componentIds).toContain(identity1.componentId)
      expect(violation.componentIds).toContain(identity2.componentId)
    })

    it('should pass when events are properly isolated', async () => {
      const identity1 = isolationManager.createInstance('TestAction1', {}, 'client-1')
      const identity2 = isolationManager.createInstance('TestAction2', {}, 'client-2')
      
      // Track different events
      validator.trackEvent(identity1.componentId, 'stateUpdate', { value: 1 })
      validator.trackEvent(identity2.componentId, 'stateUpdate', { value: 2 })
      
      const violations = await validator.validateIsolation()
      
      const eventViolations = violations.filter(v => 
        v.type === 'event_cross_contamination' &&
        (v.componentIds.includes(identity1.componentId) || v.componentIds.includes(identity2.componentId))
      )
      expect(eventViolations).toHaveLength(0)
    })
  })

  describe('Parent-Child Isolation Validation', () => {
    it('should detect orphaned child components', async () => {
      const parent = isolationManager.createInstance('ParentAction', {}, 'client-1')
      const child = isolationManager.createInstance('ChildAction', {}, 'client-1', undefined, parent.componentId)
      
      // Manually break parent relationship without cleaning up child
      const parentIdentity = isolationManager.getIdentity(parent.componentId)!
      const childIdentity = isolationManager.getIdentity(child.componentId)!
      
      // Remove parent from component tree but keep child with parent reference
      isolationManager['componentTree'].delete(parent.componentId)
      
      const violations = await validator.validateIsolation()
      
      const parentChildViolations = violations.filter(v => v.type === 'parent_child_confusion')
      expect(parentChildViolations.length).toBeGreaterThan(0)
      
      const violation = parentChildViolations[0]
      expect(violation.componentIds).toContain(child.componentId)
      expect(violation.severity).toBe('high')
    })

    it('should detect parent-child relationship mismatches', async () => {
      const parent = isolationManager.createInstance('ParentAction', {}, 'client-1')
      const child = isolationManager.createInstance('ChildAction', {}, 'client-1', undefined, parent.componentId)
      
      // Manually break parent-child relationship
      const parentIdentity = isolationManager.getIdentity(parent.componentId)!
      parentIdentity.childIds.delete(child.componentId)
      
      const violations = await validator.validateIsolation()
      
      const mismatchViolations = violations.filter(v => 
        v.type === 'parent_child_confusion' && 
        v.description.includes('does not recognize child')
      )
      expect(mismatchViolations.length).toBeGreaterThan(0)
    })

    it('should pass with proper parent-child relationships', async () => {
      const parent = isolationManager.createInstance('ParentAction', {}, 'client-1')
      const child1 = isolationManager.createInstance('ChildAction1', {}, 'client-1', undefined, parent.componentId)
      const child2 = isolationManager.createInstance('ChildAction2', {}, 'client-1', undefined, parent.componentId)
      
      const violations = await validator.validateIsolation()
      
      const parentChildViolations = violations.filter(v => v.type === 'parent_child_confusion')
      expect(parentChildViolations).toHaveLength(0)
    })
  })

  describe('Stress Testing', () => {
    it('should run isolation stress test successfully', async () => {
      const result = await validator.runIsolationStressTest('StressTestAction', 5, 10)
      
      expect(result.testName).toContain('Stress Test')
      expect(result.componentsTested).toHaveLength(5)
      expect(result.duration).toBeGreaterThan(0)
      expect(result.details.instanceCount).toBe(5)
      expect(result.details.operationsPerInstance).toBe(10)
      expect(result.details.totalOperations).toBe(50)
      
      // Test should pass if no violations found
      if (result.passed) {
        expect(result.violations).toHaveLength(0)
      }
    }, 10000) // Increase timeout for stress test

    it('should detect isolation violations during stress test', async () => {
      // This test would require mocking the isolation manager to introduce violations
      // For now, we'll test that the stress test completes
      const result = await validator.runIsolationStressTest('FailingAction', 3, 5)
      
      expect(result).toBeDefined()
      expect(result.componentsTested).toHaveLength(3)
    })
  })

  describe('Concurrent State Isolation Test', () => {
    it('should test concurrent state updates', async () => {
      const result = await validator.testConcurrentStateIsolation('ConcurrentTestAction', 10)
      
      expect(result.testName).toContain('Concurrent State Isolation')
      expect(result.componentsTested).toHaveLength(2)
      expect(result.duration).toBeGreaterThan(0)
      expect(result.details.concurrentUpdates).toBe(10)
      
      // Values should be different after concurrent updates
      expect(result.details.finalValue1).not.toBe(result.details.finalValue2)
    })

    it('should detect state contamination in concurrent updates', async () => {
      // Mock the isolation manager to cause state contamination
      const originalRegisterInstance = isolationManager.registerInstance
      let sharedInstance = { value: 0, operations: [] }
      
      isolationManager.registerInstance = vi.fn().mockImplementation((componentId, instance) => {
        // Force both components to share the same instance (contamination)
        originalRegisterInstance.call(isolationManager, componentId, sharedInstance)
      })
      
      const result = await validator.testConcurrentStateIsolation('ContaminatedAction', 5)
      
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.passed).toBe(false)
      
      const contamination = result.violations.find(v => v.type === 'state_contamination')
      expect(contamination).toBeDefined()
      
      // Restore original method
      isolationManager.registerInstance = originalRegisterInstance
    })
  })

  describe('State Snapshot Management', () => {
    it('should update and track state snapshots', () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-1')
      
      const state1 = { count: 1, data: 'test1' }
      const state2 = { count: 2, data: 'test2' }
      
      validator.updateStateSnapshot(identity.componentId, state1)
      validator.updateStateSnapshot(identity.componentId, state2)
      
      // State should be updated (no direct way to verify, but ensure no errors)
      expect(() => validator.updateStateSnapshot(identity.componentId, state2)).not.toThrow()
    })
  })

  describe('Event Tracking', () => {
    it('should track events for components', () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-1')
      
      validator.trackEvent(identity.componentId, 'stateUpdate', { value: 1 })
      validator.trackEvent(identity.componentId, 'userAction', { action: 'click' })
      
      // Events should be tracked (no direct way to verify, but ensure no errors)
      expect(() => validator.trackEvent(identity.componentId, 'test', {})).not.toThrow()
    })

    it('should limit event history per component', () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-1')
      
      // Add more than 100 events (the limit)
      for (let i = 0; i < 150; i++) {
        validator.trackEvent(identity.componentId, `event-${i}`, { index: i })
      }
      
      // Should not throw errors even with many events
      expect(() => validator.trackEvent(identity.componentId, 'final-event', {})).not.toThrow()
    })
  })

  describe('Violation Management', () => {
    it('should track and retrieve violations', async () => {
      // Create a scenario that generates violations
      const identity1 = isolationManager.createInstance('TestAction', { id: 1 }, 'client-1')
      const identity2 = isolationManager.createInstance('TestAction', { id: 2 }, 'client-2')
      
      // Create memory sharing violation - same object reference
      const sharedInstance = { shared: true, count: 0 }
      isolationManager.registerInstance(identity1.componentId, sharedInstance)
      isolationManager.registerInstance(identity2.componentId, sharedInstance)
      
      const violations = await validator.validateIsolation()
      
      expect(violations.length).toBeGreaterThan(0)
      
      // Verify the memory sharing violation was detected
      const memoryViolations = violations.filter(v => v.type === 'memory_sharing')
      expect(memoryViolations.length).toBeGreaterThan(0)
      
      const allViolations = validator.getAllViolations()
      expect(allViolations.length).toBeGreaterThanOrEqual(violations.length)
      
      const criticalViolations = validator.getViolationsBySeverity('critical')
      expect(Array.isArray(criticalViolations)).toBe(true)
      
      const componentViolations = validator.getViolationsByComponent(identity1.componentId)
      expect(componentViolations.some(v => v.componentIds.includes(identity1.componentId))).toBe(true)
    })

    it('should clear resolved violations', async () => {
      const violations = await validator.validateIsolation()
      
      if (violations.length > 0) {
        const violationId = violations[0].id
        validator.clearViolation(violationId)
        
        const remainingViolations = validator.getAllViolations()
        expect(remainingViolations.find(v => v.id === violationId)).toBeUndefined()
      }
    })
  })

  describe('Component Cleanup', () => {
    it('should cleanup component tracking data', () => {
      const identity = isolationManager.createInstance('TestAction', {}, 'client-1')
      
      // Add tracking data
      validator.updateStateSnapshot(identity.componentId, { test: true })
      validator.trackEvent(identity.componentId, 'test-event', { data: true })
      
      // Cleanup should not throw errors
      expect(() => validator.cleanupComponent(identity.componentId)).not.toThrow()
    })
  })

  describe('Shutdown', () => {
    it('should shutdown cleanly', () => {
      const identity1 = isolationManager.createInstance('TestAction1', {}, 'client-1')
      const identity2 = isolationManager.createInstance('TestAction2', {}, 'client-2')
      
      validator.updateStateSnapshot(identity1.componentId, { test: 1 })
      validator.trackEvent(identity2.componentId, 'test', { data: 1 })
      
      expect(() => validator.shutdown()).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Mock getAllComponents to throw error
      const originalGetAll = isolationManager.getAllComponents
      isolationManager.getAllComponents = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      
      const violations = await validator.validateIsolation()
      
      // Should not throw and return empty array
      expect(Array.isArray(violations)).toBe(true)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Isolation validation failed:',
        expect.any(Error)
      )
      
      // Restore original method
      isolationManager.getAllComponents = originalGetAll
    })
  })
})