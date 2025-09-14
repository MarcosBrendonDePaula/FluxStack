/**
 * LiveComponentStateBridge
 * 
 * State synchronization system between client and server components.
 * Implements optimistic updates, conflict resolution, state persistence,
 * and real-time bidirectional state synchronization.
 */

import { ComponentIdentity } from './types'
import { WebSocketManager, WebSocketMessage } from './WebSocketManager'
import { ComponentIsolationManager } from './ComponentIsolationManager'
import { Logger } from '../utils/logger'

/**
 * State operation types
 */
export type StateOperation = 
  | 'set'
  | 'merge'
  | 'delete'
  | 'increment'
  | 'decrement'
  | 'push'
  | 'pop'
  | 'splice'

/**
 * State change descriptor
 */
export interface StateChange {
  id: string
  componentId: string
  operation: StateOperation
  path: string
  value: any
  previousValue?: any
  timestamp: number
  clientId: string
  version: number
  optimistic?: boolean
}

/**
 * State conflict resolution strategy
 */
export type ConflictStrategy = 
  | 'server_wins'
  | 'client_wins'
  | 'last_write_wins'
  | 'merge'
  | 'custom'

/**
 * State bridge configuration
 */
export interface StateBridgeConfig {
  /** Optimistic updates enabled */
  enableOptimisticUpdates: boolean
  
  /** Conflict resolution strategy */
  conflictStrategy: ConflictStrategy
  
  /** State persistence enabled */
  enablePersistence: boolean
  
  /** Debounce delay for state updates (ms) */
  debounceDelay: number
  
  /** Maximum state history size */
  maxHistorySize: number
  
  /** Enable state compression */
  enableCompression: boolean
  
  /** Sync timeout (ms) */
  syncTimeout: number
  
  /** Enable state validation */
  enableValidation: boolean
}

/**
 * State snapshot for persistence
 */
export interface StateSnapshot {
  componentId: string
  state: any
  version: number
  timestamp: number
  checksum: string
}

/**
 * Conflict resolution context
 */
export interface ConflictContext {
  localChange: StateChange
  remoteChange: StateChange
  currentState: any
  componentId: string
}

/**
 * State validator function
 */
export type StateValidator = (state: any, componentId: string) => boolean | string

/**
 * Conflict resolver function
 */
export type ConflictResolver = (context: ConflictContext) => StateChange

/**
 * State change listener
 */
export type StateChangeListener = (change: StateChange) => void

/**
 * LiveComponentStateBridge
 * 
 * Manages real-time state synchronization between client and server
 * components with advanced features like optimistic updates and
 * conflict resolution.
 */
export class LiveComponentStateBridge {
  private static instance: LiveComponentStateBridge
  
  /** WebSocket manager */
  private wsManager: WebSocketManager
  
  /** Component isolation manager */
  private isolationManager: ComponentIsolationManager
  
  /** Logger instance */
  private logger: Logger
  
  /** Configuration */
  private config: StateBridgeConfig
  
  /** Component state versions */
  private stateVersions = new Map<string, number>()
  
  /** Pending optimistic updates */
  private optimisticUpdates = new Map<string, StateChange[]>()
  
  /** State change history */
  private stateHistory = new Map<string, StateChange[]>()
  
  /** Debounced update timers */
  private debounceTimers = new Map<string, NodeJS.Timeout>()
  
  /** State validators */
  private validators = new Map<string, StateValidator>()
  
  /** Custom conflict resolvers */
  private conflictResolvers = new Map<string, ConflictResolver>()
  
  /** State change listeners */
  private changeListeners = new Set<StateChangeListener>()
  
  /** State snapshots for persistence */
  private snapshots = new Map<string, StateSnapshot>()
  
