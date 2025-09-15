/**
 * StateConflictResolver
 * 
 * Advanced state conflict resolution system for Zustand integration.
 * Handles conflicts between local and global state with configurable strategies,
 * user-defined resolution policies, and comprehensive debugging tools.
 * 
 * Features:
 * - Multiple conflict resolution strategies
 * - User-configurable policies
 * - Conflict detection and analysis
 * - Debug tools for identifying conflicts
 * - Automatic and manual resolution modes
 * - Conflict history and metrics
 */

import type { Logger } from '../types'

/**
 * Conflict resolution strategies
 */
export type ConflictStrategy = 
  | 'localWins'           // Local state takes precedence
  | 'globalWins'          // Global state takes precedence  
  | 'lastWriteWins'       // Most recent update wins
  | 'merge'               // Deep merge states
  | 'mergePriority'       // Merge with priority rules
  | 'manual'              // Require manual resolution
  | 'custom'              // Use custom resolver function

/**
 * Conflict severity levels
 */
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Conflict detection configuration
 */
export interface ConflictDetectionConfig {
  /** Enable conflict detection */
  enabled: boolean
  
  /** Keys to monitor for conflicts */
  monitorKeys: string[]
  
  /** Keys to ignore in conflict detection */
  ignoreKeys: string[]
  
  /** Minimum time between state changes to consider a conflict (ms) */
  conflictThreshold: number
  
  /** Deep comparison for nested objects */
  deepComparison: boolean
  
  /** Enable type checking in comparisons */
  strictTypeComparison: boolean
}

/**
 * State conflict information
 */
export interface StateConflict {
  /** Unique conflict identifier */
  id: string
  
  /** Component ID that has the conflict */
  componentId: string
  
  /** Local state value */
  localState: Record<string, any>
  
  /** Global state value */
  globalState: Record<string, any>
  
  /** Conflicting keys */
  conflictingKeys: string[]
  
  /** Conflict timestamps */
  timestamps: {
    localUpdate: number
    globalUpdate: number
    detected: number
  }
  
  /** Conflict severity */
  severity: ConflictSeverity
  
  /** Conflict metadata */
  metadata: {
    /** Source of local update */
    localSource: 'user' | 'optimistic' | 'server' | 'sync'
    
    /** Source of global update */
    globalSource: 'user' | 'optimistic' | 'server' | 'sync'
    
    /** Conflict type */
    type: 'value' | 'type' | 'structure' | 'reference'
    
    /** Additional context */
    context?: Record<string, any>
  }
  
  /** Resolution status */
  resolution: {
    status: 'pending' | 'resolved' | 'ignored' | 'failed'
    strategy?: ConflictStrategy
    resolvedAt?: number
    resolvedBy?: 'auto' | 'manual' | 'policy'
    resolvedState?: Record<string, any>
    error?: string
  }
}

/**
 * Resolution policy configuration
 */
export interface ResolutionPolicy {
  /** Policy name */
  name: string
  
  /** Policy description */
  description: string
  
  /** Default strategy for this policy */
  defaultStrategy: ConflictStrategy
  
  /** Key-specific strategies */
  keyStrategies: Record<string, ConflictStrategy>
  
  /** Component-specific strategies */
  componentStrategies: Record<string, ConflictStrategy>
  
  /** Severity-based strategies */
  severityStrategies: Record<ConflictSeverity, ConflictStrategy>
  
  /** Custom resolution conditions */
  conditions: Array<{
    name: string
    condition: (conflict: StateConflict) => boolean
    strategy: ConflictStrategy
    priority: number
  }>
  
  /** Priority merge rules for mergePriority strategy */
  mergePriority: {
    /** Keys that take priority from local state */
    localPriority: string[]
    
    /** Keys that take priority from global state */
    globalPriority: string[]
    
    /** Nested priority rules */
    nestedRules: Record<string, { localPriority: string[], globalPriority: string[] }>
  }
}

/**
 * Custom resolver function type
 */
export type CustomResolverFunction = (
  conflict: StateConflict,
  context: ResolverContext
) => Promise<Record<string, any>> | Record<string, any>

/**
 * Resolver context
 */
export interface ResolverContext {
  /** Component type */
  componentType: string
  
  /** Component metadata */
  componentMetadata: Record<string, any>
  
  /** Previous resolution for this component */
  previousResolutions: StateConflict[]
  
  /** Global state snapshot */
  globalSnapshot: Record<string, any>
  
