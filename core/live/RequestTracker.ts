/**
 * RequestTracker
 * 
 * System for tracking individual state updates with request IDs,
 * deduplication, ordering, and conflict resolution for race conditions.
 * 
 * Part of Task 2.1: Fix Race Conditions in Updates
 */

import { Logger } from '../utils/logger'

/**
 * Request status enumeration
 */
export type RequestStatus = 
  | 'pending'
  | 'confirmed' 
  | 'failed'
  | 'cancelled'
  | 'rolled_back'

/**
 * Update request descriptor
 */
export interface UpdateRequest {
  /** Unique request ID */
  id: string
  
  /** Component ID this request affects */
  componentId: string
  
  /** Type of update operation */
  operation: string
  
  /** Update payload */
  payload: any
  
  /** Request timestamp */
  timestamp: number
  
  /** Current request status */
  status: RequestStatus
  
  /** Client-generated sequence number */
  sequenceNumber: number
  
  /** Original client state before update */
  originalState?: any
  
  /** Optimistic state after update */
  optimisticState?: any
  
  /** Server confirmed state */
  confirmedState?: any
  
  /** Error information if failed */
  error?: Error
  
  /** Number of retry attempts */
  retryCount?: number
  
  /** Request timeout handle */
  timeoutHandle?: NodeJS.Timeout
}

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy = 
  | 'server_wins'    // Server state takes precedence
  | 'client_wins'    // Client state takes precedence
  | 'last_write_wins' // Latest timestamp wins
  | 'merge'          // Attempt to merge states
  | 'manual'         // Require manual resolution

/**
 * Request tracker configuration
 */
export interface RequestTrackerConfig {
  /** Request timeout in milliseconds */
  requestTimeout: number
  
  /** Maximum pending requests per component */
  maxPendingRequests: number
  
  /** Enable request deduplication */
  enableDeduplication: boolean
  
  /** Deduplication window in milliseconds */
  deduplicationWindow: number
  
  /** Default conflict resolution strategy */
  defaultConflictStrategy: ConflictStrategy
  
  /** Enable request ordering */
  enableOrdering: boolean
  
  /** Maximum request history size */
  maxHistorySize: number
}

/**
 * RequestTracker
 * 
 * Manages update requests with race condition prevention,
 * deduplication, ordering, and conflict resolution.
 */
export class RequestTracker {
  private static instance: RequestTracker
  
  /** Configuration */
  private config: RequestTrackerConfig
  
  /** Logger instance */
  private logger: Logger
  
  /** Pending requests by ID */
  private pendingRequests = new Map<string, UpdateRequest>()
  
  /** Request history */
  private requestHistory = new Map<string, UpdateRequest[]>()
  
  /** Component sequence counters */
  private sequenceCounters = new Map<string, number>()
  
  /** Pending requests by component */
  private componentRequests = new Map<string, Set<string>>()
  
  /** Request deduplication cache */
  private deduplicationCache = new Map<string, UpdateRequest>()
  
  /** Conflict resolution callbacks */
  private conflictResolvers = new Map<string, (local: UpdateRequest, remote: UpdateRequest) => UpdateRequest>()
  
  /** Request timeout handles */
  private timeoutHandles = new Map<string, NodeJS.Timeout>()
  
  constructor(config: Partial<RequestTrackerConfig> = {}, logger?: Logger) {
    this.logger = logger || console as any
    
    this.config = {
      requestTimeout: 10000, // 10 seconds
      maxPendingRequests: 50,
      enableDeduplication: true,
      deduplicationWindow: 1000, // 1 second
      defaultConflictStrategy: 'last_write_wins',
      enableOrdering: true,
      maxHistorySize: 100,
      ...config
    }
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<RequestTrackerConfig>, logger?: Logger): RequestTracker {
    if (!RequestTracker.instance) {
      RequestTracker.instance = new RequestTracker(config, logger)
    }
    return RequestTracker.instance
  }
  
  /**
   * Create new update request
   */
  createRequest(
    componentId: string,
    operation: string,
    payload: any,
    originalState?: any
  ): UpdateRequest {
    // Generate unique request ID
    const requestId = this.generateRequestId()
    
    // Get next sequence number for component
    const sequenceNumber = this.getNextSequenceNumber(componentId)
    
    const request: UpdateRequest = {
      id: requestId,
      componentId,
      operation,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      sequenceNumber,
      originalState,
      retryCount: 0
    }
    
    return request
  }
  