  constructor(
    wsManager: WebSocketManager,
    isolationManager: ComponentIsolationManager,
    config: Partial<StateBridgeConfig> = {},
    logger?: Logger
  ) {
    this.wsManager = wsManager
    this.isolationManager = isolationManager
    this.logger = logger || console as any
    
    this.config = {
      enableOptimisticUpdates: true,
      conflictStrategy: 'last_write_wins',
      enablePersistence: false,
      debounceDelay: 100,
      maxHistorySize: 50,
      enableCompression: false,
      syncTimeout: 5000,
      enableValidation: false,
      ...config
    }
    
    this.setupWebSocketHandlers()
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(
    wsManager?: WebSocketManager,
    isolationManager?: ComponentIsolationManager,
    config?: Partial<StateBridgeConfig>,
    logger?: Logger
  ): LiveComponentStateBridge {
    if (!LiveComponentStateBridge.instance && wsManager && isolationManager) {
      LiveComponentStateBridge.instance = new LiveComponentStateBridge(
        wsManager,
        isolationManager,
        config,
        logger
      )
    }
    return LiveComponentStateBridge.instance
  }
  
  /**
   * Setup WebSocket message handlers
   */
  private setupWebSocketHandlers(): void {
    this.wsManager.onMessage('state_update', (message) => {
      this.handleRemoteStateUpdate(message)
    })
    
    this.wsManager.onMessage('state_sync_response', (message) => {
      this.handleStateSyncResponse(message)
    })
    
    this.wsManager.onMessage('state_conflict', (message) => {
      this.handleStateConflict(message)
    })
  }
  
  /**
   * Update component state
   */
  async updateState(
    componentId: string,
    operation: StateOperation,
    path: string,
    value: any,
    optimistic = true
  ): Promise<void> {
    const change = this.createStateChange(componentId, operation, path, value, optimistic)
    
    // Validate state change if validation is enabled
    if (this.config.enableValidation && !this.validateStateChange(change)) {
      throw new Error(`Invalid state change for component ${componentId}`)
    }
    
    // Apply optimistic update locally
    if (this.config.enableOptimisticUpdates && optimistic) {
      this.applyOptimisticUpdate(change)
    }
    
    // Debounce state updates to reduce network traffic
    if (this.config.debounceDelay > 0) {
      this.debounceStateUpdate(change)
    } else {
      await this.sendStateUpdate(change)
    }
  }
  
  /**
   * Get component state
   */
  getState(componentId: string): any {
    const instance = this.isolationManager.getInstance(componentId)
    return instance ? instance.state : null
  }
  
  /**
   * Set complete component state
   */
  async setState(componentId: string, state: any, optimistic = true): Promise<void> {
    await this.updateState(componentId, 'set', '', state, optimistic)
  }
  
  /**
   * Merge state with existing state
   */
  async mergeState(componentId: string, partialState: any, optimistic = true): Promise<void> {
    await this.updateState(componentId, 'merge', '', partialState, optimistic)
  }
  
  /**
   * Sync component state with server
   */
  async syncState(componentId: string): Promise<any> {
    const currentVersion = this.stateVersions.get(componentId) || 0
    
    return this.wsManager.send({
      type: 'sync_request',
      componentId,
      payload: {
        currentVersion,
        requestId: this.generateRequestId()
      }
    })
  }
  
  /**
   * Create state change descriptor
   */
  private createStateChange(
    componentId: string,
    operation: StateOperation,
    path: string,
    value: any,
    optimistic: boolean
  ): StateChange {
    const currentVersion = this.stateVersions.get(componentId) || 0
    const newVersion = currentVersion + 1
    
    return {
      id: this.generateChangeId(),
      componentId,
      operation,
      path,
      value,
      timestamp: Date.now(),
      clientId: this.getClientId(),
      version: newVersion,
      optimistic
    }
  }
  
  /**
   * Apply optimistic update locally
   */
  private applyOptimisticUpdate(change: StateChange): void {
    // Store optimistic update
    if (!this.optimisticUpdates.has(change.componentId)) {
      this.optimisticUpdates.set(change.componentId, [])
    }
    this.optimisticUpdates.get(change.componentId)!.push(change)
    
    // Apply to local state
    this.applyStateChange(change)
    
    // Add to history
    this.addToHistory(change)
    
    // Notify listeners
    this.notifyListeners(change)
  }
  
  /**
   * Apply state change to component
   */
  private applyStateChange(change: StateChange): void {
    const instance = this.isolationManager.getInstance(change.componentId)
    if (!instance || !instance.state) return
    
    const { operation, path, value } = change
    
    try {
      switch (operation) {
        case 'set':
          if (path === '') {
            instance.state = value
          } else {
            this.setNestedValue(instance.state, path, value)
          }
          break
          
        case 'merge':
          if (typeof value === 'object' && value !== null) {
            Object.assign(instance.state, value)
          }
          break
          
        case 'delete':
          this.deleteNestedValue(instance.state, path)
          break
          
        case 'increment':
          const currentIncValue = this.getNestedValue(instance.state, path) || 0
          this.setNestedValue(instance.state, path, currentIncValue + (value || 1))
          break
          
        case 'decrement':
          const currentDecValue = this.getNestedValue(instance.state, path) || 0
          this.setNestedValue(instance.state, path, currentDecValue - (value || 1))
          break
          
        case 'push':
          const array = this.getNestedValue(instance.state, path)
          if (Array.isArray(array)) {
            array.push(value)
          }
          break
          
        case 'pop':
          const popArray = this.getNestedValue(instance.state, path)
          if (Array.isArray(popArray)) {
            popArray.pop()
          }
          break
          
        case 'splice':
          const spliceArray = this.getNestedValue(instance.state, path)
          if (Array.isArray(spliceArray) && Array.isArray(value)) {
            spliceArray.splice(...value)
          }
          break
      }
      
      // Update state version
      this.stateVersions.set(change.componentId, change.version)
      
    } catch (error) {
      this.logger.error('Failed to apply state change:', error, { change })
    }
  }
  
  /**
   * Debounce state update
   */
  private debounceStateUpdate(change: StateChange): void {
    const timerId = `${change.componentId}_${change.path}`
    
    // Clear existing timer
    if (this.debounceTimers.has(timerId)) {
      clearTimeout(this.debounceTimers.get(timerId)!)
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.sendStateUpdate(change)
      this.debounceTimers.delete(timerId)
    }, this.config.debounceDelay)
    
    this.debounceTimers.set(timerId, timer)
  }
  
