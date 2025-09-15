/**
 * LiveOfflineManager - Action Queue System for Offline Support
 * 
 * Implements comprehensive offline action handling including action queuing
 * with persistence, prioritization, overflow handling, queue inspection,
 * and manual management tools.
 * 
 * Features:
 * - Action queuing with localStorage persistence
 * - Queue size limits and overflow handling strategies
 * - Action prioritization and intelligent ordering
 * - Automatic retry mechanisms with exponential backoff
 * - Queue inspection and manual management tools
 * - Conflict detection and resolution preparation
 * - Performance optimization for large queues
 * - Transaction-like batch operations
 */

export interface OfflineAction {
  /** Action unique identifier */
  id: string
  
  /** Component ID that initiated the action */
  componentId: string
  
  /** Action type/method name */
  type: string
  
  /** Action payload/arguments */
  payload: any
  
  /** Action timestamp */
  timestamp: number
  
  /** Action priority (higher = processed first) */
  priority: number
  
  /** Number of retry attempts */
  attempts: number
  
  /** Maximum retry attempts allowed */
  maxAttempts: number
  
  /** Action status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  
  /** Action dependencies (must complete before this action) */
  dependencies: string[]
  
  /** Action expiration timestamp */
  expiresAt?: number
  
  /** Optimistic update data for rollback */
  optimisticUpdate?: {
    /** Previous state before optimistic update */
    previousState: any
    
    /** Optimistic state applied */
    optimisticState: any
    
    /** Whether optimistic update was applied */
    applied: boolean
  }
  
