/**
 * LiveComponentEventSystem
 * 
 * Advanced event communication system for FluxLive components.
 * Supports parent-child communication, scoped event routing,
 * event middleware pipeline, and custom event types.
 */

import { ComponentIdentity } from './types'
import { WebSocketManager, WebSocketMessage } from './WebSocketManager'
import { ComponentIsolationManager } from './ComponentIsolationManager'
import { Logger } from '../utils/logger'

/**
 * Event types
 */
export type EventType = 
  | 'custom'
  | 'lifecycle'
  | 'state_change'
  | 'user_action'
  | 'system'
  | 'broadcast'
  | 'unicast'
  | 'multicast'

/**
 * Event priority levels
 */
export type EventPriority = 'low' | 'normal' | 'high' | 'critical'

/**
 * Event scope types
 */
export type EventScope = 
  | 'component'      // Single component
  | 'children'       // Direct children only
  | 'descendants'    // All descendants
  | 'siblings'       // Sibling components
  | 'parent'         // Direct parent only
  | 'ancestors'      // All ancestors
  | 'global'         // All components
  | 'custom'         // Custom scope logic

/**
 * Live component event structure
 */
export interface LiveComponentEvent {
  id: string
  type: EventType
  name: string
  componentId: string
  targetId?: string
  scope: EventScope
  priority: EventPriority
  payload: any
  timestamp: number
  bubbles: boolean
  cancelable: boolean
  stopped: boolean
  defaultPrevented: boolean
  metadata?: Record<string, any>
}

/**
 * Event listener function type
 */
export type EventListener = (event: LiveComponentEvent) => void | Promise<void>

/**
 * Event middleware function type
 */
export type EventMiddleware = (
  event: LiveComponentEvent,
  next: () => void | Promise<void>
) => void | Promise<void>

/**
 * Event filter function type
 */
export type EventFilter = (event: LiveComponentEvent) => boolean

/**
 * Custom scope resolver function type
 */
export type ScopeResolver = (
  sourceComponentId: string,
  event: LiveComponentEvent
) => string[]

/**
 * Event system configuration
 */
export interface EventSystemConfig {
  /** Maximum event queue size */
  maxQueueSize: number
  
  /** Event processing timeout (ms) */
  processingTimeout: number
  
  /** Enable event batching */
  enableBatching: boolean
  
  /** Batch size for event processing */
  batchSize: number
  
  /** Batch timeout (ms) */
  batchTimeout: number
  
  /** Enable event history */
  enableHistory: boolean
  
  /** Maximum event history size */
  maxHistorySize: number
  
  /** Enable event metrics */
  enableMetrics: boolean
  
  /** Dead letter queue size */
  deadLetterQueueSize: number
}

/**
 * Event metrics
 */
export interface EventMetrics {
  totalEvents: number
  eventsByType: Map<EventType, number>
  eventsByName: Map<string, number>
  avgProcessingTime: number
  failedEvents: number
  queuedEvents: number
  deadLetterEvents: number
}

/**
 * Event subscription
 */
export interface EventSubscription {
  id: string
  componentId: string
  eventName: string
  eventType?: EventType
  scope?: EventScope
  listener: EventListener
  filter?: EventFilter
  priority: EventPriority
  once: boolean
  active: boolean
}

/**
 * LiveComponentEventSystem
 * 
 * Manages event communication between FluxLive components with
 * advanced routing, middleware support, and performance optimization.
 */
export class LiveComponentEventSystem {
  private static instance: LiveComponentEventSystem
  
  /** WebSocket manager */
  private wsManager: WebSocketManager
  
  /** Component isolation manager */
  private isolationManager: ComponentIsolationManager
  
  /** Logger instance */
  private logger: Logger
  
  /** Configuration */
  private config: EventSystemConfig
  
  /** Event subscriptions */
  private subscriptions = new Map<string, EventSubscription>()
  
  /** Event listeners by component */
  private componentListeners = new Map<string, Set<string>>()
  
  /** Event listeners by name */
  private eventListeners = new Map<string, Set<string>>()
  
  /** Middleware stack */
  private middleware: EventMiddleware[] = []
  
  /** Custom scope resolvers */
  private scopeResolvers = new Map<string, ScopeResolver>()
  
  /** Event queue */
  private eventQueue: LiveComponentEvent[] = []
  
  /** Event processing timer */
  private processingTimer: NodeJS.Timeout | null = null
  