  /**
   * Send state update to server
   */
  private async sendStateUpdate(change: StateChange): Promise<void> {
    try {
      await this.wsManager.send({
        type: 'state_update',
        componentId: change.componentId,
        payload: change
      })
      
      this.logger.debug('State update sent', { componentId: change.componentId, operation: change.operation })
      
    } catch (error) {
      this.logger.error('Failed to send state update:', error)
      
      // Revert optimistic update on failure
      if (change.optimistic) {
        this.revertOptimisticUpdate(change)
      }
    }
  }
  
  /**
   * Handle remote state update
   */
  private handleRemoteStateUpdate(message: WebSocketMessage): void {
    const change = message.payload as StateChange
    
    // Confirm optimistic update or apply new change
    if (this.isOptimisticUpdateConfirmation(change)) {
      this.confirmOptimisticUpdate(change)
    } else {
      // Check for conflicts
      const conflict = this.detectConflict(change)
      if (conflict) {
        this.resolveConflict(conflict, change)
      } else {
        this.applyRemoteStateChange(change)
      }
    }
  }
  
  /**
   * Apply remote state change
   */
  private applyRemoteStateChange(change: StateChange): void {
    // Store previous value for rollback
    const instance = this.isolationManager.getInstance(change.componentId)
    if (instance) {
      change.previousValue = this.getNestedValue(instance.state, change.path)
    }
    
    this.applyStateChange(change)
    this.addToHistory(change)
    this.notifyListeners(change)
    
    this.logger.debug('Remote state change applied', {
      componentId: change.componentId,
      operation: change.operation
    })
  }
  
  /**
   * Detect state conflicts
   */
  private detectConflict(remoteChange: StateChange): StateChange | null {
    const optimisticUpdates = this.optimisticUpdates.get(remoteChange.componentId)
    if (!optimisticUpdates) return null
    
    return optimisticUpdates.find(update => 
      update.path === remoteChange.path && 
      update.timestamp > remoteChange.timestamp - 1000 // 1 second tolerance
    ) || null
  }
  
  /**
   * Resolve state conflict
   */
  private resolveConflict(localChange: StateChange, remoteChange: StateChange): void {
    const context: ConflictContext = {
      localChange,
      remoteChange,
      currentState: this.getState(localChange.componentId),
      componentId: localChange.componentId
    }
    
    let resolvedChange: StateChange
    
    // Use custom resolver if available
    const customResolver = this.conflictResolvers.get(localChange.componentId)
    if (customResolver) {
      resolvedChange = customResolver(context)
    } else {
      resolvedChange = this.applyConflictStrategy(context)
    }
    
    this.applyStateChange(resolvedChange)
    this.addToHistory(resolvedChange)
    this.notifyListeners(resolvedChange)
    
    this.logger.info('State conflict resolved', {
      componentId: localChange.componentId,
      strategy: this.config.conflictStrategy
    })
  }
  