  /** Action metadata */
  metadata: {
    /** Creation timestamp */
    createdAt: number
    
    /** Last retry timestamp */
    lastRetry?: number
    
    /** Next retry timestamp */
    nextRetry?: number
    
    /** Error information if failed */
    error?: {
      code: string
      message: string
      details?: any
    }
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface ActionBatch {
  /** Batch unique identifier */
  id: string
  
  /** Actions in this batch */
  actions: OfflineAction[]
  
  /** Batch timestamp */
  timestamp: number
  
  /** Batch status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  
  /** Whether batch is atomic (all or nothing) */
  atomic: boolean
  
  /** Batch metadata */
  metadata: {
    /** Creation timestamp */
    createdAt: number
    
    /** Completion timestamp */
    completedAt?: number
    
    /** Success/failure counts */
    results: {
      completed: number
      failed: number
      cancelled: number
    }
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface QueueStats {
  /** Total actions in queue */
  totalActions: number
  
  /** Actions by status */
  byStatus: Record<OfflineAction['status'], number>
  
  /** Actions by priority */
  byPriority: Record<number, number>
  
  /** Actions by component */
  byComponent: Record<string, number>
  
  /** Queue size in bytes */
  sizeInBytes: number
  
  /** Oldest action timestamp */
  oldestAction?: number
  
  /** Failed actions count */
  failedActions: number
  
  /** Expired actions count */
  expiredActions: number
  
  /** Average processing time */
  averageProcessingTime: number
}

export interface OfflineManagerConfig {
  /** Maximum number of actions in queue */
  maxQueueSize?: number
  
  /** Queue overflow strategy */
  overflowStrategy?: 'drop-oldest' | 'drop-newest' | 'drop-low-priority' | 'compress'
  
  /** Default action priority */
  defaultPriority?: number
  
  /** Default maximum retry attempts */
  defaultMaxAttempts?: number
  
  /** Default action expiration time in milliseconds */
  defaultExpirationTime?: number
  
  /** Enable persistence to localStorage */
  enablePersistence?: boolean
  
  /** localStorage key prefix */
  persistenceKey?: string
  
  /** Automatic queue processing interval */
  processingInterval?: number
  
  /** Enable compression for large payloads */
  enableCompression?: boolean
  
  /** Compression threshold in bytes */
  compressionThreshold?: number
  
  /** Enable debug logging */
  enableDebug?: boolean
}

export type OverflowStrategy = OfflineManagerConfig['overflowStrategy']

/**
 * LiveOfflineManager
 * 
 * Manages action queues for offline component operation
 */
export class LiveOfflineManager {
  private config: Required<OfflineManagerConfig>
  private actionQueue: OfflineAction[] = []
  private batchQueue: ActionBatch[] = []
  private processingInterval?: NodeJS.Timeout
  private isProcessing = false
  private actionHistory: OfflineAction[] = []
  private performanceMetrics = {
    totalProcessed: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0
  }
  
  constructor(config: OfflineManagerConfig = {}) {
    this.config = {
      maxQueueSize: config.maxQueueSize ?? 1000,
      overflowStrategy: config.overflowStrategy ?? 'drop-oldest',
      defaultPriority: config.defaultPriority ?? 100,
      defaultMaxAttempts: config.defaultMaxAttempts ?? 3,
      defaultExpirationTime: config.defaultExpirationTime ?? 86400000, // 24 hours
      enablePersistence: config.enablePersistence ?? true,
      persistenceKey: config.persistenceKey ?? 'fluxstack-offline-queue',
      processingInterval: config.processingInterval ?? 5000,
      enableCompression: config.enableCompression ?? true,
      compressionThreshold: config.compressionThreshold ?? 1024,
      enableDebug: config.enableDebug ?? false
    }
    
    this.loadFromPersistence()
    this.startProcessing()
  }
  
  /**
   * Enqueue an action for offline processing
   */
  enqueueAction(
    componentId: string,
    type: string,
    payload: any,
    options: {
      priority?: number
      maxAttempts?: number
      expiresAt?: number
      dependencies?: string[]
      optimisticUpdate?: OfflineAction['optimisticUpdate']
      metadata?: Record<string, any>
    } = {}
  ): string {
    const {
      priority = this.config.defaultPriority,
      maxAttempts = this.config.defaultMaxAttempts,
      expiresAt,
      dependencies = [],
      optimisticUpdate,
      metadata
    } = options
    
    const action: OfflineAction = {
      id: this.generateActionId(),
      componentId,
      type,
      payload: this.maybeCompressPayload(payload),
      timestamp: Date.now(),
      priority,
      attempts: 0,
      maxAttempts,
      status: 'pending',
      dependencies,
      expiresAt: expiresAt || (Date.now() + this.config.defaultExpirationTime),
      optimisticUpdate,
      metadata: {
        createdAt: Date.now(),
        custom: metadata
      }
    }
    
    // Check queue size limits
    if (this.actionQueue.length >= this.config.maxQueueSize) {
      this.handleQueueOverflow()
    }
    
    // Insert action in priority order
    this.insertActionByPriority(action)
    
    // Persist queue
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Enqueued action: ${type} for ${componentId}`)
    }
    
    return action.id
  }
  
  /**
   * Create and enqueue a batch of actions
   */
  enqueueBatch(
    actions: Array<{
      componentId: string
      type: string
      payload: any
      options?: Partial<OfflineAction>
    }>,
    options: {
      atomic?: boolean
      priority?: number
      metadata?: Record<string, any>
    } = {}
  ): string {
    const {
      atomic = false,
      priority = this.config.defaultPriority,
      metadata
    } = options
    
    const batch: ActionBatch = {
      id: this.generateBatchId(),
      actions: actions.map(actionData => ({
        id: this.generateActionId(),
        componentId: actionData.componentId,
        type: actionData.type,
        payload: this.maybeCompressPayload(actionData.payload),
        timestamp: Date.now(),
        priority,
        attempts: 0,
        maxAttempts: this.config.defaultMaxAttempts,
        status: 'pending',
        dependencies: [],
        expiresAt: Date.now() + this.config.defaultExpirationTime,
        ...actionData.options,
        metadata: {
          createdAt: Date.now(),
          ...actionData.options?.metadata
        }
      })),
      timestamp: Date.now(),
      status: 'pending',
      atomic,
      metadata: {
        createdAt: Date.now(),
        results: {
          completed: 0,
          failed: 0,
          cancelled: 0
        },
        custom: metadata
      }
    }
    
    this.batchQueue.push(batch)
    
    // Add batch actions to main queue
    for (const action of batch.actions) {
      this.insertActionByPriority(action)
    }
    
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Enqueued batch: ${batch.id} with ${actions.length} actions`)
    }
    
    return batch.id
  }
  
  /**
   * Dequeue action by ID
   */
  dequeueAction(actionId: string): OfflineAction | null {
    const index = this.actionQueue.findIndex(action => action.id === actionId)
    if (index === -1) {
      return null
    }
    
    const action = this.actionQueue.splice(index, 1)[0]
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Dequeued action: ${actionId}`)
    }
    
    return action
  }
  
  /**
   * Cancel action by ID
   */
  cancelAction(actionId: string): boolean {
    const action = this.findAction(actionId)
    if (!action || action.status === 'processing') {
      return false
    }
    
    action.status = 'cancelled'
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Cancelled action: ${actionId}`)
    }
    
    return true
  }
  
