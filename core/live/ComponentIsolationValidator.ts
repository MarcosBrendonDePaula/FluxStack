/**
 * ComponentIsolationValidator
 * 
 * Advanced validation system for component isolation to ensure
 * multiple components of same type maintain separate state and
 * prevent cross-component contamination.
 */

import { ComponentIdentity, ComponentState, ComponentMetrics } from './types'
import { ComponentIsolationManager } from './ComponentIsolationManager'
import { Logger } from '../utils/logger'

/**
 * Isolation violation types
 */
export type IsolationViolationType = 
  | 'state_contamination'
  | 'id_collision'
  | 'event_cross_contamination'
  | 'memory_sharing'
  | 'websocket_sharing'
  | 'cleanup_interference'
  | 'parent_child_confusion'

/**
 * Isolation violation severity
 */
export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Isolation violation report
 */
export interface IsolationViolation {
  /** Unique violation ID */
  id: string
  
  /** Type of isolation violation */
  type: IsolationViolationType
  
  /** Severity level */
  severity: ViolationSeverity
  
  /** Components involved */
  componentIds: string[]
  
  /** Component types involved */
  componentTypes: string[]
  
  /** Description of the violation */
  description: string
  
  /** Evidence of the violation */
  evidence: any
  
  /** When the violation was detected */
  detectedAt: number
  
  /** Suggested remediation */
  remediation: string
}

/**
 * Isolation validation configuration
 */
export interface IsolationValidationConfig {
  /** Enable state isolation validation */
  validateStateIsolation: boolean
  
  /** Enable ID uniqueness validation */
  validateIdUniqueness: boolean
  
  /** Enable event isolation validation */
  validateEventIsolation: boolean
  
  /** Enable memory isolation validation */
  validateMemoryIsolation: boolean
  
  /** Enable WebSocket isolation validation */
  validateWebSocketIsolation: boolean
  
  /** Enable cleanup isolation validation */
  validateCleanupIsolation: boolean
  
  /** Enable parent-child isolation validation */
  validateParentChildIsolation: boolean
  
  /** Maximum allowed state similarity percentage */
  maxStateSimilarity: number
  
  /** Validation interval (ms) */
  validationInterval: number
  
  /** Maximum violations to track */
  maxTrackedViolations: number
}

/**
 * Component isolation test result
 */
export interface IsolationTestResult {
  /** Test name */
  testName: string
  
  /** Whether test passed */
  passed: boolean
  
  /** Violations found */
  violations: IsolationViolation[]
  
  /** Test duration */
  duration: number
  
  /** Components tested */
  componentsTested: string[]
  
  /** Additional details */
  details?: any
}

/**
 * ComponentIsolationValidator
 * 
 * Validates and monitors component isolation to prevent
 * cross-component contamination and ensure proper separation.
 */
export class ComponentIsolationValidator {
  private static instance: ComponentIsolationValidator
  
  /** Isolation manager reference */
  private isolationManager: ComponentIsolationManager
  
  /** Logger instance */
  private logger: Logger
  
  /** Validation configuration */
  private config: IsolationValidationConfig
  
  /** Detected violations */
  private violations = new Map<string, IsolationViolation>()
  
  /** Component state snapshots for comparison */
  private stateSnapshots = new Map<string, any>()
  
  /** Event tracking for isolation validation */
  private eventTracking = new Map<string, Array<{
    event: string
    timestamp: number
    data: any
  }>>()
  
  /** Validation interval handle */
  private validationInterval: NodeJS.Timeout | null = null
  
  /** Violation ID counter */
  private violationIdCounter = 0
  