  /**
   * Submit request for processing
   */
  submitRequest(request: UpdateRequest): boolean {
    // Check pending request limits
    if (!this.checkRequestLimits(request.componentId)) {
      this.logger.warn('Request limit exceeded for component', { componentId: request.componentId })
      return false
    }
    
    // Check for duplicate requests
    if (this.config.enableDeduplication && this.isDuplicateRequest(request)) {
      this.logger.debug('Duplicate request detected, ignoring', { requestId: request.id })
      return false
    }
    
    // Store request
    this.pendingRequests.set(request.id, request)
    
    // Index by component
    if (!this.componentRequests.has(request.componentId)) {
      this.componentRequests.set(request.componentId, new Set())
    }
    this.componentRequests.get(request.componentId)!.add(request.id)
    
    // Setup timeout
    this.setupRequestTimeout(request)
    
    // Add to deduplication cache
    if (this.config.enableDeduplication) {
      const dedupKey = this.getDeduplicationKey(request)
      this.deduplicationCache.set(dedupKey, request)
      
      // Clean up cache after window
      setTimeout(() => {
        this.deduplicationCache.delete(dedupKey)
      }, this.config.deduplicationWindow)
    }
    
    this.logger.debug('Request submitted', {
      requestId: request.id,
      componentId: request.componentId,
      operation: request.operation,
      sequenceNumber: request.sequenceNumber
    })
    
    return true
  }
  
  /**
   * Confirm request success from server
   */
  confirmRequest(requestId: string, confirmedState?: any): boolean {
    const request = this.pendingRequests.get(requestId)
    if (!request) {
      this.logger.warn('Cannot confirm unknown request', { requestId })
      return false
    }
    
    // Update request status
    request.status = 'confirmed'
    request.confirmedState = confirmedState
    
    // Clear timeout
    this.clearRequestTimeout(request)
    
    // Move to history
    this.moveToHistory(request)
    
    this.logger.debug('Request confirmed', {
      requestId,
      componentId: request.componentId
    })
    
    return true
  }
  
  /**
   * Mark request as failed
   */
  failRequest(requestId: string, error: Error): boolean {
    const request = this.pendingRequests.get(requestId)
    if (!request) {
      this.logger.warn('Cannot fail unknown request', { requestId })
      return false
    }
    
    // Update request status
    request.status = 'failed'
    request.error = error
    
    // Clear timeout
    this.clearRequestTimeout(request)
    
    // Move to history
    this.moveToHistory(request)
    
    this.logger.debug('Request failed', {
      requestId,
      componentId: request.componentId,
      error: error.message
    })
    
    return true
  }
  
  /**
   * Cancel pending request
   */
  cancelRequest(requestId: string): boolean {
    const request = this.pendingRequests.get(requestId)
    if (!request) {
      this.logger.warn('Cannot cancel unknown request', { requestId })
      return false
    }
    
    // Update request status
    request.status = 'cancelled'
    
    // Clear timeout
    this.clearRequestTimeout(request)
    
    // Move to history
    this.moveToHistory(request)
    
    this.logger.debug('Request cancelled', {
      requestId,
      componentId: request.componentId
    })
    
    return true
  }
  
  /**
   * Get pending requests for component
   */
  getPendingRequests(componentId: string): UpdateRequest[] {
    const requestIds = this.componentRequests.get(componentId) || new Set()
    return Array.from(requestIds)
      .map(id => this.pendingRequests.get(id))
      .filter(req => req && req.status === 'pending') as UpdateRequest[]
  }
  
  /**
   * Get ordered requests for component
   */
  getOrderedRequests(componentId: string): UpdateRequest[] {
    if (!this.config.enableOrdering) {
      return this.getPendingRequests(componentId)
    }
    
    return this.getPendingRequests(componentId)
      .sort((a, b) => {
        // Sort by sequence number first, then by timestamp
        if (a.sequenceNumber !== b.sequenceNumber) {
          return a.sequenceNumber - b.sequenceNumber
        }
        return a.timestamp - b.timestamp
      })
  }
  