  /**
   * Retry failed action
   */
  retryAction(actionId: string): boolean {
    const action = this.findAction(actionId)
    if (!action || action.status !== 'failed') {
      return false
    }
    
    action.status = 'pending'
    action.attempts = 0
    action.metadata.error = undefined
    action.metadata.nextRetry = undefined
    
    // Re-sort queue by priority
    this.sortQueueByPriority()
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Retrying action: ${actionId}`)
    }
    
    return true
  }
  
  /**
   * Get action by ID
   */
  getAction(actionId: string): OfflineAction | null {
    return this.findAction(actionId) || null
  }
  
  /**
   * Get all actions for a component
   */
  getComponentActions(componentId: string): OfflineAction[] {
    return this.actionQueue.filter(action => action.componentId === componentId)
  }
  
  /**
   * Get actions by status
   */
  getActionsByStatus(status: OfflineAction['status']): OfflineAction[] {
    return this.actionQueue.filter(action => action.status === status)
  }
  
  /**
   * Get pending actions ready for processing
   */
  getPendingActions(): OfflineAction[] {
    const now = Date.now()
    return this.actionQueue.filter(action => {
      if (action.status !== 'pending') return false
      if (action.expiresAt && action.expiresAt < now) return false
      if (action.metadata.nextRetry && action.metadata.nextRetry > now) return false
      return this.areDependenciesSatisfied(action)
    })
  }
  
  /**
   * Clear all actions
   */
  clearQueue(): number {
    const count = this.actionQueue.length
    this.actionQueue = []
    this.batchQueue = []
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Cleared queue: ${count} actions`)
    }
    
    return count
  }
  
  /**
   * Clear actions for specific component
   */
  clearComponentActions(componentId: string): number {
    const before = this.actionQueue.length
    this.actionQueue = this.actionQueue.filter(action => action.componentId !== componentId)
    const cleared = before - this.actionQueue.length
    
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Cleared ${cleared} actions for component: ${componentId}`)
    }
    
    return cleared
  }
  
  /**
   * Remove expired actions
   */
  cleanupExpiredActions(): number {
    const now = Date.now()
    const before = this.actionQueue.length
    
    this.actionQueue = this.actionQueue.filter(action => {
      return !action.expiresAt || action.expiresAt > now
    })
    
    const cleaned = before - this.actionQueue.length
    
    if (cleaned > 0) {
      this.persistQueue()
      
      if (this.config.enableDebug) {
        console.log(`[LiveOfflineManager] Cleaned up ${cleaned} expired actions`)
      }
    }
    
    return cleaned
  }
  
  /**
   * Mark action as completed
   */
  markActionCompleted(actionId: string, result?: any): boolean {
    const action = this.findAction(actionId)
    if (!action) {
      return false
    }
    
    action.status = 'completed'
    action.metadata.custom = { ...action.metadata.custom, result }
    
    // Move to history
    this.actionHistory.push(action)
    this.removeActionFromQueue(actionId)
    
    // Update batch if applicable
    this.updateBatchStatus(action)
    
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Action completed: ${actionId}`)
    }
    
    return true
  }
  
  /**
   * Mark action as failed
   */
  markActionFailed(actionId: string, error: { code: string; message: string; details?: any }): boolean {
    const action = this.findAction(actionId)
    if (!action) {
      return false
    }
    
    action.attempts++
    action.metadata.error = error
    action.metadata.lastRetry = Date.now()
    
    if (action.attempts >= action.maxAttempts) {
      action.status = 'failed'
      
      // Move to history
      this.actionHistory.push(action)
      this.removeActionFromQueue(actionId)
      
      // Update batch if applicable
      this.updateBatchStatus(action)
    } else {
      // Schedule retry with exponential backoff
      const backoffDelay = Math.pow(2, action.attempts - 1) * 1000
      action.metadata.nextRetry = Date.now() + backoffDelay
      action.status = 'pending'
    }
    
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Action failed: ${actionId}, attempts: ${action.attempts}/${action.maxAttempts}`)
    }
    
    return true
  }
  
  /**
   * Get queue statistics
   */
  getQueueStats(): QueueStats {
    const byStatus = this.actionQueue.reduce((acc, action) => {
      acc[action.status] = (acc[action.status] || 0) + 1
      return acc
    }, {} as Record<OfflineAction['status'], number>)
    
    const byPriority = this.actionQueue.reduce((acc, action) => {
      acc[action.priority] = (acc[action.priority] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    const byComponent = this.actionQueue.reduce((acc, action) => {
      acc[action.componentId] = (acc[action.componentId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const queueSizeInBytes = this.calculateQueueSize()
    const oldestAction = this.actionQueue.length > 0 
      ? Math.min(...this.actionQueue.map(a => a.timestamp))
      : undefined
    
    return {
      totalActions: this.actionQueue.length,
      byStatus,
      byPriority,
      byComponent,
      sizeInBytes: queueSizeInBytes,
      oldestAction,
      failedActions: byStatus.failed || 0,
      expiredActions: this.countExpiredActions(),
      averageProcessingTime: this.performanceMetrics.averageProcessingTime
    }
  }
  
  /**
   * Export queue for debugging
   */
  exportQueue(): {
    actions: OfflineAction[]
    batches: ActionBatch[]
    stats: QueueStats
    history: OfflineAction[]
  } {
    return {
      actions: [...this.actionQueue],
      batches: [...this.batchQueue],
      stats: this.getQueueStats(),
      history: [...this.actionHistory]
    }
  }
  
  /**
   * Import queue from backup
   */
  importQueue(data: {
    actions?: OfflineAction[]
    batches?: ActionBatch[]
  }): void {
    if (data.actions) {
      this.actionQueue = data.actions
      this.sortQueueByPriority()
    }
    
    if (data.batches) {
      this.batchQueue = data.batches
    }
    
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveOfflineManager] Imported queue: ${this.actionQueue.length} actions, ${this.batchQueue.length} batches`)
    }
  }
  
  /**
   * Dispose offline manager
   */
  dispose(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = undefined
    }
    
    this.persistQueue()
    
    if (this.config.enableDebug) {
      console.log('[LiveOfflineManager] Disposed')
    }
  }
  
  // Private methods
  
  private startProcessing(): void {
    if (this.config.processingInterval > 0) {
      this.processingInterval = setInterval(() => {
        this.processQueue()
      }, this.config.processingInterval)
    }
  }
  
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return
    }
    
    this.isProcessing = true
    
    try {
      // Clean up expired actions first
      this.cleanupExpiredActions()
      
      // Get actions ready for processing
      const pendingActions = this.getPendingActions()
      
      if (pendingActions.length > 0 && this.config.enableDebug) {
        console.log(`[LiveOfflineManager] Processing ${pendingActions.length} pending actions`)
      }
      
      // Process actions would go here in real implementation
      // For now, we just simulate processing
      for (const action of pendingActions.slice(0, 5)) { // Process max 5 at a time
        action.status = 'processing'
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 10))
        
        // Simulate success/failure
        if (Math.random() > 0.1) { // 90% success rate
          this.markActionCompleted(action.id)
        } else {
          this.markActionFailed(action.id, {
            code: 'PROCESSING_ERROR',
            message: 'Simulated processing error'
          })
        }
      }
      
    } finally {
      this.isProcessing = false
    }
  }
  
  private handleQueueOverflow(): void {
    switch (this.config.overflowStrategy) {
      case 'drop-oldest':
        this.actionQueue.shift()
        break
        
      case 'drop-newest':
        // Don't add the new action (handled by caller)
        break
        
      case 'drop-low-priority':
        this.actionQueue.sort((a, b) => a.priority - b.priority)
        this.actionQueue.shift()
        this.sortQueueByPriority()
        break
        
      case 'compress':
        this.compressQueue()
        break
    }
  }
  
  private insertActionByPriority(action: OfflineAction): void {
    // Insert in priority order (higher priority first)
    let insertIndex = this.actionQueue.length
    
    for (let i = 0; i < this.actionQueue.length; i++) {
      if (this.actionQueue[i].priority < action.priority) {
        insertIndex = i
        break
      }
    }
    
    this.actionQueue.splice(insertIndex, 0, action)
  }
  
  private sortQueueByPriority(): void {
    this.actionQueue.sort((a, b) => b.priority - a.priority)
  }
  
  private findAction(actionId: string): OfflineAction | undefined {
    return this.actionQueue.find(action => action.id === actionId)
  }
  
  private removeActionFromQueue(actionId: string): boolean {
    const index = this.actionQueue.findIndex(action => action.id === actionId)
    if (index !== -1) {
      this.actionQueue.splice(index, 1)
      return true
    }
    return false
  }
  
  private areDependenciesSatisfied(action: OfflineAction): boolean {
    if (action.dependencies.length === 0) {
      return true
    }
    
    return action.dependencies.every(depId => {
      const dependency = this.findAction(depId)
      return !dependency || dependency.status === 'completed'
    })
  }
  
  private updateBatchStatus(action: OfflineAction): void {
    const batch = this.batchQueue.find(b => 
      b.actions.some(a => a.id === action.id)
    )
    
    if (!batch) return
    
    if (action.status === 'completed') {
      batch.metadata.results.completed++
    } else if (action.status === 'failed') {
      batch.metadata.results.failed++
    } else if (action.status === 'cancelled') {
      batch.metadata.results.cancelled++
    }
    
    // Check if batch is complete
    const totalResults = batch.metadata.results.completed + 
                        batch.metadata.results.failed + 
                        batch.metadata.results.cancelled
    
    if (totalResults === batch.actions.length) {
      if (batch.metadata.results.failed > 0) {
        batch.status = batch.atomic ? 'failed' : 'partial'
      } else {
        batch.status = 'completed'
      }
      batch.metadata.completedAt = Date.now()
    }
  }
  
  private countExpiredActions(): number {
    const now = Date.now()
    return this.actionQueue.filter(action => 
      action.expiresAt && action.expiresAt < now
    ).length
  }
  
  private calculateQueueSize(): number {
    return JSON.stringify(this.actionQueue).length * 2 // Rough bytes estimate
  }
  
  private compressQueue(): void {
    // Simple compression - remove completed actions from queue
    this.actionQueue = this.actionQueue.filter(action => 
      action.status !== 'completed'
    )
  }
  
  private maybeCompressPayload(payload: any): any {
    if (!this.config.enableCompression) {
      return payload
    }
    
    const payloadString = JSON.stringify(payload)
    if (payloadString.length > this.config.compressionThreshold) {
      // In a real implementation, this would use actual compression
      return {
        __compressed: true,
        data: payloadString // Would be compressed data
      }
    }
    
    return payload
  }
  
  private loadFromPersistence(): void {
    if (!this.config.enablePersistence || typeof localStorage === 'undefined') {
      return
    }
    
    try {
      const stored = localStorage.getItem(this.config.persistenceKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.actionQueue = data.actions || []
        this.batchQueue = data.batches || []
        this.actionHistory = data.history || []
        
        if (this.config.enableDebug) {
          console.log(`[LiveOfflineManager] Loaded from persistence: ${this.actionQueue.length} actions`)
        }
      }
    } catch (error) {
      console.error('[LiveOfflineManager] Failed to load from persistence:', error)
    }
  }
  
  private persistQueue(): void {
    if (!this.config.enablePersistence || typeof localStorage === 'undefined') {
      return
    }
    
    try {
      const data = {
        actions: this.actionQueue,
        batches: this.batchQueue,
        history: this.actionHistory.slice(-100) // Keep last 100 history items
      }
      
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(data))
    } catch (error) {
      console.error('[LiveOfflineManager] Failed to persist queue:', error)
    }
  }
  
  private generateActionId(): string {
    return `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export types for external use
export type {
  OfflineAction,
  ActionBatch,
  QueueStats,
  OfflineManagerConfig,
  OverflowStrategy
}