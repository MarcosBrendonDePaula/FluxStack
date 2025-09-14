/**
 * OptimisticUpdateManager
 * 
 * System for handling optimistic updates with rollback mechanisms,
 * offline queueing, visual indicators, and configurable behavior.
 * 
 * Part of Task 2.2: Implement Optimistic Updates System
 */

import { RequestTracker, UpdateRequest } from './RequestTracker'
import { Logger } from '../utils/logger'

/**
 * Optimistic update state
 */
export type OptimisticState = 
  | 'pending'      // Update applied optimistically, waiting for server confirmation
  | 'confirmed'    // Server confirmed the update
  | 'failed'       // Server rejected the update
  | 'rolled_back'  // Update was rolled back due to failure
  | 'conflicted'   // Update conflicts with server state

/**
 * Optimistic update descriptor
 */
export interface OptimisticUpdate {
  /** Unique update ID */
  id: string
  
  /** Request ID from RequestTracker */
  requestId: string
  
  /** Component ID */
  componentId: string
  
  /** Update operation */
  operation: string
  
  /** Update payload */
  payload: any
  
  /** Current state */
  state: OptimisticState
  
  /** Timestamp when update was applied */
  timestamp: number
  
  /** Original state before optimistic update */
  originalState: any
  
  /** Optimistic state after update */
  optimisticState: any
  
  /** Server confirmed state (if available) */
  serverState?: any
  
  /** Visual indicator configuration */
  visualIndicator?: VisualIndicator
  
  /** Rollback function */
  rollbackFn?: () => void | Promise<void>
  
  /** Confirmation callbacks */
  onConfirmed?: (update: OptimisticUpdate) => void
  onFailed?: (update: OptimisticUpdate, error: Error) => void
  onRolledBack?: (update: OptimisticUpdate) => void
}

/**
 * Visual indicator for optimistic updates
 */
export interface VisualIndicator {
  /** Show loading spinner */
  showSpinner: boolean
  
  /** Apply pending styles */
  applyPendingStyles: boolean
  
  /** Custom CSS classes */
  customClasses: string[]
  
  /** Pending text/label */
  pendingText?: string
  
  /** Show progress bar */
  showProgress: boolean
  
  /** Custom indicator element */
  customElement?: HTMLElement
}

/**
 * Optimistic update configuration
 */
export interface OptimisticUpdateConfig {
  /** Enable optimistic updates globally */
  enabled: boolean
  
  /** Default timeout for optimistic updates */
  defaultTimeout: number
  
  /** Maximum pending optimistic updates per component */
  maxPendingUpdates: number
  
  /** Enable automatic rollback on failure */
  enableAutoRollback: boolean
  
  /** Show visual indicators by default */
  showVisualIndicators: boolean
  
  /** Enable offline queueing */
  enableOfflineQueue: boolean
  
  /** Maximum offline queue size */
  maxOfflineQueueSize: number
  
  /** Retry failed updates automatically */
  autoRetryFailed: boolean
  
  /** Maximum retry attempts */
  maxRetryAttempts: number
  
  /** Default visual indicator settings */
  defaultVisualIndicator: Partial<VisualIndicator>
}

/**
 * Offline update queue item
 */
export interface OfflineUpdate {
  /** Update descriptor */
  update: OptimisticUpdate
  
  /** Number of retry attempts */
  retryCount: number
  
  /** Next retry timestamp */
  nextRetry: number
  
  /** Priority (higher number = higher priority) */
  priority: number
}

/**
 * OptimisticUpdateManager
 * 
 * Manages optimistic updates with rollback, offline support,
 * and visual feedback for better user experience.
 */
export class OptimisticUpdateManager {
  private static instance: OptimisticUpdateManager
  
  /** Configuration */
  private config: OptimisticUpdateConfig
  
  /** Logger instance */
  private logger: Logger
  
  /** Request tracker instance */
  private requestTracker: RequestTracker
  
  /** Active optimistic updates */
  private optimisticUpdates = new Map<string, OptimisticUpdate>()
  
  /** Updates by component for fast lookup */
  private componentUpdates = new Map<string, Set<string>>()
  
  /** Offline update queue */
  private offlineQueue: OfflineUpdate[] = []
  