  /** Local state history */
  localHistory: Array<{ state: Record<string, any>, timestamp: number }>
  
  /** User preferences */
  userPreferences?: Record<string, any>
}

/**
 * Conflict resolution configuration
 */
export interface ConflictResolverConfig {
  /** Detection configuration */
  detection: ConflictDetectionConfig
  
  /** Default resolution policy */
  defaultPolicy: ResolutionPolicy
  
  /** Named resolution policies */
  policies: Record<string, ResolutionPolicy>
  
  /** Custom resolver functions */
  customResolvers: Record<string, CustomResolverFunction>
  
  /** Maximum conflicts to track per component */
  maxConflictsPerComponent: number
  
  /** Maximum conflict history size */
  maxConflictHistory: number
  
  /** Enable automatic resolution */
  enableAutoResolution: boolean
  
  /** Auto-resolution timeout (ms) */
  autoResolutionTimeout: number
  
  /** Enable conflict warnings */
  enableWarnings: boolean
  
  /** Logger instance */
  logger?: Logger
}

/**
 * Conflict metrics
 */
export interface ConflictMetrics {
  /** Total conflicts detected */
  totalConflicts: number
  
  /** Conflicts by severity */
  conflictsBySeverity: Record<ConflictSeverity, number>
  
  /** Conflicts by strategy */
  conflictsByStrategy: Record<ConflictStrategy, number>
  
  /** Resolution success rate */
  resolutionSuccessRate: number
  
  /** Average resolution time */
  averageResolutionTime: number
  
  /** Most frequent conflict keys */
  frequentConflictKeys: Array<{ key: string, count: number }>
  
  /** Component conflict rates */
  componentConflictRates: Record<string, number>
  
  /** Last metrics update */
  lastUpdate: number
}

/**
 * State Conflict Resolver Class
 */
export class StateConflictResolver {
  private config: ConflictResolverConfig
  private conflicts = new Map<string, StateConflict[]>() // componentId -> conflicts
  private conflictHistory: StateConflict[] = []
  private metrics: ConflictMetrics
  private resolutionTimeouts = new Map<string, NodeJS.Timeout>()
  
  constructor(config: Partial<ConflictResolverConfig> = {}) {
    this.config = {
      detection: {
        enabled: true,
        monitorKeys: [],
        ignoreKeys: ['__internal', '_meta', 'timestamp'],
        conflictThreshold: 100,
        deepComparison: true,
        strictTypeComparison: false
      },
      defaultPolicy: this.createDefaultPolicy(),
      policies: {},
      customResolvers: {},
      maxConflictsPerComponent: 10,
      maxConflictHistory: 1000,
      enableAutoResolution: true,
      autoResolutionTimeout: 5000,
      enableWarnings: true,
      ...config
    }
    
    this.metrics = {
      totalConflicts: 0,
      conflictsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      conflictsByStrategy: {
        localWins: 0, globalWins: 0, lastWriteWins: 0, merge: 0,
        mergePriority: 0, manual: 0, custom: 0
      },
      resolutionSuccessRate: 1,
      averageResolutionTime: 0,
      frequentConflictKeys: [],
      componentConflictRates: {},
      lastUpdate: Date.now()
    }
  }
  