  constructor(
    isolationManager: ComponentIsolationManager,
    config: Partial<IsolationValidationConfig> = {},
    logger?: Logger
  ) {
    this.isolationManager = isolationManager
    this.logger = logger || console as any
    
    this.config = {
      validateStateIsolation: true,
      validateIdUniqueness: true,
      validateEventIsolation: true,
      validateMemoryIsolation: true,
      validateWebSocketIsolation: true,
      validateCleanupIsolation: true,
      validateParentChildIsolation: true,
      maxStateSimilarity: 90, // 90% similarity threshold
      validationInterval: 5 * 60 * 1000, // 5 minutes
      maxTrackedViolations: 500,
      ...config
    }
    
    this.startValidation()
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(
    isolationManager?: ComponentIsolationManager,
    config?: Partial<IsolationValidationConfig>,
    logger?: Logger
  ): ComponentIsolationValidator {
    if (!ComponentIsolationValidator.instance && isolationManager) {
      ComponentIsolationValidator.instance = new ComponentIsolationValidator(
        isolationManager,
        config,
        logger
      )
    }
    return ComponentIsolationValidator.instance
  }
  
  /**
   * Run comprehensive isolation validation
   */
  async validateIsolation(): Promise<IsolationViolation[]> {
    const violations: IsolationViolation[] = []
    
    try {
      if (this.config.validateIdUniqueness) {
        const idViolations = await this.validateIdUniqueness()
        violations.push(...idViolations)
        console.log(`ID violations: ${idViolations.length}`)
      }
      
      if (this.config.validateStateIsolation) {
        const stateViolations = await this.validateStateIsolation()
        violations.push(...stateViolations)
        console.log(`State violations: ${stateViolations.length}`)
      }
      
      if (this.config.validateEventIsolation) {
        const eventViolations = await this.validateEventIsolation()
        violations.push(...eventViolations)
        console.log(`Event violations: ${eventViolations.length}`)
      }
      
      if (this.config.validateMemoryIsolation) {
        const memoryViolations = await this.validateMemoryIsolation()
        violations.push(...memoryViolations)
        console.log(`Memory violations: ${memoryViolations.length}`)
      }
      
      if (this.config.validateWebSocketIsolation) {
        const wsViolations = await this.validateWebSocketIsolation()
        violations.push(...wsViolations)
        console.log(`WebSocket violations: ${wsViolations.length}`)
      }
      
      if (this.config.validateParentChildIsolation) {
        const parentChildViolations = await this.validateParentChildIsolation()
        violations.push(...parentChildViolations)
        console.log(`Parent-child violations: ${parentChildViolations.length}`)
      }
      
      // Store violations
      for (const violation of violations) {
        this.violations.set(violation.id, violation)
      }
      
      // Trim violations if too many
      if (this.violations.size > this.config.maxTrackedViolations) {
        const violationsArray = Array.from(this.violations.values())
        violationsArray.sort((a, b) => a.detectedAt - b.detectedAt)
        const toRemove = violationsArray.slice(0, violationsArray.length - this.config.maxTrackedViolations)
        for (const violation of toRemove) {
          this.violations.delete(violation.id)
        }
      }
      
      if (violations.length > 0) {
        this.logger.warn(`Found ${violations.length} component isolation violations`, {
          violationTypes: violations.map(v => v.type),
          severities: violations.map(v => v.severity)
        })
      }
      
    } catch (error) {
      this.logger.error('Isolation validation failed:', error)
    }
    
    return violations
  }
  
  /**
   * Run isolation stress test with multiple components
   */
  async runIsolationStressTest(
    componentType: string,
    instanceCount: number = 10,
    operationsPerInstance: number = 100
  ): Promise<IsolationTestResult> {
    const testName = `Isolation Stress Test: ${componentType} x${instanceCount}`
    const startTime = performance.now()
    const violations: IsolationViolation[] = []
    const componentsTested: string[] = []
    
    try {
      // Create multiple instances
      const instances: ComponentIdentity[] = []
      for (let i = 0; i < instanceCount; i++) {
        const identity = this.isolationManager.createInstance(
          componentType,
          { testId: i, value: Math.random() },
          `test-client-${i}`
        )
        instances.push(identity)
        componentsTested.push(identity.componentId)
      }
      
      // Simulate concurrent operations
      const operations = instances.flatMap((identity, index) =>
        Array.from({ length: operationsPerInstance }, (_, opIndex) => ({
          componentId: identity.componentId,
          operation: `operation-${index}-${opIndex}`,
          data: { value: Math.random(), timestamp: Date.now() }
        }))
      )
      
      // Execute operations concurrently
      await Promise.allSettled(
        operations.map(op => this.simulateComponentOperation(op))
      )
      
      // Validate isolation after operations
      const postOperationViolations = await this.validateIsolation()
      violations.push(...postOperationViolations.filter(v => 
        v.componentIds.some(id => componentsTested.includes(id))
      ))
      
      // Cleanup test instances
      for (const identity of instances) {
        this.isolationManager.cleanupInstance(identity.componentId)
      }
      
      const duration = performance.now() - startTime
      
      return {
        testName,
        passed: violations.length === 0,
        violations,
        duration,
        componentsTested,
        details: {
          instanceCount,
          operationsPerInstance,
          totalOperations: operations.length
        }
      }
      
    } catch (error) {
      const duration = performance.now() - startTime
      
      return {
        testName,
        passed: false,
        violations: [{
          id: `stress-test-error-${++this.violationIdCounter}`,
          type: 'state_contamination',
          severity: 'high',
          componentIds: componentsTested,
          componentTypes: [componentType],
          description: `Stress test failed with error: ${error.message}`,
          evidence: { error: error.message, stack: error.stack },
          detectedAt: Date.now(),
          remediation: 'Investigate stress test failure and fix underlying issues'
        }],
        duration,
        componentsTested,
        details: { error: error.message }
      }
    }
  }
  
  /**
   * Test component isolation during concurrent state changes
   */
  async testConcurrentStateIsolation(
    componentType: string,
    concurrentUpdates: number = 50
  ): Promise<IsolationTestResult> {
    const testName = `Concurrent State Isolation: ${componentType}`
    const startTime = performance.now()
    const violations: IsolationViolation[] = []
    const componentsTested: string[] = []
    
    try {
      // Create two instances of the same component type
      const identity1 = this.isolationManager.createInstance(
        componentType,
        { initialValue: 0 },
        'test-client-1'
      )
      const identity2 = this.isolationManager.createInstance(
        componentType,
        { initialValue: 100 },
        'test-client-2'
      )
      
      componentsTested.push(identity1.componentId, identity2.componentId)
      
      // Register mock instances
      const instance1 = { value: 0, operations: [] }
      const instance2 = { value: 100, operations: [] }
      
      this.isolationManager.registerInstance(identity1.componentId, instance1)
      this.isolationManager.registerInstance(identity2.componentId, instance2)
      
      // Perform concurrent updates
      const updates = Array.from({ length: concurrentUpdates }, (_, i) => [
        {
          componentId: identity1.componentId,
          operation: () => {
            instance1.value += 1
            instance1.operations.push(`update-${i}`)
          }
        },
        {
          componentId: identity2.componentId,
          operation: () => {
            instance2.value += 10
            instance2.operations.push(`update-${i}`)
          }
        }
      ]).flat()
      
      // Execute all updates concurrently
      await Promise.allSettled(
        updates.map(update => Promise.resolve(update.operation()))
      )
      
      // Validate that states remained isolated
      const finalInstance1 = this.isolationManager.getInstance(identity1.componentId)
      const finalInstance2 = this.isolationManager.getInstance(identity2.componentId)
      
      if (finalInstance1.value === finalInstance2.value) {
        violations.push({
          id: `concurrent-contamination-${++this.violationIdCounter}`,
          type: 'state_contamination',
          severity: 'high',
          componentIds: [identity1.componentId, identity2.componentId],
          componentTypes: [componentType],
          description: 'Components have identical final values after concurrent updates',
          evidence: {
            value1: finalInstance1.value,
            value2: finalInstance2.value,
            operations1: finalInstance1.operations,
            operations2: finalInstance2.operations
          },
          detectedAt: Date.now(),
          remediation: 'Ensure state updates are properly isolated per component instance'
        })
      }
      
      // Check for cross-contamination in operations
      const sharedOperations = finalInstance1.operations.filter(op =>
        finalInstance2.operations.includes(op)
      )
      
      if (sharedOperations.length > 0) {
        violations.push({
          id: `operation-contamination-${++this.violationIdCounter}`,
          type: 'state_contamination',
          severity: 'medium',
          componentIds: [identity1.componentId, identity2.componentId],
          componentTypes: [componentType],
          description: 'Components share operation history',
          evidence: { sharedOperations },
          detectedAt: Date.now(),
          remediation: 'Ensure operation tracking is isolated per component instance'
        })
      }
      
      // Cleanup
      this.isolationManager.cleanupInstance(identity1.componentId)
      this.isolationManager.cleanupInstance(identity2.componentId)
      
      const duration = performance.now() - startTime
      
      return {
        testName,
        passed: violations.length === 0,
        violations,
        duration,
        componentsTested,
        details: {
          concurrentUpdates,
          finalValue1: finalInstance1.value,
          finalValue2: finalInstance2.value
        }
      }
      
    } catch (error) {
      const duration = performance.now() - startTime
      
      return {
        testName,
        passed: false,
        violations: [{
          id: `concurrent-test-error-${++this.violationIdCounter}`,
          type: 'state_contamination',
          severity: 'high',
          componentIds: componentsTested,
          componentTypes: [componentType],
          description: `Concurrent state test failed: ${error.message}`,
          evidence: { error: error.message },
          detectedAt: Date.now(),
          remediation: 'Fix concurrent state handling implementation'
        }],
        duration,
        componentsTested
      }
    }
  }
  
  /**
   * Get all detected violations
   */
  getAllViolations(): IsolationViolation[] {
    return Array.from(this.violations.values())
  }
  
  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity: ViolationSeverity): IsolationViolation[] {
    return this.getAllViolations().filter(v => v.severity === severity)
  }
  