  /** Visual indicator elements */
  private visualElements = new Map<string, HTMLElement[]>()
  
  /** Update timeout handles */
  private timeoutHandles = new Map<string, NodeJS.Timeout>()
  
  /** Network status */
  private isOnline = true
  
  /** State change listeners */
  private stateChangeListeners = new Set<(update: OptimisticUpdate) => void>()
  
  constructor(
    requestTracker: RequestTracker,
    config: Partial<OptimisticUpdateConfig> = {},
    logger?: Logger
  ) {
    this.requestTracker = requestTracker
    this.logger = logger || console as any
    
    this.config = {
      enabled: true,
      defaultTimeout: 10000, // 10 seconds
      maxPendingUpdates: 20,
      enableAutoRollback: true,
      showVisualIndicators: true,
      enableOfflineQueue: true,
      maxOfflineQueueSize: 100,
      autoRetryFailed: true,
      maxRetryAttempts: 3,
      defaultVisualIndicator: {
        showSpinner: true,
        applyPendingStyles: true,
        customClasses: ['optimistic-pending'],
        showProgress: false
      },
      ...config
    }
    
    this.setupNetworkMonitoring()
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(
    requestTracker?: RequestTracker,
    config?: Partial<OptimisticUpdateConfig>,
    logger?: Logger
  ): OptimisticUpdateManager {
    if (!OptimisticUpdateManager.instance && requestTracker) {
      OptimisticUpdateManager.instance = new OptimisticUpdateManager(
        requestTracker,
        config,
        logger
      )
    }
    return OptimisticUpdateManager.instance
  }
  
  /**
   * Apply optimistic update
   */
  async applyOptimisticUpdate(
    componentId: string,
    operation: string,
    payload: any,
    originalState: any,
    options: {
      timeout?: number
      visualIndicator?: Partial<VisualIndicator>
      onConfirmed?: (update: OptimisticUpdate) => void
      onFailed?: (update: OptimisticUpdate, error: Error) => void
      rollbackFn?: () => void | Promise<void>
    } = {}
  ): Promise<OptimisticUpdate> {
    if (!this.config.enabled) {
      throw new Error('Optimistic updates are disabled')
    }
    
    // Check pending update limits
    if (!this.checkPendingLimits(componentId)) {
      throw new Error('Maximum pending updates exceeded for component')
    }
    
    // Create request through RequestTracker
    const request = this.requestTracker.createRequest(
      componentId,
      operation,
      payload,
      originalState
    )
    
    // Create optimistic update
    const optimisticUpdate: OptimisticUpdate = {
      id: this.generateUpdateId(),
      requestId: request.id,
      componentId,
      operation,
      payload,
      state: 'pending',
      timestamp: Date.now(),
      originalState,
      optimisticState: this.applyOptimisticState(originalState, operation, payload),
      visualIndicator: {
        ...this.config.defaultVisualIndicator,
        ...options.visualIndicator
      },
      rollbackFn: options.rollbackFn,
      onConfirmed: options.onConfirmed,
      onFailed: options.onFailed
    }
    
    // Store update
    this.optimisticUpdates.set(optimisticUpdate.id, optimisticUpdate)
    
    // Index by component
    if (!this.componentUpdates.has(componentId)) {
      this.componentUpdates.set(componentId, new Set())
    }
    this.componentUpdates.get(componentId)!.add(optimisticUpdate.id)
    
    // Setup timeout
    const timeout = options.timeout || this.config.defaultTimeout
    this.setupUpdateTimeout(optimisticUpdate, timeout)
    
    // Show visual indicator
    if (this.config.showVisualIndicators && optimisticUpdate.visualIndicator) {
      this.showVisualIndicator(optimisticUpdate)
    }
    
    // Submit request or queue offline
    if (this.isOnline) {
      this.requestTracker.submitRequest(request)
    } else if (this.config.enableOfflineQueue) {
      this.queueOfflineUpdate(optimisticUpdate)
    } else {
      throw new Error('Cannot apply update while offline')
    }
    
    // Notify listeners
    this.notifyStateChange(optimisticUpdate)
    
    this.logger.debug('Optimistic update applied', {
      updateId: optimisticUpdate.id,
      componentId,
      operation
    })
    
    return optimisticUpdate
  }
  
  /**
   * Confirm optimistic update
   */
  confirmUpdate(updateId: string, serverState?: any): boolean {
    const update = this.optimisticUpdates.get(updateId)
    if (!update || update.state !== 'pending') {
      this.logger.warn('Cannot confirm update', { updateId, currentState: update?.state })
      return false
    }
    
    // Update state
    update.state = 'confirmed'
    update.serverState = serverState
    
    // Clear timeout
    this.clearUpdateTimeout(update)
    
    // Hide visual indicator
    this.hideVisualIndicator(update)
    
    // Call confirmation callback
    if (update.onConfirmed) {
      try {
        update.onConfirmed(update)
      } catch (error) {
        this.logger.error('Confirmation callback error:', error)
      }
    }
    
    // Notify listeners
    this.notifyStateChange(update)
    
    this.logger.debug('Optimistic update confirmed', { updateId })
    
    // Clean up after delay to allow UI updates
    setTimeout(() => this.cleanupUpdate(updateId), 1000)
    
    return true
  }
  
  /**
   * Fail optimistic update
   */
  async failUpdate(updateId: string, error: Error): Promise<boolean> {
    const update = this.optimisticUpdates.get(updateId)
    if (!update || update.state !== 'pending') {
      this.logger.warn('Cannot fail update', { updateId, currentState: update?.state })
      return false
    }
    
    // Update state
    update.state = 'failed'
    
    // Clear timeout
    this.clearUpdateTimeout(update)
    
    // Rollback if enabled
    if (this.config.enableAutoRollback) {
      await this.rollbackUpdate(updateId)
    }
    
    // Call failure callback
    if (update.onFailed) {
      try {
        update.onFailed(update, error)
      } catch (callbackError) {
        this.logger.error('Failure callback error:', callbackError)
      }
    }
    
    // Notify listeners
    this.notifyStateChange(update)
    
    // Retry if enabled
    if (this.config.autoRetryFailed && this.isOnline) {
      this.scheduleRetry(update)
    }
    
    this.logger.debug('Optimistic update failed', { updateId, error: error.message })
    
    return true
  }
  
  /**
   * Rollback optimistic update
   */
  async rollbackUpdate(updateId: string): Promise<boolean> {
    const update = this.optimisticUpdates.get(updateId)
    if (!update) {
      this.logger.warn('Cannot rollback unknown update', { updateId })
      return false
    }
    
    // Update state
    update.state = 'rolled_back'
    
    // Clear timeout
    this.clearUpdateTimeout(update)
    
    // Execute rollback function
    if (update.rollbackFn) {
      try {
        await update.rollbackFn()
      } catch (error) {
        this.logger.error('Rollback function error:', error)
      }
    }
    
    // Hide visual indicator
    this.hideVisualIndicator(update)
    
    // Call rollback callback
    if (update.onRolledBack) {
      try {
        update.onRolledBack(update)
      } catch (error) {
        this.logger.error('Rollback callback error:', error)
      }
    }
    
    // Notify listeners
    this.notifyStateChange(update)
    
    this.logger.debug('Optimistic update rolled back', { updateId })
    
    // Clean up
    this.cleanupUpdate(updateId)
    
    return true
  }
  
  /**
   * Get optimistic updates for component
   */
  getComponentUpdates(componentId: string): OptimisticUpdate[] {
    const updateIds = this.componentUpdates.get(componentId) || new Set()
    return Array.from(updateIds)
      .map(id => this.optimisticUpdates.get(id))
      .filter(update => update) as OptimisticUpdate[]
  }
  
  /**
   * Get pending updates for component
   */
  getPendingUpdates(componentId: string): OptimisticUpdate[] {
    return this.getComponentUpdates(componentId)
      .filter(update => update.state === 'pending')
  }
  
  /**
   * Check if component has pending updates
   */
  hasPendingUpdates(componentId: string): boolean {
    return this.getPendingUpdates(componentId).length > 0
  }
  
  /**
   * Get optimistic state for component
   */
  getOptimisticState(componentId: string, baseState: any): any {
    const pendingUpdates = this.getPendingUpdates(componentId)
      .sort((a, b) => a.timestamp - b.timestamp)
    
    let resultState = baseState
    
    for (const update of pendingUpdates) {
      resultState = this.applyOptimisticState(resultState, update.operation, update.payload)
    }
    
    return resultState
  }
  
  /**
   * Process offline queue when back online
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return
    }
    
    this.logger.info('Processing offline queue', { queueSize: this.offlineQueue.length })
    
    // Sort by priority and timestamp
    this.offlineQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // Higher priority first
      }
      return a.update.timestamp - b.update.timestamp // Earlier first
    })
    
    // Process in batches
    const batchSize = 5
    for (let i = 0; i < this.offlineQueue.length; i += batchSize) {
      const batch = this.offlineQueue.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(async (item) => {
          const request = this.requestTracker.createRequest(
            item.update.componentId,
            item.update.operation,
            item.update.payload,
            item.update.originalState
          )
          
          this.requestTracker.submitRequest(request)
        })
      )
      
      // Small delay between batches
      if (i + batchSize < this.offlineQueue.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    // Clear processed queue
    this.offlineQueue = []
    
    this.logger.info('Offline queue processed successfully')
  }
  
  /**
   * Get optimistic update statistics
   */
  getStats(): {
    activeUpdates: number
    pendingUpdates: number
    confirmedUpdates: number
    failedUpdates: number
    rolledBackUpdates: number
    offlineQueueSize: number
    averageConfirmationTime: number
  } {
    const allUpdates = Array.from(this.optimisticUpdates.values())
    
    const pendingCount = allUpdates.filter(u => u.state === 'pending').length
    const confirmedCount = allUpdates.filter(u => u.state === 'confirmed').length
    const failedCount = allUpdates.filter(u => u.state === 'failed').length
    const rolledBackCount = allUpdates.filter(u => u.state === 'rolled_back').length
    
    // Calculate average confirmation time
    const confirmedUpdates = allUpdates.filter(u => u.state === 'confirmed')
    const avgConfirmationTime = confirmedUpdates.length > 0
      ? confirmedUpdates.reduce((sum, u) => sum + (Date.now() - u.timestamp), 0) / confirmedUpdates.length
      : 0
    
    return {
      activeUpdates: allUpdates.length,
      pendingUpdates: pendingCount,
      confirmedUpdates: confirmedCount,
      failedUpdates: failedCount,
      rolledBackUpdates: rolledBackCount,
      offlineQueueSize: this.offlineQueue.length,
      averageConfirmationTime: avgConfirmationTime
    }
  }
  
  /**
   * Private helper methods
   */
  
  private generateUpdateId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private checkPendingLimits(componentId: string): boolean {
    const pendingCount = this.getPendingUpdates(componentId).length
    return pendingCount < this.config.maxPendingUpdates
  }
  
  private applyOptimisticState(baseState: any, operation: string, payload: any): any {
    // Simple state application - can be enhanced based on operation types
    switch (operation) {
      case 'set':
        return { ...baseState, ...payload }
        
      case 'merge':
        return { ...baseState, ...payload }
        
      case 'increment':
        const field = payload.field || 'value'
        const amount = payload.amount || 1
        return { ...baseState, [field]: (baseState[field] || 0) + amount }
        
      case 'push':
        const array = baseState[payload.field] || []
        return { ...baseState, [payload.field]: [...array, payload.value] }
        
      default:
        return baseState
    }
  }
  
  private setupUpdateTimeout(update: OptimisticUpdate, timeout: number): void {
    const handle = setTimeout(() => {
      this.handleUpdateTimeout(update.id)
    }, timeout)
    
    this.timeoutHandles.set(update.id, handle)
  }
  
  private clearUpdateTimeout(update: OptimisticUpdate): void {
    const handle = this.timeoutHandles.get(update.id)
    if (handle) {
      clearTimeout(handle)
      this.timeoutHandles.delete(update.id)
    }
  }
  
  private async handleUpdateTimeout(updateId: string): Promise<void> {
    this.logger.warn('Optimistic update timeout', { updateId })
    await this.failUpdate(updateId, new Error('Update timeout'))
  }
  
  private showVisualIndicator(update: OptimisticUpdate): void {
    if (!update.visualIndicator || typeof document === 'undefined') return
    
    // This would integrate with UI framework to show indicators
    // Implementation depends on the specific UI library being used
    
    this.logger.debug('Showing visual indicator', { updateId: update.id })
  }
  
  private hideVisualIndicator(update: OptimisticUpdate): void {
    if (!update.visualIndicator || typeof document === 'undefined') return
    
    // This would integrate with UI framework to hide indicators
    // Implementation depends on the specific UI library being used
    
    this.logger.debug('Hiding visual indicator', { updateId: update.id })
  }
  
  private queueOfflineUpdate(update: OptimisticUpdate): void {
    if (this.offlineQueue.length >= this.config.maxOfflineQueueSize) {
      // Remove oldest item
      this.offlineQueue.shift()
    }
    
    const offlineUpdate: OfflineUpdate = {
      update,
      retryCount: 0,
      nextRetry: Date.now(),
      priority: 1 // Default priority
    }
    
    this.offlineQueue.push(offlineUpdate)
    
    this.logger.debug('Update queued for offline processing', { updateId: update.id })
  }
  
  private scheduleRetry(update: OptimisticUpdate): void {
    // Implement retry scheduling with exponential backoff
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    const retryCount = (update as any).retryCount || 0
    
    if (retryCount >= this.config.maxRetryAttempts) {
      this.logger.warn('Max retry attempts reached', { updateId: update.id })
      return
    }
    
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)
    
    setTimeout(() => {
      if (this.isOnline && this.optimisticUpdates.has(update.id)) {
        const request = this.requestTracker.createRequest(
          update.componentId,
          update.operation,
          update.payload,
          update.originalState
        )
        
        this.requestTracker.submitRequest(request);
        
        (update as any).retryCount = retryCount + 1
        
        this.logger.debug('Retrying failed update', { 
          updateId: update.id, 
          attempt: retryCount + 1 
        })
      }
    }, delay)
  }
  