  /**
   * Detect conflicts between requests
   */
  detectConflicts(componentId: string): Array<{ local: UpdateRequest, remote: UpdateRequest }> {
    const conflicts: Array<{ local: UpdateRequest, remote: UpdateRequest }> = []
    const requests = this.getOrderedRequests(componentId)
    
    for (let i = 0; i < requests.length; i++) {
      for (let j = i + 1; j < requests.length; j++) {
        const req1 = requests[i]
        const req2 = requests[j]
        
        if (this.requestsConflict(req1, req2)) {
          conflicts.push({ local: req1, remote: req2 })
        }
      }
    }
    
    return conflicts
  }
  
  /**
   * Resolve conflicts using configured strategy
   */
  resolveConflicts(componentId: string): UpdateRequest[] {
    const conflicts = this.detectConflicts(componentId)
    const resolvedRequests = new Map<string, UpdateRequest>()
    
    // Start with all requests
    this.getOrderedRequests(componentId).forEach(req => {
      resolvedRequests.set(req.id, req)
    })
    
    // Resolve each conflict
    conflicts.forEach(({ local, remote }) => {
      const resolved = this.resolveConflict(local, remote, componentId)
      
      if (resolved.id === local.id) {
        // Local wins - cancel remote
        this.cancelRequest(remote.id)
        resolvedRequests.delete(remote.id)
      } else if (resolved.id === remote.id) {
        // Remote wins - cancel local
        this.cancelRequest(local.id)
        resolvedRequests.delete(local.id)
      } else {
        // Merged request - cancel both originals
        this.cancelRequest(local.id)
        this.cancelRequest(remote.id)
        resolvedRequests.delete(local.id)
        resolvedRequests.delete(remote.id)
        resolvedRequests.set(resolved.id, resolved)
      }
    })
    
    return Array.from(resolvedRequests.values())
  }
  
  /**
   * Get request statistics
   */
  getStats(): {
    pendingCount: number
    historySize: number
    conflictCount: number
    totalRequests: number
    averageResponseTime: number
  } {
    const totalHistory = Array.from(this.requestHistory.values())
      .reduce((sum, requests) => sum + requests.length, 0)
    
    const conflicts = Array.from(this.componentRequests.keys())
      .reduce((sum, componentId) => sum + this.detectConflicts(componentId).length, 0)
    
    // Calculate average response time from confirmed requests
    const confirmedRequests = Array.from(this.requestHistory.values())
      .flat()
      .filter(req => req.status === 'confirmed' && req.confirmedState)
    
    const avgResponseTime = confirmedRequests.length > 0
      ? confirmedRequests.reduce((sum, req) => {
          return sum + (req.timestamp - req.timestamp) // This would need server confirmation timestamp
        }, 0) / confirmedRequests.length
      : 0
    
    return {
      pendingCount: this.pendingRequests.size,
      historySize: totalHistory,
      conflictCount: conflicts,
      totalRequests: this.pendingRequests.size + totalHistory,
      averageResponseTime: avgResponseTime
    }
  }
  
  /**
   * Private helper methods
   */
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private getNextSequenceNumber(componentId: string): number {
    const current = this.sequenceCounters.get(componentId) || 0
    const next = current + 1
    this.sequenceCounters.set(componentId, next)
    return next
  }
  
  private checkRequestLimits(componentId: string): boolean {
    const pendingCount = this.getPendingRequests(componentId).length
    return pendingCount < this.config.maxPendingRequests
  }
  
  private isDuplicateRequest(request: UpdateRequest): boolean {
    const dedupKey = this.getDeduplicationKey(request)
    const existing = this.deduplicationCache.get(dedupKey)
    
    if (!existing) return false
    
    // Check if within deduplication window
    const timeDiff = request.timestamp - existing.timestamp
    return timeDiff < this.config.deduplicationWindow
  }
  
  private getDeduplicationKey(request: UpdateRequest): string {
    // Create key based on component, operation, and payload
    const payloadHash = this.hashObject(request.payload)
    return `${request.componentId}:${request.operation}:${payloadHash}`
  }
  
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
  
  private setupRequestTimeout(request: UpdateRequest): void {
    const timeoutHandle = setTimeout(() => {
      this.handleRequestTimeout(request.id)
    }, this.config.requestTimeout)
    
    request.timeoutHandle = timeoutHandle
    this.timeoutHandles.set(request.id, timeoutHandle)
  }
  