  /** Batch timer */
  private batchTimer: NodeJS.Timeout | null = null
  
  /** Event history */
  private eventHistory: LiveComponentEvent[] = []
  
  /** Dead letter queue */
  private deadLetterQueue: LiveComponentEvent[] = []
  
  /** Event metrics */
  private metrics: EventMetrics = {
    totalEvents: 0,
    eventsByType: new Map(),
    eventsByName: new Map(),
    avgProcessingTime: 0,
    failedEvents: 0,
    queuedEvents: 0,
    deadLetterEvents: 0
  }
  
  /** Processing times for metrics */
  private processingTimes: number[] = []
  
  constructor(
    wsManager: WebSocketManager,
    isolationManager: ComponentIsolationManager,
    config: Partial<EventSystemConfig> = {},
    logger?: Logger
  ) {
    this.wsManager = wsManager
    this.isolationManager = isolationManager
    this.logger = logger || console as any
    
    this.config = {
      maxQueueSize: 1000,
      processingTimeout: 5000,
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 50,
      enableHistory: true,
      maxHistorySize: 100,
      enableMetrics: true,
      deadLetterQueueSize: 50,
      ...config
    }
    
    this.setupWebSocketHandlers()
    this.startEventProcessor()
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(
    wsManager?: WebSocketManager,
    isolationManager?: ComponentIsolationManager,
    config?: Partial<EventSystemConfig>,
    logger?: Logger
  ): LiveComponentEventSystem {
    if (!LiveComponentEventSystem.instance && wsManager && isolationManager) {
      LiveComponentEventSystem.instance = new LiveComponentEventSystem(
        wsManager,
        isolationManager,
        config,
        logger
      )
    }
    return LiveComponentEventSystem.instance
  }
  
  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    this.wsManager.onMessage('event_emit', (message) => {
      this.handleRemoteEvent(message)
    })
  }
  
  /**
   * Emit event from component
   */
  async emit(
    componentId: string,
    eventName: string,
    payload: any = {},
    options: {
      type?: EventType
      scope?: EventScope
      targetId?: string
      priority?: EventPriority
      bubbles?: boolean
      cancelable?: boolean
    } = {}
  ): Promise<LiveComponentEvent> {
    const event = this.createEvent(componentId, eventName, payload, options)
    
    // Add to queue for processing
    this.queueEvent(event)
    
    // Send to remote components via WebSocket
    if (this.shouldSendRemote(event)) {
      await this.sendRemoteEvent(event)
    }
    
    return event
  }
  