  /**
   * Apply configured conflict resolution strategy
   */
  private applyConflictStrategy(context: ConflictContext): StateChange {
    switch (this.config.conflictStrategy) {
      case 'server_wins':
        return context.remoteChange
        
      case 'client_wins':
        return context.localChange
        
      case 'last_write_wins':
        return context.localChange.timestamp > context.remoteChange.timestamp
          ? context.localChange
          : context.remoteChange
          
      case 'merge':
        return this.mergeStateChanges(context.localChange, context.remoteChange)
        
      default:
        return context.remoteChange
    }
  }
  
  /**
   * Merge conflicting state changes
   */
  private mergeStateChanges(local: StateChange, remote: StateChange): StateChange {
    // Simple merge strategy - combine values if possible
    if (local.operation === 'merge' && remote.operation === 'merge') {
      return {
        ...local,
        value: { ...remote.value, ...local.value },
        version: Math.max(local.version, remote.version)
      }
    }
    
    // Default to remote change for complex merges
    return remote
  }
  
  /**
   * Check if remote update confirms optimistic update
   */
  private isOptimisticUpdateConfirmation(remoteChange: StateChange): boolean {
    const optimisticUpdates = this.optimisticUpdates.get(remoteChange.componentId)
    if (!optimisticUpdates) return false
    
    return optimisticUpdates.some(update => 
      update.id === remoteChange.id ||
      (update.path === remoteChange.path && 
       update.operation === remoteChange.operation &&
       JSON.stringify(update.value) === JSON.stringify(remoteChange.value))
    )
  }
  
  /**
   * Confirm optimistic update
   */
  private confirmOptimisticUpdate(remoteChange: StateChange): void {
    const optimisticUpdates = this.optimisticUpdates.get(remoteChange.componentId)
    if (!optimisticUpdates) return
    
    const index = optimisticUpdates.findIndex(update => 
      update.id === remoteChange.id ||
      (update.path === remoteChange.path && 
       update.operation === remoteChange.operation)
    )
    
    if (index >= 0) {
      optimisticUpdates.splice(index, 1)
      if (optimisticUpdates.length === 0) {
        this.optimisticUpdates.delete(remoteChange.componentId)
      }
    }
    
    // Update version from server
    this.stateVersions.set(remoteChange.componentId, remoteChange.version)
    
    this.logger.debug('Optimistic update confirmed', {
      componentId: remoteChange.componentId
    })
  }
  
  /**
   * Revert optimistic update
   */
  private revertOptimisticUpdate(change: StateChange): void {
    if (change.previousValue !== undefined) {
      const revertChange: StateChange = {
        ...change,
        value: change.previousValue,
        operation: 'set',
        optimistic: false
      }
      
      this.applyStateChange(revertChange)
      this.notifyListeners(revertChange)
    }
    
    // Remove from optimistic updates
    const optimisticUpdates = this.optimisticUpdates.get(change.componentId)
    if (optimisticUpdates) {
      const index = optimisticUpdates.findIndex(update => update.id === change.id)
      if (index >= 0) {
        optimisticUpdates.splice(index, 1)
      }
    }
  }
  
  /**
   * Handle state sync response
   */
  private handleStateSyncResponse(message: WebSocketMessage): void {
    const { componentId, state, version } = message.payload
    
    // Clear optimistic updates for this component
    this.optimisticUpdates.delete(componentId)
    
    // Update local state
    const instance = this.isolationManager.getInstance(componentId)
    if (instance) {
      instance.state = state
      this.stateVersions.set(componentId, version)
    }
    
    this.logger.debug('State synchronized', { componentId, version })
  }
  
  /**
   * Handle state conflict from server
   */
  private handleStateConflict(message: WebSocketMessage): void {
    const { componentId, conflicts } = message.payload
    
    conflicts.forEach((conflictData: any) => {
      const localChange = conflictData.localChange
      const remoteChange = conflictData.remoteChange
      
      this.resolveConflict(localChange, remoteChange)
    })
  }
  