  /**
   * Get violations by component
   */
  getViolationsByComponent(componentId: string): IsolationViolation[] {
    return this.getAllViolations().filter(v => v.componentIds.includes(componentId))
  }
  
  /**
   * Clear resolved violation
   */
  clearViolation(violationId: string): void {
    this.violations.delete(violationId)
  }
  
  /**
   * Update component state snapshot
   */
  updateStateSnapshot(componentId: string, state: any): void {
    this.stateSnapshots.set(componentId, {
      state: JSON.parse(JSON.stringify(state)),
      timestamp: Date.now()
    })
  }
  
  /**
   * Track event for isolation validation
   */
  trackEvent(componentId: string, event: string, data: any): void {
    if (!this.eventTracking.has(componentId)) {
      this.eventTracking.set(componentId, [])
    }
    
    const events = this.eventTracking.get(componentId)!
    events.push({
      event,
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(data))
    })
    
    // Keep only recent events (last 100)
    if (events.length > 100) {
      events.splice(0, events.length - 100)
    }
  }
  
  /**
   * Cleanup component tracking
   */
  cleanupComponent(componentId: string): void {
    this.stateSnapshots.delete(componentId)
    this.eventTracking.delete(componentId)
    
    // Remove violations for this component
    for (const [violationId, violation] of this.violations) {
      if (violation.componentIds.includes(componentId)) {
        this.violations.delete(violationId)
      }
    }
  }
  
  /**
   * Shutdown validator
   */
  shutdown(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval)
      this.validationInterval = null
    }
    
    this.violations.clear()
    this.stateSnapshots.clear()
    this.eventTracking.clear()
    
    this.logger.info('ComponentIsolationValidator shutdown complete')
  }
  
  /**
   * Start automatic validation
   */
  private startValidation(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval)
    }
    
    this.validationInterval = setInterval(() => {
      this.validateIsolation().catch(error => {
        this.logger.error('Automatic isolation validation failed:', error)
      })
    }, this.config.validationInterval)
    
    this.logger.info('Component isolation validation started', {
      interval: this.config.validationInterval
    })
  }
  
  /**
   * Validate ID uniqueness
   */
  private async validateIdUniqueness(): Promise<IsolationViolation[]> {
    const violations: IsolationViolation[] = []
    const allComponents = this.isolationManager.getAllComponents()
    const idMap = new Map<string, ComponentIdentity[]>()
    
    // Group components by ID
    for (const component of allComponents) {
      if (!idMap.has(component.componentId)) {
        idMap.set(component.componentId, [])
      }
      idMap.get(component.componentId)!.push(component)
    }
    
    // Check for duplicates
    for (const [componentId, components] of idMap) {
      if (components.length > 1) {
        violations.push({
          id: `id-collision-${++this.violationIdCounter}`,
          type: 'id_collision',
          severity: 'critical',
          componentIds: [componentId],
          componentTypes: components.map(c => c.componentType),
          description: `Multiple components share the same ID: ${componentId}`,
          evidence: {
            duplicateCount: components.length,
            components: components.map(c => ({
              type: c.componentType,
              createdAt: c.createdAt,
              clientId: c.clientId
            }))
          },
          detectedAt: Date.now(),
          remediation: 'Ensure component ID generation is truly unique'
        })
      }
    }
    
    return violations
  }
  
  /**
   * Validate state isolation between components
   */
  private async validateStateIsolation(): Promise<IsolationViolation[]> {
    const violations: IsolationViolation[] = []
    const componentsByType = new Map<string, ComponentIdentity[]>()
    
    // Group components by type
    const allComponents = this.isolationManager.getAllComponents()
    for (const component of allComponents) {
      if (!componentsByType.has(component.componentType)) {
        componentsByType.set(component.componentType, [])
      }
      componentsByType.get(component.componentType)!.push(component)
    }
    
    // Check state isolation between components of same type
    for (const [componentType, components] of componentsByType) {
      if (components.length > 1) {
        for (let i = 0; i < components.length; i++) {
          for (let j = i + 1; j < components.length; j++) {
            const comp1 = components[i]
            const comp2 = components[j]
            
            const instance1 = this.isolationManager.getInstance(comp1.componentId)
            const instance2 = this.isolationManager.getInstance(comp2.componentId)
            
            if (instance1 && instance2) {
              const similarity = this.calculateStateSimilarity(instance1, instance2)
              
              if (similarity > this.config.maxStateSimilarity) {
                violations.push({
                  id: `state-contamination-${++this.violationIdCounter}`,
                  type: 'state_contamination',
                  severity: similarity > 95 ? 'critical' : 'high',
                  componentIds: [comp1.componentId, comp2.componentId],
                  componentTypes: [componentType],
                  description: `Components of type ${componentType} have ${similarity}% state similarity`,
                  evidence: {
                    similarity,
                    state1: this.sanitizeForLogging(instance1),
                    state2: this.sanitizeForLogging(instance2)
                  },
                  detectedAt: Date.now(),
                  remediation: 'Ensure component instances maintain separate state'
                })
              }
            }
          }
        }
      }
    }
    
    return violations
  }
  
  /**
   * Validate event isolation
   */
  private async validateEventIsolation(): Promise<IsolationViolation[]> {
    const violations: IsolationViolation[] = []
    
    // Check for cross-component event contamination
    for (const [componentId1, events1] of this.eventTracking) {
      for (const [componentId2, events2] of this.eventTracking) {
        if (componentId1 !== componentId2) {
          const sharedEvents = events1.filter(e1 =>
            events2.some(e2 => 
              e1.event === e2.event && 
              JSON.stringify(e1.data) === JSON.stringify(e2.data) &&
              Math.abs(e1.timestamp - e2.timestamp) < 100 // Within 100ms
            )
          )
          
          if (sharedEvents.length > 0) {
            violations.push({
              id: `event-contamination-${++this.violationIdCounter}`,
              type: 'event_cross_contamination',
              severity: 'medium',
              componentIds: [componentId1, componentId2],
              componentTypes: ['unknown'],
              description: 'Components share identical events',
              evidence: { sharedEvents },
              detectedAt: Date.now(),
              remediation: 'Ensure events are properly scoped to individual components'
            })
          }
        }
      }
    }
    
    return violations
  }
  
  /**
   * Validate memory isolation
   */
  private async validateMemoryIsolation(): Promise<IsolationViolation[]> {
    const violations: IsolationViolation[] = []
    const allComponents = this.isolationManager.getAllComponents()
    
    console.log(`Validating memory isolation for ${allComponents.length} components`)
    
    // Check for shared object references between instances
    for (let i = 0; i < allComponents.length; i++) {
      for (let j = i + 1; j < allComponents.length; j++) {
        const comp1 = allComponents[i]
        const comp2 = allComponents[j]
        
        const instance1 = this.isolationManager.getInstance(comp1.componentId)
        const instance2 = this.isolationManager.getInstance(comp2.componentId)
        
        console.log(`Comparing ${comp1.componentId} vs ${comp2.componentId}:`, {
          hasInstance1: !!instance1,
          hasInstance2: !!instance2,
          sameReference: instance1 === instance2
        })
        
        if (instance1 && instance2 && instance1 === instance2) {
          console.log('Creating memory sharing violation')
          violations.push({
            id: `memory-sharing-${++this.violationIdCounter}`,
            type: 'memory_sharing',
            severity: 'critical',
            componentIds: [comp1.componentId, comp2.componentId],
            componentTypes: [comp1.componentType, comp2.componentType],
            description: 'Components share the same instance object in memory',
            evidence: {
              sharedReference: true,
              instanceType: typeof instance1
            },
            detectedAt: Date.now(),
            remediation: 'Ensure each component gets a separate instance object'
          })
        }
      }
    }
    
    console.log(`Memory validation found ${violations.length} violations`)
    return violations
  }
  
  /**
   * Validate WebSocket isolation
   */
  private async validateWebSocketIsolation(): Promise<IsolationViolation[]> {
    const violations: IsolationViolation[] = []
    
    // This would be implemented based on WebSocket tracking
    // For now, return empty array as placeholder
    
    return violations
  }
  
  /**
   * Validate parent-child isolation
   */
  private async validateParentChildIsolation(): Promise<IsolationViolation[]> {
    const violations: IsolationViolation[] = []
    const allComponents = this.isolationManager.getAllComponents()
    
    // Check for incorrect parent-child relationships
    for (const component of allComponents) {
      if (component.parentId) {
        const parent = this.isolationManager.getIdentity(component.parentId)
        if (!parent) {
          violations.push({
            id: `orphaned-child-${++this.violationIdCounter}`,
            type: 'parent_child_confusion',
            severity: 'high',
            componentIds: [component.componentId],
            componentTypes: [component.componentType],
            description: `Component references non-existent parent: ${component.parentId}`,
            evidence: { parentId: component.parentId },
            detectedAt: Date.now(),
            remediation: 'Fix parent-child relationship or clean up orphaned component'
          })
        } else if (!parent.childIds.has(component.componentId)) {
          violations.push({
            id: `parent-child-mismatch-${++this.violationIdCounter}`,
            type: 'parent_child_confusion',
            severity: 'medium',
            componentIds: [component.componentId, parent.componentId],
            componentTypes: [component.componentType, parent.componentType],
            description: 'Parent does not recognize child in its children set',
            evidence: {
              childId: component.componentId,
              parentChildren: Array.from(parent.childIds)
            },
            detectedAt: Date.now(),
            remediation: 'Fix parent-child relationship consistency'
          })
        }
      }
    }
    
    return violations
  }
  
  /**
   * Calculate state similarity between two objects
   */
  private calculateStateSimilarity(obj1: any, obj2: any): number {
    try {
      const str1 = JSON.stringify(obj1, Object.keys(obj1).sort())
      const str2 = JSON.stringify(obj2, Object.keys(obj2).sort())
      
      if (str1 === str2) return 100
      
      // Simple string similarity calculation
      const maxLen = Math.max(str1.length, str2.length)
      if (maxLen === 0) return 100
      
      let matches = 0
      const minLen = Math.min(str1.length, str2.length)
      
      for (let i = 0; i < minLen; i++) {
        if (str1[i] === str2[i]) matches++
      }
      
      return (matches / maxLen) * 100
    } catch (error) {
      return 0
    }
  }
  
  /**
   * Sanitize object for logging (remove circular references, etc.)
   */
  private sanitizeForLogging(obj: any): any {
    try {
      return JSON.parse(JSON.stringify(obj))
    } catch (error) {
      return { error: 'Could not serialize object for logging' }
    }
  }
  
  /**
   * Simulate component operation for testing
   */
  private async simulateComponentOperation(operation: any): Promise<void> {
    // Simulate some async operation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
    
    // Update component state
    const instance = this.isolationManager.getInstance(operation.componentId)
    if (instance) {
      instance[operation.operation] = operation.data
    }
  }
}