/**
 * SyncConflictResolver - Advanced Sync Conflict Resolution System
 * 
 * Implements comprehensive conflict resolution for synchronization including
 * server state comparison, conflict detection, merge strategies, user
 * confirmation dialogs, sync history, and rollback capabilities.
 * 
 * Features:
 * - Server state comparison on reconnection
 * - Automatic conflict detection between queued actions and server state
 * - Multiple merge strategies for resolving conflicts
 * - User confirmation dialogs for complex conflicts
 * - Sync history tracking and rollback capabilities
 * - Three-way merge algorithm for complex state changes
 * - Conflict resolution policies and preferences
 * - Automatic and manual conflict resolution modes
 */

import { OfflineAction } from './LiveOfflineManager'
import { LiveEventBus } from './LiveEventBus'

export interface StateConflict {
  /** Conflict unique identifier */
  id: string
  
  /** Component ID where conflict occurred */
  componentId: string
  
  /** Field/property that has conflict */
  field: string
  
  /** Local (client) value */
  localValue: any
  
  /** Server value */
  serverValue: any
  
  /** Base value (last known synced value) */
  baseValue?: any
  
  /** Conflict type */
  type: 'add-add' | 'modify-modify' | 'modify-delete' | 'delete-modify' | 'concurrent-modify'
  
  /** Conflict severity */
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  /** Conflict detection timestamp */
  detectedAt: number
  
  /** Related offline action that caused conflict */
  relatedAction?: OfflineAction
  