  /**
   * Validate state change
   */
  private validateStateChange(change: StateChange): boolean {
    const validator = this.validators.get(change.componentId)
    if (!validator) return true
    
    const result = validator(change.value, change.componentId)
    return typeof result === 'boolean' ? result : false
  }
  
  /**
   * Add change to history
   */
  private addToHistory(change: StateChange): void {
    if (!this.stateHistory.has(change.componentId)) {
      this.stateHistory.set(change.componentId, [])
    }
    
    const history = this.stateHistory.get(change.componentId)!
    history.push(change)
    
    // Limit history size
    if (history.length > this.config.maxHistorySize) {
      history.shift()
    }
  }
  
  /**
   * Notify state change listeners
   */
  private notifyListeners(change: StateChange): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(change)
      } catch (error) {
        this.logger.error('State change listener error:', error)
      }
    })
  }
  
  /**
   * Helper methods for nested object operations
   */
  private getNestedValue(obj: any, path: string): any {
    if (path === '') return obj
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  private setNestedValue(obj: any, path: string, value: any): void {
    if (path === '') return
    
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {}
      return current[key]
    }, obj)
    
    target[lastKey] = value
  }
  
  private deleteNestedValue(obj: any, path: string): void {
    if (path === '') return
    
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => current?.[key], obj)
    
    if (target) delete target[lastKey]
  }
  
  /**
   * Utility methods
   */
  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private getClientId(): string {
    return `client_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Public API methods
   */
  
  /**
   * Register state validator for component
   */
  registerValidator(componentId: string, validator: StateValidator): void {
    this.validators.set(componentId, validator)
  }
  
  /**
   * Register custom conflict resolver
   */
  registerConflictResolver(componentId: string, resolver: ConflictResolver): void {
    this.conflictResolvers.set(componentId, resolver)
  }
  
  /**
   * Add state change listener
   */
  onStateChange(listener: StateChangeListener): () => void {
    this.changeListeners.add(listener)
    
    return () => {
      this.changeListeners.delete(listener)
    }
  }
  
  /**
   * Get state history for component
   */
  getStateHistory(componentId: string): StateChange[] {
    return [...(this.stateHistory.get(componentId) || [])]
  }
  
  /**
   * Clear state history for component
   */
  clearHistory(componentId: string): void {
    this.stateHistory.delete(componentId)
  }
  
  /**
   * Create state snapshot for persistence
   */
  createSnapshot(componentId: string): StateSnapshot | null {
    const instance = this.isolationManager.getInstance(componentId)
    if (!instance) return null
    
    const snapshot: StateSnapshot = {
      componentId,
      state: JSON.parse(JSON.stringify(instance.state)),
      version: this.stateVersions.get(componentId) || 0,
      timestamp: Date.now(),
      checksum: this.calculateChecksum(instance.state)
    }
    
    if (this.config.enablePersistence) {
      this.snapshots.set(componentId, snapshot)
    }
    
    return snapshot
  }
  
  /**
   * Restore from snapshot
   */
  restoreFromSnapshot(snapshot: StateSnapshot): void {
    const instance = this.isolationManager.getInstance(snapshot.componentId)
    if (!instance) return
    
    // Verify checksum
    if (this.calculateChecksum(snapshot.state) !== snapshot.checksum) {
      this.logger.warn('Snapshot checksum mismatch', { componentId: snapshot.componentId })
      return
    }
    
    instance.state = snapshot.state
    this.stateVersions.set(snapshot.componentId, snapshot.version)
    
    this.logger.debug('State restored from snapshot', {
      componentId: snapshot.componentId,
      version: snapshot.version
    })
  }
  
  /**
   * Calculate simple checksum for state
   */
  private calculateChecksum(state: any): string {
    const str = JSON.stringify(state)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
  
  /**
   * Shutdown state bridge
   */
  shutdown(): void {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
    
    // Clear all data
    this.stateVersions.clear()
    this.optimisticUpdates.clear()
    this.stateHistory.clear()
    this.validators.clear()
    this.conflictResolvers.clear()
    this.changeListeners.clear()
    this.snapshots.clear()
    
    this.logger.info('LiveComponentStateBridge shutdown complete')
  }
}