  /**
   * Subscribe to events
   */
  on(
    componentId: string,
    eventName: string,
    listener: EventListener,
    options: {
      type?: EventType
      scope?: EventScope
      filter?: EventFilter
      priority?: EventPriority
      once?: boolean
    } = {}
  ): () => void {
    const subscription = this.createSubscription(
      componentId,
      eventName,
      listener,
      options
    )
    
    // Store subscription
    this.subscriptions.set(subscription.id, subscription)
    
    // Index by component
    if (!this.componentListeners.has(componentId)) {
      this.componentListeners.set(componentId, new Set())
    }
    this.componentListeners.get(componentId)!.add(subscription.id)
    
    // Index by event name
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set())
    }
    this.eventListeners.get(eventName)!.add(subscription.id)
    
    this.logger.debug('Event subscription created', {
      componentId,
      eventName,
      subscriptionId: subscription.id
    })
    
    // Return unsubscribe function
    return () => this.unsubscribe(subscription.id)
  }
  
  /**
   * Subscribe to event once
   */
  once(
    componentId: string,
    eventName: string,
    listener: EventListener,
    options: {
      type?: EventType
      scope?: EventScope
      filter?: EventFilter
      priority?: EventPriority
    } = {}
  ): () => void {
    return this.on(componentId, eventName, listener, { ...options, once: true })
  }
  
  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return false
    
    // Remove from indexes
    const componentSubs = this.componentListeners.get(subscription.componentId)
    if (componentSubs) {
      componentSubs.delete(subscriptionId)
      if (componentSubs.size === 0) {
        this.componentListeners.delete(subscription.componentId)
      }
    }
    
    const eventSubs = this.eventListeners.get(subscription.eventName)
    if (eventSubs) {
      eventSubs.delete(subscriptionId)
      if (eventSubs.size === 0) {
        this.eventListeners.delete(subscription.eventName)
      }
    }
    
    // Remove subscription
    this.subscriptions.delete(subscriptionId)
    
    this.logger.debug('Event subscription removed', { subscriptionId })
    
    return true
  }
  
  /**
   * Remove all subscriptions for a component
   */
  unsubscribeAll(componentId: string): number {
    const subscriptionIds = this.componentListeners.get(componentId)
    if (!subscriptionIds) return 0
    
    let count = 0
    subscriptionIds.forEach(id => {
      if (this.unsubscribe(id)) count++
    })
    
    return count
  }
  
  /**
   * Add event middleware
   */
  use(middleware: EventMiddleware): void {
    this.middleware.push(middleware)
  }
  
  /**
   * Register custom scope resolver
   */
  registerScopeResolver(scopeName: string, resolver: ScopeResolver): void {
    this.scopeResolvers.set(scopeName, resolver)
  }
  
  /**
   * Create event object
   */
  private createEvent(
    componentId: string,
    eventName: string,
    payload: any,
    options: any
  ): LiveComponentEvent {
    return {
      id: this.generateEventId(),
      type: options.type || 'custom',
      name: eventName,
      componentId,
      targetId: options.targetId,
      scope: options.scope || 'global',
      priority: options.priority || 'normal',
      payload,
      timestamp: Date.now(),
      bubbles: options.bubbles !== false,
      cancelable: options.cancelable !== false,
      stopped: false,
      defaultPrevented: false,
      metadata: {}
    }
  }
  
  /**
   * Create subscription object
   */
  private createSubscription(
    componentId: string,
    eventName: string,
    listener: EventListener,
    options: any
  ): EventSubscription {
    return {
      id: this.generateSubscriptionId(),
      componentId,
      eventName,
      eventType: options.type,
      scope: options.scope,
      listener,
      filter: options.filter,
      priority: options.priority || 'normal',
      once: options.once || false,
      active: true
    }
  }
  
  /**
   * Queue event for processing
   */
  private queueEvent(event: LiveComponentEvent): void {
    // Check queue size limit
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      const droppedEvent = this.eventQueue.shift()!
      this.addToDeadLetterQueue(droppedEvent, 'queue_overflow')
    }
    
    // Insert event based on priority
    this.insertEventByPriority(event)
    
    this.metrics.queuedEvents = this.eventQueue.length
    
    // Start processing if not already running
    if (!this.processingTimer) {
      this.scheduleProcessing()
    }
  }
  
  /**
   * Insert event by priority
   */
  private insertEventByPriority(event: LiveComponentEvent): void {
    const priorities = { critical: 0, high: 1, normal: 2, low: 3 }
    const eventPriority = priorities[event.priority]
    
    let insertIndex = this.eventQueue.length
    for (let i = 0; i < this.eventQueue.length; i++) {
      const queuedPriority = priorities[this.eventQueue[i].priority]
      if (eventPriority < queuedPriority) {
        insertIndex = i
        break
      }
    }
    
    this.eventQueue.splice(insertIndex, 0, event)
  }
  
  /**
   * Schedule event processing
   */
  private scheduleProcessing(): void {
    if (this.config.enableBatching) {
      this.batchTimer = setTimeout(() => {
        this.processBatch()
      }, this.config.batchTimeout)
    } else {
      this.processingTimer = setTimeout(() => {
        this.processEvents()
      }, 0)
    }
  }
  
  /**
   * Process events in batches
   */
  private async processBatch(): Promise<void> {
    const batch = this.eventQueue.splice(0, this.config.batchSize)
    if (batch.length === 0) return
    
    await Promise.allSettled(
      batch.map(event => this.processEvent(event))
    )
    
    // Schedule next batch if more events exist
    if (this.eventQueue.length > 0) {
      this.scheduleProcessing()
    } else {
      this.batchTimer = null
    }
  }
  
  /**
   * Process all queued events
   */
  private async processEvents(): Promise<void> {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      await this.processEvent(event)
    }
    
    this.processingTimer = null
    this.metrics.queuedEvents = 0
  }
  
  /**
   * Process single event
   */
  private async processEvent(event: LiveComponentEvent): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Run middleware pipeline
      await this.runMiddleware(event)
      
      // Skip if stopped by middleware
      if (event.stopped) return
      
      // Find target components
      const targetComponents = this.resolveEventTargets(event)
      
      // Find matching subscriptions
      const matchingSubscriptions = this.findMatchingSubscriptions(event, targetComponents)
      
      // Execute listeners
      await this.executeListeners(event, matchingSubscriptions)
      
      // Update metrics
      this.updateEventMetrics(event, performance.now() - startTime)
      
      // Add to history
      if (this.config.enableHistory) {
        this.addToHistory(event)
      }
      
    } catch (error) {
      this.logger.error('Event processing failed:', error, { event })
      this.metrics.failedEvents++
      this.addToDeadLetterQueue(event, 'processing_error')
    }
  }
  
  /**
   * Run middleware pipeline
   */
  private async runMiddleware(event: LiveComponentEvent): Promise<void> {
    let index = 0
    
    const next = async (): Promise<void> => {
      if (index >= this.middleware.length) return
      
      const middleware = this.middleware[index++]
      await middleware(event, next)
    }
    
    await next()
  }
  
  /**
   * Resolve event target components
   */
  private resolveEventTargets(event: LiveComponentEvent): string[] {
    if (event.targetId) {
      return [event.targetId]
    }
    
    switch (event.scope) {
      case 'component':
        return [event.componentId]
        
      case 'children':
        return this.getDirectChildren(event.componentId)
        
      case 'descendants':
        return this.getAllDescendants(event.componentId)
        
      case 'siblings':
        return this.getSiblings(event.componentId)
        
      case 'parent':
        const parent = this.getParent(event.componentId)
        return parent ? [parent] : []
        
      case 'ancestors':
        return this.getAllAncestors(event.componentId)
        
      case 'global':
        return this.getAllComponents()
        
      case 'custom':
        const resolver = this.scopeResolvers.get(event.name)
        return resolver ? resolver(event.componentId, event) : []
        
      default:
        return []
    }
  }
  
  /**
   * Find matching subscriptions
   */
  private findMatchingSubscriptions(
    event: LiveComponentEvent,
    targetComponents: string[]
  ): EventSubscription[] {
    const eventSubscriptions = this.eventListeners.get(event.name) || new Set()
    const matchingSubscriptions: EventSubscription[] = []
    
    eventSubscriptions.forEach(subscriptionId => {
      const subscription = this.subscriptions.get(subscriptionId)
      if (!subscription || !subscription.active) return
      
      // Check if subscription component is in targets
      if (!targetComponents.includes(subscription.componentId)) return
      
      // Check event type match
      if (subscription.eventType && subscription.eventType !== event.type) return
      
      // Check scope match
      if (subscription.scope && subscription.scope !== event.scope) return
      
      // Apply filter if present
      if (subscription.filter && !subscription.filter(event)) return
      
      matchingSubscriptions.push(subscription)
    })
    
    // Sort by priority
    return matchingSubscriptions.sort((a, b) => {
      const priorities = { critical: 0, high: 1, normal: 2, low: 3 }
      return priorities[a.priority] - priorities[b.priority]
    })
  }
  
  /**
   * Execute event listeners
   */
  private async executeListeners(
    event: LiveComponentEvent,
    subscriptions: EventSubscription[]
  ): Promise<void> {
    const promises = subscriptions.map(async (subscription) => {
      try {
        await subscription.listener(event)
        
        // Remove one-time listeners
        if (subscription.once) {
          this.unsubscribe(subscription.id)
        }
        
      } catch (error) {
        this.logger.error('Event listener error:', error, {
          subscriptionId: subscription.id,
          eventName: event.name
        })
      }
    })
    
    await Promise.allSettled(promises)
  }
  
  /**
   * Component hierarchy helper methods
   */
  private getDirectChildren(componentId: string): string[] {
    return this.isolationManager.getAllComponents()
      .filter(c => c.parentId === componentId)
      .map(c => c.componentId)
  }
  
  private getAllDescendants(componentId: string): string[] {
    const descendants: string[] = []
    const children = this.getDirectChildren(componentId)
    
    children.forEach(childId => {
      descendants.push(childId)
      descendants.push(...this.getAllDescendants(childId))
    })
    
    return descendants
  }
  
  private getSiblings(componentId: string): string[] {
    const parent = this.getParent(componentId)
    if (!parent) return []
    
    return this.getDirectChildren(parent).filter(id => id !== componentId)
  }
  
  private getParent(componentId: string): string | null {
    const component = this.isolationManager.getAllComponents()
      .find(c => c.componentId === componentId)
    
    return component?.parentId || null
  }
  
  private getAllAncestors(componentId: string): string[] {
    const ancestors: string[] = []
    let currentParent = this.getParent(componentId)
    
    while (currentParent) {
      ancestors.push(currentParent)
      currentParent = this.getParent(currentParent)
    }
    
    return ancestors
  }
  
  private getAllComponents(): string[] {
    return this.isolationManager.getAllComponents().map(c => c.componentId)
  }
  
  /**
   * Handle remote event from WebSocket
   */
  private handleRemoteEvent(message: WebSocketMessage): void {
    const eventData = message.payload as LiveComponentEvent
    this.queueEvent(eventData)
  }
  
  /**
   * Send event to remote components
   */
  private async sendRemoteEvent(event: LiveComponentEvent): Promise<void> {
    try {
      await this.wsManager.send({
        type: 'event_emit',
        componentId: event.componentId,
        payload: event
      })
    } catch (error) {
      this.logger.error('Failed to send remote event:', error)
    }
  }
  
  /**
   * Check if event should be sent to remote components
   */
  private shouldSendRemote(event: LiveComponentEvent): boolean {
    return event.scope === 'global' || 
           event.scope === 'broadcast' || 
           event.targetId !== undefined
  }
  
  /**
   * Start event processor
   */
  private startEventProcessor(): void {
    // Process events periodically to handle any stuck in queue
    setInterval(() => {
      if (this.eventQueue.length > 0 && !this.processingTimer && !this.batchTimer) {
        this.scheduleProcessing()
      }
    }, 1000)
  }
  
  /**
   * Update event metrics
   */
  private updateEventMetrics(event: LiveComponentEvent, processingTime: number): void {
    if (!this.config.enableMetrics) return
    
    this.metrics.totalEvents++
    
    // Update by type
    const typeCount = this.metrics.eventsByType.get(event.type) || 0
    this.metrics.eventsByType.set(event.type, typeCount + 1)
    
    // Update by name
    const nameCount = this.metrics.eventsByName.get(event.name) || 0
    this.metrics.eventsByName.set(event.name, nameCount + 1)
    
    // Update processing time
    this.processingTimes.push(processingTime)
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift()
    }
    
    this.metrics.avgProcessingTime = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
  }
  
  /**
   * Add event to history
   */
  private addToHistory(event: LiveComponentEvent): void {
    this.eventHistory.push({...event})
    
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory.shift()
    }
  }
  
  /**
   * Add event to dead letter queue
   */
  private addToDeadLetterQueue(event: LiveComponentEvent, reason: string): void {
    event.metadata = event.metadata || {}
    event.metadata.deadLetterReason = reason
    
    this.deadLetterQueue.push(event)
    this.metrics.deadLetterEvents++
    
    if (this.deadLetterQueue.length > this.config.deadLetterQueueSize) {
      this.deadLetterQueue.shift()
    }
  }
  
  /**
   * Utility methods
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Public API methods
   */
  
  /**
   * Get event metrics
   */
  getMetrics(): EventMetrics {
    return {
      ...this.metrics,
      eventsByType: new Map(this.metrics.eventsByType),
      eventsByName: new Map(this.metrics.eventsByName)
    }
  }
  
  /**
   * Get event history
   */
  getEventHistory(): LiveComponentEvent[] {
    return [...this.eventHistory]
  }
  
  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): LiveComponentEvent[] {
    return [...this.deadLetterQueue]
  }
  
  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = []
  }
  
  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = []
    this.metrics.deadLetterEvents = 0
  }
  
  /**
   * Get active subscriptions for component
   */
  getComponentSubscriptions(componentId: string): EventSubscription[] {
    const subscriptionIds = this.componentListeners.get(componentId) || new Set()
    return Array.from(subscriptionIds)
      .map(id => this.subscriptions.get(id))
      .filter(sub => sub && sub.active) as EventSubscription[]
  }
  
  /**
   * Pause/resume subscription
   */
  toggleSubscription(subscriptionId: string, active: boolean): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return false
    
    subscription.active = active
    return true
  }
  
  /**
   * Shutdown event system
   */
  shutdown(): void {
    // Clear timers
    if (this.processingTimer) {
      clearTimeout(this.processingTimer)
      this.processingTimer = null
    }
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    
    // Clear all data
    this.subscriptions.clear()
    this.componentListeners.clear()
    this.eventListeners.clear()
    this.middleware = []
    this.scopeResolvers.clear()
    this.eventQueue = []
    this.eventHistory = []
    this.deadLetterQueue = []
    
    this.logger.info('LiveComponentEventSystem shutdown complete')
  }
}