  private setupNetworkMonitoring(): void {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      this.isOnline = navigator.onLine
      
      window.addEventListener('online', () => {
        this.isOnline = true
        this.logger.info('Network connection restored')
        this.processOfflineQueue().catch(error => {
          this.logger.error('Error processing offline queue:', error)
        })
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
        this.logger.info('Network connection lost')
      })
    }
  }
  
  private notifyStateChange(update: OptimisticUpdate): void {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(update)
      } catch (error) {
        this.logger.error('State change listener error:', error)
      }
    })
  }
  
  private cleanupUpdate(updateId: string): void {
    const update = this.optimisticUpdates.get(updateId)
    if (!update) return
    
    // Remove from maps
    this.optimisticUpdates.delete(updateId)
    
    const componentUpdates = this.componentUpdates.get(update.componentId)
    if (componentUpdates) {
      componentUpdates.delete(updateId)
      if (componentUpdates.size === 0) {
        this.componentUpdates.delete(update.componentId)
      }
    }
    
    // Clear timeout
    this.clearUpdateTimeout(update)
    
    // Remove visual elements
    this.visualElements.delete(updateId)
  }
  
  /**
   * Public API methods
   */
  
  /**
   * Add state change listener
   */
  onStateChange(listener: (update: OptimisticUpdate) => void): () => void {
    this.stateChangeListeners.add(listener)
    
    return () => {
      this.stateChangeListeners.delete(listener)
    }
  }
  
  /**
   * Clear all updates for component
   */
  clearComponent(componentId: string): void {
    const updates = this.getComponentUpdates(componentId)
    updates.forEach(update => this.cleanupUpdate(update.id))
    
    this.logger.debug('Component updates cleared', { componentId })
  }
  
  /**
   * Force process offline queue
   */
  async forceProcessOfflineQueue(): Promise<void> {
    await this.processOfflineQueue()
  }
  
  /**
   * Get update by ID
   */
  getUpdate(updateId: string): OptimisticUpdate | undefined {
    return this.optimisticUpdates.get(updateId)
  }
  
  /**
   * Shutdown optimistic update manager
   */
  shutdown(): void {
    // Clear all timeouts
    this.timeoutHandles.forEach(handle => clearTimeout(handle))
    this.timeoutHandles.clear()
    
    // Clear all data
    this.optimisticUpdates.clear()
    this.componentUpdates.clear()
    this.offlineQueue = []
    this.visualElements.clear()
    this.stateChangeListeners.clear()
    
    this.logger.info('OptimisticUpdateManager shutdown complete')
  }
}