  /**
   * Detect conflicts between local and global state
   */
  detectConflict(
    componentId: string,
    localState: Record<string, any>,
    globalState: Record<string, any>,
    localTimestamp: number,
    globalTimestamp: number,
    metadata: Partial<StateConflict['metadata']> = {}
  ): StateConflict | null {
    if (!this.config.detection.enabled) return null
    
    const conflictingKeys = this.findConflictingKeys(localState, globalState)
    if (conflictingKeys.length === 0) return null
    
    // Check conflict threshold
    const timeDiff = Math.abs(localTimestamp - globalTimestamp)
    if (timeDiff > this.config.detection.conflictThreshold) return null
    
    const conflict: StateConflict = {
      id: `conflict_${componentId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      componentId,
      localState: { ...localState },
      globalState: { ...globalState },
      conflictingKeys,
      timestamps: {
        localUpdate: localTimestamp,
        globalUpdate: globalTimestamp,
        detected: Date.now()
      },
      severity: this.calculateConflictSeverity(conflictingKeys, localState, globalState),
      metadata: {
        localSource: 'user',
        globalSource: 'sync',
        type: 'value',
        ...metadata
      },
      resolution: {
        status: 'pending'
      }
    }
    
    // Add to conflicts
    if (!this.conflicts.has(componentId)) {
      this.conflicts.set(componentId, [])
    }
    
    const componentConflicts = this.conflicts.get(componentId)!
    componentConflicts.push(conflict)
    
    // Limit conflicts per component
    if (componentConflicts.length > this.config.maxConflictsPerComponent) {
      componentConflicts.shift()
    }
    
    // Add to history
    this.conflictHistory.push(conflict)
    if (this.conflictHistory.length > this.config.maxConflictHistory) {
      this.conflictHistory.shift()
    }
    
    // Update metrics
    this.updateMetrics(conflict)
    
    // Log conflict
    if (this.config.logger && this.config.enableWarnings) {
      this.config.logger.warn('State conflict detected', {
        componentId,
        conflictId: conflict.id,
        conflictingKeys,
        severity: conflict.severity
      })
    }
    
    // Schedule auto-resolution if enabled
    if (this.config.enableAutoResolution && conflict.severity !== 'critical') {
      this.scheduleAutoResolution(conflict)
    }
    
    return conflict
  }
  
  /**
   * Resolve a conflict using specified strategy
   */
  async resolveConflict(
    conflictId: string,
    strategy?: ConflictStrategy,
    customState?: Record<string, any>,
    resolverContext?: Partial<ResolverContext>
  ): Promise<Record<string, any> | null> {
    const conflict = this.findConflict(conflictId)
    if (!conflict || conflict.resolution.status !== 'pending') {
      return null
    }
    
    const startTime = Date.now()
    
    try {
      // Determine resolution strategy
      const resolveStrategy = strategy || this.getResolutionStrategy(conflict)
      
      // Cancel auto-resolution if scheduled
      const timeoutId = this.resolutionTimeouts.get(conflictId)
      if (timeoutId) {
        clearTimeout(timeoutId)
        this.resolutionTimeouts.delete(conflictId)
      }
      
      // Resolve based on strategy
      let resolvedState: Record<string, any>
      
      switch (resolveStrategy) {
        case 'localWins':
          resolvedState = conflict.localState
          break
          
        case 'globalWins':
          resolvedState = conflict.globalState
          break
          
        case 'lastWriteWins':
          resolvedState = conflict.timestamps.localUpdate > conflict.timestamps.globalUpdate
            ? conflict.localState
            : conflict.globalState
          break
          
        case 'merge':
          resolvedState = this.deepMerge(conflict.globalState, conflict.localState)
          break
          
        case 'mergePriority':
          resolvedState = this.priorityMerge(conflict, this.config.defaultPolicy.mergePriority)
          break
          
        case 'manual':
          if (!customState) {
            throw new Error('Manual resolution requires custom state')
          }
          resolvedState = customState
          break
          
        case 'custom':
          const resolverName = this.getCustomResolverName(conflict)
          const customResolver = this.config.customResolvers[resolverName]
          if (!customResolver) {
            throw new Error(`Custom resolver '${resolverName}' not found`)
          }
          
          const context: ResolverContext = {
            componentType: conflict.componentId.split('-')[0],
            componentMetadata: {},
            previousResolutions: this.getComponentConflicts(conflict.componentId)
              .filter(c => c.resolution.status === 'resolved'),
            globalSnapshot: conflict.globalState,
            localHistory: [],
            ...resolverContext
          }
          
          resolvedState = await customResolver(conflict, context)
          break
          
        default:
          throw new Error(`Unknown resolution strategy: ${resolveStrategy}`)
      }
      
      // Update conflict resolution
      conflict.resolution = {
        status: 'resolved',
        strategy: resolveStrategy,
        resolvedAt: Date.now(),
        resolvedBy: strategy ? 'manual' : 'auto',
        resolvedState: { ...resolvedState }
      }
      
      // Update metrics
      this.metrics.conflictsByStrategy[resolveStrategy]++
      const resolutionTime = Date.now() - startTime
      this.updateResolutionMetrics(resolutionTime, true)
      
      // Log resolution
      if (this.config.logger) {
        this.config.logger.info('Conflict resolved', {
          conflictId,
          strategy: resolveStrategy,
          resolutionTime,
          resolvedBy: conflict.resolution.resolvedBy
        })
      }
      
      return resolvedState
      
    } catch (error) {
      // Update conflict with error
      conflict.resolution = {
        status: 'failed',
        strategy: strategy,
        resolvedAt: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      }
      
      // Update metrics
      const resolutionTime = Date.now() - startTime
      this.updateResolutionMetrics(resolutionTime, false)
      
      // Log error
      if (this.config.logger) {
        this.config.logger.error('Conflict resolution failed', {
          conflictId,
          error: error instanceof Error ? error.message : String(error)
        })
      }
      
      throw error
    }
  }
  
  /**
   * Get conflicts for a component
   */
  getComponentConflicts(componentId: string): StateConflict[] {
    return this.conflicts.get(componentId) || []
  }
  
  /**
   * Get all pending conflicts
   */
  getPendingConflicts(componentId?: string): StateConflict[] {
    if (componentId) {
      return this.getComponentConflicts(componentId)
        .filter(c => c.resolution.status === 'pending')
    }
    
    return Array.from(this.conflicts.values())
      .flat()
      .filter(c => c.resolution.status === 'pending')
  }
  
  /**
   * Clear resolved conflicts for a component
   */
  clearResolvedConflicts(componentId: string): number {
    const componentConflicts = this.conflicts.get(componentId)
    if (!componentConflicts) return 0
    
    const initialLength = componentConflicts.length
    const pendingConflicts = componentConflicts.filter(c => c.resolution.status === 'pending')
    this.conflicts.set(componentId, pendingConflicts)
    
    return initialLength - pendingConflicts.length
  }
  
  /**
   * Get conflict metrics
   */
  getMetrics(): ConflictMetrics {
    return { ...this.metrics }
  }
  
  /**
   * Create or update a resolution policy
   */
  setResolutionPolicy(name: string, policy: ResolutionPolicy): void {
    this.config.policies[name] = { ...policy }
  }
  
  /**
   * Register a custom resolver
   */
  registerCustomResolver(name: string, resolver: CustomResolverFunction): void {
    this.config.customResolvers[name] = resolver
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<ConflictResolverConfig>): void {
    this.config = { ...this.config, ...config }
  }
  
  /**
   * Generate conflict analysis report
   */
  generateConflictReport(componentId?: string): {
    summary: {
      totalConflicts: number
      pendingConflicts: number
      resolvedConflicts: number
      failedResolutions: number
    }
    byComponent: Record<string, {
      conflicts: number
      mostFrequentKeys: string[]
      averageResolutionTime: number
    }>
    bySeverity: Record<ConflictSeverity, number>
    byStrategy: Record<ConflictStrategy, number>
    recommendations: string[]
  } {
    const conflicts = componentId 
      ? this.getComponentConflicts(componentId)
      : this.conflictHistory
    
    const pending = conflicts.filter(c => c.resolution.status === 'pending').length
    const resolved = conflicts.filter(c => c.resolution.status === 'resolved').length
    const failed = conflicts.filter(c => c.resolution.status === 'failed').length
    
    const byComponent: Record<string, any> = {}
    const bySeverity: Record<ConflictSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    const byStrategy: Record<ConflictStrategy, number> = {
      localWins: 0, globalWins: 0, lastWriteWins: 0, merge: 0,
      mergePriority: 0, manual: 0, custom: 0
    }
    
    conflicts.forEach(conflict => {
      // By component
      if (!byComponent[conflict.componentId]) {
        byComponent[conflict.componentId] = {
          conflicts: 0,
          keys: new Map<string, number>(),
          resolutionTimes: []
        }
      }
      byComponent[conflict.componentId].conflicts++
      conflict.conflictingKeys.forEach(key => {
        const keyCount = byComponent[conflict.componentId].keys.get(key) || 0
        byComponent[conflict.componentId].keys.set(key, keyCount + 1)
      })
      if (conflict.resolution.resolvedAt && conflict.timestamps.detected) {
        byComponent[conflict.componentId].resolutionTimes.push(
          conflict.resolution.resolvedAt - conflict.timestamps.detected
        )
      }
      
      // By severity
      bySeverity[conflict.severity]++
      
      // By strategy
      if (conflict.resolution.strategy) {
        byStrategy[conflict.resolution.strategy]++
      }
    })
    
    // Process component data
    Object.keys(byComponent).forEach(componentId => {
      const data = byComponent[componentId]
      data.mostFrequentKeys = Array.from(data.keys.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key]) => key)
      data.averageResolutionTime = data.resolutionTimes.length > 0
        ? data.resolutionTimes.reduce((a, b) => a + b, 0) / data.resolutionTimes.length
        : 0
      delete data.keys
      delete data.resolutionTimes
    })
    
    // Generate recommendations
    const recommendations: string[] = []
    if (pending > resolved * 0.2) {
      recommendations.push('High number of pending conflicts - consider enabling auto-resolution')
    }
    if (bySeverity.critical > 0) {
      recommendations.push('Critical conflicts detected - review conflict resolution policies')
    }
    if (failed > resolved * 0.1) {
      recommendations.push('High resolution failure rate - check custom resolvers and policies')
    }
    
    return {
      summary: {
        totalConflicts: conflicts.length,
        pendingConflicts: pending,
        resolvedConflicts: resolved,
        failedResolutions: failed
      },
      byComponent,
      bySeverity,
      byStrategy,
      recommendations
    }
  }
  
  /**
   * Shutdown resolver
   */
  shutdown(): void {
    // Clear all timeouts
    this.resolutionTimeouts.forEach(timeout => clearTimeout(timeout))
    this.resolutionTimeouts.clear()
    
    // Clear data
    this.conflicts.clear()
    this.conflictHistory = []
  }
  
  // Private methods
  
  private createDefaultPolicy(): ResolutionPolicy {
    return {
      name: 'default',
      description: 'Default resolution policy with balanced strategies',
      defaultStrategy: 'lastWriteWins',
      keyStrategies: {
        'id': 'globalWins',
        'createdAt': 'globalWins',
        'updatedAt': 'lastWriteWins',
        'version': 'globalWins'
      },
      componentStrategies: {},
      severityStrategies: {
        low: 'lastWriteWins',
        medium: 'merge',
        high: 'manual',
        critical: 'manual'
      },
      conditions: [],
      mergePriority: {
        localPriority: ['userPreferences', 'tempData'],
        globalPriority: ['id', 'version', 'metadata'],
        nestedRules: {}
      }
    }
  }
  
  private findConflictingKeys(
    localState: Record<string, any>,
    globalState: Record<string, any>
  ): string[] {
    const conflictingKeys: string[] = []
    const { monitorKeys, ignoreKeys, deepComparison, strictTypeComparison } = this.config.detection
    
    const keysToCheck = monitorKeys.length > 0 
      ? monitorKeys 
      : [...new Set([...Object.keys(localState), ...Object.keys(globalState)])]
    
    for (const key of keysToCheck) {
      if (ignoreKeys.includes(key)) continue
      
      const localValue = localState[key]
      const globalValue = globalState[key]
      
      if (this.valuesConflict(localValue, globalValue, deepComparison, strictTypeComparison)) {
        conflictingKeys.push(key)
      }
    }
    
    return conflictingKeys
  }
  
  private valuesConflict(
    localValue: any,
    globalValue: any,
    deepComparison: boolean,
    strictTypeComparison: boolean
  ): boolean {
    // Both undefined/null - no conflict
    if (localValue == null && globalValue == null) return false
    
    // One is undefined/null - conflict
    if (localValue == null || globalValue == null) return true
    
    // Type check
    if (strictTypeComparison && typeof localValue !== typeof globalValue) return true
    
    // Deep comparison for objects
    if (deepComparison && typeof localValue === 'object' && typeof globalValue === 'object') {
      return !this.deepEqual(localValue, globalValue)
    }
    
    // Simple equality
    return localValue !== globalValue
  }
  
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true
    
    if (obj1 == null || obj2 == null) return false
    
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2
    
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    
    if (keys1.length !== keys2.length) return false
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false
      if (!this.deepEqual(obj1[key], obj2[key])) return false
    }
    
    return true
  }
  
  private calculateConflictSeverity(
    conflictingKeys: string[],
    localState: Record<string, any>,
    globalState: Record<string, any>
  ): ConflictSeverity {
    // Critical keys that should never conflict
    const criticalKeys = ['id', 'version', 'type']
    if (conflictingKeys.some(key => criticalKeys.includes(key))) {
      return 'critical'
    }
    
    // High severity for many conflicting keys
    if (conflictingKeys.length > 5) {
      return 'high'
    }
    
    // Medium severity for important keys
    const importantKeys = ['status', 'state', 'data']
    if (conflictingKeys.some(key => importantKeys.includes(key))) {
      return 'medium'
    }
    
    return 'low'
  }
  
  private getResolutionStrategy(conflict: StateConflict): ConflictStrategy {
    const policy = this.config.defaultPolicy
    
    // Check severity-based strategy
    const severityStrategy = policy.severityStrategies[conflict.severity]
    if (severityStrategy) return severityStrategy
    
    // Check component-specific strategy
    const componentStrategy = policy.componentStrategies[conflict.componentId]
    if (componentStrategy) return componentStrategy
    
    // Check key-specific strategies
    for (const key of conflict.conflictingKeys) {
      const keyStrategy = policy.keyStrategies[key]
      if (keyStrategy) return keyStrategy
    }
    
    // Check conditions
    const matchingCondition = policy.conditions
      .sort((a, b) => b.priority - a.priority)
      .find(condition => condition.condition(conflict))
    
    if (matchingCondition) return matchingCondition.strategy
    
    return policy.defaultStrategy
  }
  
  private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const result = { ...target }
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
          result[key] = this.deepMerge(result[key], source[key])
        } else {
          result[key] = { ...source[key] }
        }
      } else {
        result[key] = source[key]
      }
    }
    
    return result
  }
  
  private priorityMerge(
    conflict: StateConflict,
    mergePriority: ResolutionPolicy['mergePriority']
  ): Record<string, any> {
    const result = { ...conflict.globalState }
    
    // Apply local priority keys
    for (const key of mergePriority.localPriority) {
      if (key in conflict.localState) {
        result[key] = conflict.localState[key]
      }
    }
    
    // Apply global priority keys (already in result from base copy)
    
    // Apply remaining keys with last-write-wins
    for (const key of conflict.conflictingKeys) {
      if (!mergePriority.localPriority.includes(key) && 
          !mergePriority.globalPriority.includes(key)) {
        result[key] = conflict.timestamps.localUpdate > conflict.timestamps.globalUpdate
          ? conflict.localState[key]
          : conflict.globalState[key]
      }
    }
    
    return result
  }
  
  private scheduleAutoResolution(conflict: StateConflict): void {
    const timeoutId = setTimeout(async () => {
      try {
        await this.resolveConflict(conflict.id)
      } catch (error) {
        if (this.config.logger) {
          this.config.logger.error('Auto-resolution failed', {
            conflictId: conflict.id,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }, this.config.autoResolutionTimeout)
    
    this.resolutionTimeouts.set(conflict.id, timeoutId)
  }
  
  private getCustomResolverName(conflict: StateConflict): string {
    // Default custom resolver naming convention
    return `${conflict.componentId.split('-')[0]}Resolver`
  }
  
  private findConflict(conflictId: string): StateConflict | undefined {
    for (const conflicts of this.conflicts.values()) {
      const conflict = conflicts.find(c => c.id === conflictId)
      if (conflict) return conflict
    }
    return undefined
  }
  
  private updateMetrics(conflict: StateConflict): void {
    this.metrics.totalConflicts++
    this.metrics.conflictsBySeverity[conflict.severity]++
    
    // Update component conflict rates
    if (!this.metrics.componentConflictRates[conflict.componentId]) {
      this.metrics.componentConflictRates[conflict.componentId] = 0
    }
    this.metrics.componentConflictRates[conflict.componentId]++
    
    // Update frequent conflict keys
    const keyCountMap = new Map<string, number>()
    this.conflictHistory.forEach(c => {
      c.conflictingKeys.forEach(key => {
        keyCountMap.set(key, (keyCountMap.get(key) || 0) + 1)
      })
    })
    
    this.metrics.frequentConflictKeys = Array.from(keyCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }))
    
    this.metrics.lastUpdate = Date.now()
  }
  
  private updateResolutionMetrics(resolutionTime: number, success: boolean): void {
    const totalResolutions = Object.values(this.metrics.conflictsByStrategy)
      .reduce((sum, count) => sum + count, 0)
    
    if (totalResolutions > 0) {
      this.metrics.averageResolutionTime = 
        (this.metrics.averageResolutionTime * (totalResolutions - 1) + resolutionTime) / totalResolutions
    } else {
      this.metrics.averageResolutionTime = resolutionTime
    }
    
    const successfulResolutions = this.conflictHistory
      .filter(c => c.resolution.status === 'resolved').length
    const totalAttempts = this.conflictHistory
      .filter(c => c.resolution.status !== 'pending').length
    
    this.metrics.resolutionSuccessRate = totalAttempts > 0 
      ? successfulResolutions / totalAttempts 
      : 1
  }
}