  private clearRequestTimeout(request: UpdateRequest): void {
    if (request.timeoutHandle) {
      clearTimeout(request.timeoutHandle)
      request.timeoutHandle = undefined
    }
    this.timeoutHandles.delete(request.id)
  }
  
  private handleRequestTimeout(requestId: string): void {
    const request = this.pendingRequests.get(requestId)
    if (request) {
      this.failRequest(requestId, new Error('Request timeout'))
    }
  }
  
  private moveToHistory(request: UpdateRequest): void {
    // Remove from pending
    this.pendingRequests.delete(request.id)
    
    // Remove from component index
    const componentRequests = this.componentRequests.get(request.componentId)
    if (componentRequests) {
      componentRequests.delete(request.id)
      if (componentRequests.size === 0) {
        this.componentRequests.delete(request.componentId)
      }
    }
    
    // Add to history
    if (!this.requestHistory.has(request.componentId)) {
      this.requestHistory.set(request.componentId, [])
    }
    
    const history = this.requestHistory.get(request.componentId)!
    history.push(request)
    
    // Limit history size
    if (history.length > this.config.maxHistorySize) {
      history.shift()
    }
  }
  
  private requestsConflict(req1: UpdateRequest, req2: UpdateRequest): boolean {
    // Simple conflict detection - can be enhanced
    return req1.operation === req2.operation && 
           Math.abs(req1.timestamp - req2.timestamp) < 1000 // Within 1 second
  }
  
  private resolveConflict(local: UpdateRequest, remote: UpdateRequest, componentId: string): UpdateRequest {
    // Check for custom resolver
    const customResolver = this.conflictResolvers.get(componentId)
    if (customResolver) {
      return customResolver(local, remote)
    }
    
    // Use default strategy
    switch (this.config.defaultConflictStrategy) {
      case 'server_wins':
        return remote.status === 'confirmed' ? remote : local
        
      case 'client_wins':
        return local
        
      case 'last_write_wins':
        return local.timestamp > remote.timestamp ? local : remote
        
      case 'merge':
        return this.mergeRequests(local, remote)
        
      default:
        return local
    }
  }
  
  private mergeRequests(local: UpdateRequest, remote: UpdateRequest): UpdateRequest {
    // Simple merge strategy - can be enhanced
    const mergedPayload = { ...remote.payload, ...local.payload }
    
    return {
      ...local,
      id: this.generateRequestId(),
      payload: mergedPayload,
      timestamp: Math.max(local.timestamp, remote.timestamp)
    }
  }
  
  /**
   * Public API methods
   */
  
  /**
   * Register custom conflict resolver for component
   */
  registerConflictResolver(
    componentId: string, 
    resolver: (local: UpdateRequest, remote: UpdateRequest) => UpdateRequest
  ): void {
    this.conflictResolvers.set(componentId, resolver)
  }
  
  /**
   * Clear all requests for component
   */
  clearComponent(componentId: string): void {
    // Cancel all pending requests
    const pendingRequests = this.getPendingRequests(componentId)
    pendingRequests.forEach(req => this.cancelRequest(req.id))
    
    // Clear history
    this.requestHistory.delete(componentId)
    
    // Clear sequence counter
    this.sequenceCounters.delete(componentId)
    
    // Clear conflict resolver
    this.conflictResolvers.delete(componentId)
    
    this.logger.debug('Component requests cleared', { componentId })
  }
  
  /**
   * Get request by ID
   */
  getRequest(requestId: string): UpdateRequest | undefined {
    return this.pendingRequests.get(requestId)
  }
  
  /**
   * Get request history for component
   */
  getHistory(componentId: string): UpdateRequest[] {
    return [...(this.requestHistory.get(componentId) || [])]
  }
  
  /**
   * Shutdown request tracker
   */
  shutdown(): void {
    // Clear all timeouts
    this.timeoutHandles.forEach(handle => clearTimeout(handle))
    this.timeoutHandles.clear()
    
    // Clear all data
    this.pendingRequests.clear()
    this.requestHistory.clear()
    this.sequenceCounters.clear()
    this.componentRequests.clear()
    this.deduplicationCache.clear()
    this.conflictResolvers.clear()
    
    this.logger.info('RequestTracker shutdown complete')
  }
}