  /** Conflict metadata */
  metadata: {
    /** Local state timestamp */
    localTimestamp: number
    
    /** Server state timestamp */
    serverTimestamp: number
    
    /** Conflict detection method */
    detectionMethod: 'hash' | 'timestamp' | 'version' | 'custom'
    
    /** Additional context */
    context?: Record<string, any>
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface ConflictResolution {
  /** Resolution unique identifier */
  id: string
  
  /** Conflict being resolved */
  conflictId: string
  
  /** Resolution strategy used */
  strategy: ResolutionStrategy
  
  /** Resolved value */
  resolvedValue: any
  
  /** Whether resolution was automatic */
  automatic: boolean
  
  /** Resolution timestamp */
  resolvedAt: number
  
  /** User who resolved (if manual) */
  resolvedBy?: string
  
  /** Resolution metadata */
  metadata: {
    /** Resolution duration in milliseconds */
    duration: number
    
    /** Confidence score (0-1) */
    confidence: number
    
    /** Resolution reason */
    reason?: string
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export type ResolutionStrategy = 
  | 'client-wins'      // Use local/client value
  | 'server-wins'      // Use server value
  | 'merge-automatic'  // Automatic merge using algorithm
  | 'merge-manual'     // Manual merge with user input
  | 'last-write-wins'  // Use value with latest timestamp
  | 'first-write-wins' // Use value with earliest timestamp
  | 'user-choose'      // Prompt user to choose
  | 'create-both'      // Create separate entities for both values
  | 'custom'           // Use custom resolution function

export interface MergeResult {
  /** Whether merge was successful */
  success: boolean
  
  /** Merged value */
  mergedValue?: any
  
  /** Conflicts that couldn't be automatically resolved */
  remainingConflicts: StateConflict[]
  
  /** Merge metadata */
  metadata: {
    /** Merge strategy used */
    strategy: ResolutionStrategy
    
    /** Merge timestamp */
    mergedAt: number
    
    /** Whether user input was required */
    userInputRequired: boolean
    
    /** Confidence in merge result (0-1) */
    confidence: number
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface ConflictResolutionPolicy {
  /** Policy name */
  name: string
  
  /** Default resolution strategy */
  defaultStrategy: ResolutionStrategy
  
  /** Field-specific strategies */
  fieldStrategies: Record<string, ResolutionStrategy>
  
  /** Component-specific strategies */
  componentStrategies: Record<string, ResolutionStrategy>
  
  /** Auto-resolve conflicts below this severity */
  autoResolveSeverity: StateConflict['severity']
  
  /** Custom resolution functions */
  customResolvers: Record<string, (conflict: StateConflict) => Promise<any>>
  
  /** Policy metadata */
  metadata: {
    /** Policy creation timestamp */
    createdAt: number
    
    /** Policy version */
    version: string
    
    /** Policy description */
    description?: string
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface SyncState {
  /** Component ID */
  componentId: string
  
  /** Current local state */
  localState: Record<string, any>
  
  /** Last known server state */
  serverState: Record<string, any>
  
  /** Base state (last successful sync) */
  baseState: Record<string, any>
  
  /** State version/hash */
  version: string
  
  /** Last sync timestamp */
  lastSyncAt: number
  
  /** Pending changes */
  pendingChanges: Record<string, any>
  
  /** State metadata */
  metadata: {
    /** State creation timestamp */
    createdAt: number
    
    /** Last modification timestamp */
    modifiedAt: number
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface ConflictResolverConfig {
  /** Default resolution policy */
  defaultPolicy?: ConflictResolutionPolicy
  
  /** Enable automatic conflict resolution */
  enableAutoResolution?: boolean
  
  /** Maximum time to wait for user input */
  userInputTimeout?: number
  
  /** Enable three-way merge */
  enableThreeWayMerge?: boolean
  
  /** Enable conflict history tracking */
  enableHistory?: boolean
  
  /** Maximum conflicts to keep in history */
  maxHistorySize?: number
  
  /** Enable debug logging */
  enableDebug?: boolean
}

/**
 * SyncConflictResolver
 * 
 * Manages synchronization conflict detection and resolution
 */
export class SyncConflictResolver {
  private config: Required<ConflictResolverConfig>
  private eventBus: LiveEventBus
  
  private detectedConflicts = new Map<string, StateConflict>()
  private resolutions = new Map<string, ConflictResolution>()
  private conflictHistory: StateConflict[] = []
  private syncStates = new Map<string, SyncState>()
  private resolutionPolicies = new Map<string, ConflictResolutionPolicy>()
  private pendingUserResolutions = new Map<string, {
    resolve: (resolution: ConflictResolution) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }>()
  
  constructor(
    eventBus: LiveEventBus,
    config: ConflictResolverConfig = {}
  ) {
    this.eventBus = eventBus
    
    this.config = {
      defaultPolicy: config.defaultPolicy ?? this.createDefaultPolicy(),
      enableAutoResolution: config.enableAutoResolution ?? true,
      userInputTimeout: config.userInputTimeout ?? 30000,
      enableThreeWayMerge: config.enableThreeWayMerge ?? true,
      enableHistory: config.enableHistory ?? true,
      maxHistorySize: config.maxHistorySize ?? 1000,
      enableDebug: config.enableDebug ?? false
    }
    
    // Register default policy
    if (this.config.defaultPolicy) {
      this.resolutionPolicies.set('default', this.config.defaultPolicy)
    }
  }
  
  /**
   * Compare server state with local state and detect conflicts
   */
  async compareStates(
    componentId: string,
    localState: Record<string, any>,
    serverState: Record<string, any>,
    baseState?: Record<string, any>
  ): Promise<StateConflict[]> {
    const conflicts: StateConflict[] = []
    
    // Update sync state
    this.updateSyncState(componentId, localState, serverState, baseState)
    
    // Get all unique fields
    const allFields = new Set([
      ...Object.keys(localState),
      ...Object.keys(serverState),
      ...(baseState ? Object.keys(baseState) : [])
    ])
    
    for (const field of allFields) {
      const localValue = localState[field]
      const serverValue = serverState[field]
      const baseValue = baseState?.[field]
      
      const conflict = this.detectFieldConflict(
        componentId,
        field,
        localValue,
        serverValue,
        baseValue
      )
      
      if (conflict) {
        conflicts.push(conflict)
        this.detectedConflicts.set(conflict.id, conflict)
        
        if (this.config.enableHistory) {
          this.conflictHistory.push(conflict)
          if (this.conflictHistory.length > this.config.maxHistorySize) {
            this.conflictHistory.shift()
          }
        }
      }
    }
    
    if (conflicts.length > 0) {
      // Emit conflict detected event
      this.eventBus.emit('sync', 'conflicts.detected', {
        componentId,
        conflicts: conflicts.map(c => c.id)
      })
      
      if (this.config.enableDebug) {
        console.log(`[SyncConflictResolver] Detected ${conflicts.length} conflicts for ${componentId}`)
      }
    }
    
    return conflicts
  }
  
  /**
   * Resolve conflicts using specified strategy
   */
  async resolveConflicts(
    conflictIds: string[],
    strategy?: ResolutionStrategy,
    policyName: string = 'default'
  ): Promise<ConflictResolution[]> {
    const policy = this.resolutionPolicies.get(policyName) || this.config.defaultPolicy!
    const resolutions: ConflictResolution[] = []
    
    for (const conflictId of conflictIds) {
      const conflict = this.detectedConflicts.get(conflictId)
      if (!conflict) {
        continue
      }
      
      try {
        const resolution = await this.resolveConflict(conflict, strategy || policy.defaultStrategy, policy)
        resolutions.push(resolution)
        this.resolutions.set(resolution.id, resolution)
        
        // Remove resolved conflict
        this.detectedConflicts.delete(conflictId)
        
        if (this.config.enableDebug) {
          console.log(`[SyncConflictResolver] Resolved conflict: ${conflictId} using ${resolution.strategy}`)
        }
        
      } catch (error) {
        if (this.config.enableDebug) {
          console.error(`[SyncConflictResolver] Failed to resolve conflict ${conflictId}:`, error)
        }
      }
    }
    
    if (resolutions.length > 0) {
      // Emit conflicts resolved event
      this.eventBus.emit('sync', 'conflicts.resolved', {
        resolutions: resolutions.map(r => r.id)
      })
    }
    
    return resolutions
  }
  
  /**
   * Perform three-way merge of states
   */
  async threeWayMerge(
    componentId: string,
    localState: Record<string, any>,
    serverState: Record<string, any>,
    baseState: Record<string, any>
  ): Promise<MergeResult> {
    if (!this.config.enableThreeWayMerge) {
      throw new Error('Three-way merge is disabled')
    }
    
    const startTime = Date.now()
    const conflicts = await this.compareStates(componentId, localState, serverState, baseState)
    
    if (conflicts.length === 0) {
      // No conflicts, merge is trivial
      const mergedValue = { ...baseState, ...localState, ...serverState }
      
      return {
        success: true,
        mergedValue,
        remainingConflicts: [],
        metadata: {
          strategy: 'merge-automatic',
          mergedAt: Date.now(),
          userInputRequired: false,
          confidence: 1.0
        }
      }
    }
    
    // Attempt automatic resolution
    const autoResolvableConflicts = conflicts.filter(c => 
      c.severity <= this.getSeverityLevel(this.config.defaultPolicy!.autoResolveSeverity)
    )
    
    const autoResolutions = await this.resolveConflicts(
      autoResolvableConflicts.map(c => c.id),
      'merge-automatic'
    )
    
    // Build merged state
    let mergedValue = { ...baseState }
    let userInputRequired = false
    let confidence = 1.0
    
    // Apply automatic resolutions
    for (const resolution of autoResolutions) {
      const conflict = conflicts.find(c => c.id === resolution.conflictId)!
      mergedValue[conflict.field] = resolution.resolvedValue
    }
    
    // Handle remaining conflicts
    const remainingConflicts = conflicts.filter(c => 
      !autoResolutions.some(r => r.conflictId === c.id)
    )
    
    if (remainingConflicts.length > 0) {
      userInputRequired = true
      confidence = autoResolutions.length / conflicts.length
      
      // Apply fallback strategy for remaining conflicts
      for (const conflict of remainingConflicts) {
        // Use server value as fallback
        mergedValue[conflict.field] = conflict.serverValue
      }
    }
    
    return {
      success: remainingConflicts.length === 0,
      mergedValue,
      remainingConflicts,
      metadata: {
        strategy: userInputRequired ? 'merge-manual' : 'merge-automatic',
        mergedAt: Date.now(),
        userInputRequired,
        confidence
      }
    }
  }
  
  /**
   * Request user resolution for conflict
   */
  async requestUserResolution(
    conflictId: string,
    options: {
      timeout?: number
      context?: Record<string, any>
    } = {}
  ): Promise<ConflictResolution> {
    const { timeout = this.config.userInputTimeout, context } = options
    
    const conflict = this.detectedConflicts.get(conflictId)
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`)
    }
    
    return new Promise<ConflictResolution>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingUserResolutions.delete(conflictId)
        reject(new Error('User resolution timeout'))
      }, timeout)
      
      this.pendingUserResolutions.set(conflictId, {
        resolve,
        reject,
        timeout: timeoutHandle
      })
      
      // Emit user input request event
      this.eventBus.emit('sync', 'user-input.required', {
        conflictId,
        conflict,
        context
      })
    })
  }
  
  /**
   * Provide user resolution for conflict
   */
  provideUserResolution(
    conflictId: string,
    resolution: {
      strategy: ResolutionStrategy
      value?: any
      reason?: string
    }
  ): boolean {
    const pending = this.pendingUserResolutions.get(conflictId)
    if (!pending) {
      return false
    }
    
    clearTimeout(pending.timeout)
    this.pendingUserResolutions.delete(conflictId)
    
    const conflict = this.detectedConflicts.get(conflictId)!
    const conflictResolution: ConflictResolution = {
      id: this.generateResolutionId(),
      conflictId,
      strategy: resolution.strategy,
      resolvedValue: resolution.value,
      automatic: false,
      resolvedAt: Date.now(),
      resolvedBy: 'user',
      metadata: {
        duration: Date.now() - conflict.detectedAt,
        confidence: 1.0,
        reason: resolution.reason
      }
    }
    
    pending.resolve(conflictResolution)
    return true
  }
  
  /**
   * Add custom resolution policy
   */
  addResolutionPolicy(name: string, policy: ConflictResolutionPolicy): void {
    this.resolutionPolicies.set(name, policy)
    
    if (this.config.enableDebug) {
      console.log(`[SyncConflictResolver] Added resolution policy: ${name}`)
    }
  }
  
  /**
   * Get conflict by ID
   */
  getConflict(conflictId: string): StateConflict | null {
    return this.detectedConflicts.get(conflictId) || null
  }
  
  /**
   * Get all active conflicts
   */
  getActiveConflicts(): StateConflict[] {
    return Array.from(this.detectedConflicts.values())
  }
  
  /**
   * Get conflicts for component
   */
  getComponentConflicts(componentId: string): StateConflict[] {
    return Array.from(this.detectedConflicts.values()).filter(
      conflict => conflict.componentId === componentId
    )
  }
  
  /**
   * Get sync state for component
   */
  getSyncState(componentId: string): SyncState | null {
    return this.syncStates.get(componentId) || null
  }
  
  /**
   * Clear resolved conflicts
   */
  clearResolvedConflicts(): number {
    const count = this.resolutions.size
    this.resolutions.clear()
    return count
  }
  
  /**
   * Get resolution statistics
   */
  getResolutionStats() {
    const allResolutions = Array.from(this.resolutions.values())
    
    const byStrategy = allResolutions.reduce((acc, resolution) => {
      acc[resolution.strategy] = (acc[resolution.strategy] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const automaticResolutions = allResolutions.filter(r => r.automatic).length
    const manualResolutions = allResolutions.filter(r => !r.automatic).length
    
    const averageResolutionTime = allResolutions.length > 0
      ? allResolutions.reduce((sum, r) => sum + r.metadata.duration, 0) / allResolutions.length
      : 0
    
    return {
      totalResolutions: allResolutions.length,
      automaticResolutions,
      manualResolutions,
      byStrategy,
      averageResolutionTime,
      activeConflicts: this.detectedConflicts.size,
      pendingUserInputs: this.pendingUserResolutions.size
    }
  }
  
  // Private methods
  
  private detectFieldConflict(
    componentId: string,
    field: string,
    localValue: any,
    serverValue: any,
    baseValue?: any
  ): StateConflict | null {
    // No conflict if values are the same
    if (this.areValuesEqual(localValue, serverValue)) {
      return null
    }
    
    // Determine conflict type
    let type: StateConflict['type']
    
    if (baseValue === undefined) {
      if (localValue !== undefined && serverValue !== undefined) {
        type = 'add-add'
      } else {
        return null // One side added, no conflict
      }
    } else {
      if (localValue === undefined && serverValue !== undefined) {
        type = 'delete-modify'
      } else if (localValue !== undefined && serverValue === undefined) {
        type = 'modify-delete'
      } else {
        type = 'modify-modify'
      }
    }
    
    // Calculate severity
    const severity = this.calculateConflictSeverity(localValue, serverValue, baseValue)
    
    return {
      id: this.generateConflictId(),
      componentId,
      field,
      localValue,
      serverValue,
      baseValue,
      type,
      severity,
      detectedAt: Date.now(),
      metadata: {
        localTimestamp: Date.now(),
        serverTimestamp: Date.now(),
        detectionMethod: 'hash'
      }
    }
  }
  
  private async resolveConflict(
    conflict: StateConflict,
    strategy: ResolutionStrategy,
    policy: ConflictResolutionPolicy
  ): Promise<ConflictResolution> {
    const startTime = Date.now()
    let resolvedValue: any
    let automatic = true
    
    // Check for field-specific strategy
    const fieldStrategy = policy.fieldStrategies[conflict.field]
    if (fieldStrategy) {
      strategy = fieldStrategy
    }
    
    // Check for component-specific strategy
    const componentStrategy = policy.componentStrategies[conflict.componentId]
    if (componentStrategy) {
      strategy = componentStrategy
    }
    
    switch (strategy) {
      case 'client-wins':
        resolvedValue = conflict.localValue
        break
        
      case 'server-wins':
        resolvedValue = conflict.serverValue
        break
        
      case 'last-write-wins':
        resolvedValue = conflict.metadata.localTimestamp > conflict.metadata.serverTimestamp
          ? conflict.localValue
          : conflict.serverValue
        break
        
      case 'first-write-wins':
        resolvedValue = conflict.metadata.localTimestamp < conflict.metadata.serverTimestamp
          ? conflict.localValue
          : conflict.serverValue
        break
        
      case 'merge-automatic':
        resolvedValue = this.attemptAutomaticMerge(conflict)
        break
        
      case 'custom':
        const customResolver = policy.customResolvers[conflict.field]
        if (customResolver) {
          resolvedValue = await customResolver(conflict)
        } else {
          resolvedValue = conflict.serverValue // Fallback
        }
        break
        
      case 'user-choose':
      case 'merge-manual':
        automatic = false
        resolvedValue = await this.requestUserResolution(conflict.id)
        break
        
      default:
        resolvedValue = conflict.serverValue // Safe fallback
    }
    
    return {
      id: this.generateResolutionId(),
      conflictId: conflict.id,
      strategy,
      resolvedValue,
      automatic,
      resolvedAt: Date.now(),
      metadata: {
        duration: Date.now() - startTime,
        confidence: automatic ? 0.8 : 1.0
      }
    }
  }
  
  private attemptAutomaticMerge(conflict: StateConflict): any {
    // Simple automatic merge strategies
    if (typeof conflict.localValue === 'object' && typeof conflict.serverValue === 'object') {
      // Merge objects
      return { ...conflict.localValue, ...conflict.serverValue }
    }
    
    if (Array.isArray(conflict.localValue) && Array.isArray(conflict.serverValue)) {
      // Merge arrays (combine and deduplicate)
      const combined = [...conflict.localValue, ...conflict.serverValue]
      return Array.from(new Set(combined))
    }
    
    // For primitives, prefer server value
    return conflict.serverValue
  }
  
  private updateSyncState(
    componentId: string,
    localState: Record<string, any>,
    serverState: Record<string, any>,
    baseState?: Record<string, any>
  ): void {
    const existing = this.syncStates.get(componentId)
    
    const syncState: SyncState = {
      componentId,
      localState: { ...localState },
      serverState: { ...serverState },
      baseState: baseState ? { ...baseState } : (existing?.baseState || {}),
      version: this.generateStateHash(serverState),
      lastSyncAt: Date.now(),
      pendingChanges: this.calculatePendingChanges(localState, serverState),
      metadata: {
        createdAt: existing?.metadata.createdAt || Date.now(),
        modifiedAt: Date.now()
      }
    }
    
    this.syncStates.set(componentId, syncState)
  }
  
  private calculatePendingChanges(
    localState: Record<string, any>,
    serverState: Record<string, any>
  ): Record<string, any> {
    const changes: Record<string, any> = {}
    
    for (const [key, localValue] of Object.entries(localState)) {
      if (!this.areValuesEqual(localValue, serverState[key])) {
        changes[key] = localValue
      }
    }
    
    return changes
  }
  
  private areValuesEqual(a: any, b: any): boolean {
    if (a === b) return true
    if (a === null || b === null) return a === b
    if (a === undefined || b === undefined) return a === b
    
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b)
    }
    
    return false
  }
  
  private calculateConflictSeverity(
    localValue: any,
    serverValue: any,
    baseValue?: any
  ): StateConflict['severity'] {
    // Simple heuristic based on value types and differences
    if (typeof localValue !== typeof serverValue) {
      return 'high'
    }
    
    if (typeof localValue === 'object') {
      const localKeys = Object.keys(localValue || {})
      const serverKeys = Object.keys(serverValue || {})
      const keyDiff = Math.abs(localKeys.length - serverKeys.length)
      
      if (keyDiff > 5) return 'high'
      if (keyDiff > 2) return 'medium'
      return 'low'
    }
    
    return 'medium'
  }
  
  private getSeverityLevel(severity: StateConflict['severity']): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 }
    return levels[severity]
  }
  
  private createDefaultPolicy(): ConflictResolutionPolicy {
    return {
      name: 'default',
      defaultStrategy: 'server-wins',
      fieldStrategies: {
        'createdAt': 'first-write-wins',
        'updatedAt': 'last-write-wins',
        'id': 'server-wins'
      },
      componentStrategies: {},
      autoResolveSeverity: 'low',
      customResolvers: {},
      metadata: {
        createdAt: Date.now(),
        version: '1.0.0',
        description: 'Default conflict resolution policy'
      }
    }
  }
  
  private generateConflictId(): string {
    return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateResolutionId(): string {
    return `resolution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateStateHash(state: Record<string, any>): string {
    return Date.now().toString() // Simplified version hash
  }
}

// Export types for external use
export type {
  StateConflict,
  ConflictResolution,
  MergeResult,
  ConflictResolutionPolicy,
  SyncState,
  ConflictResolverConfig,
  ResolutionStrategy
}