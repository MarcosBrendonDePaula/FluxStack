/**
 * LiveEventBus - Advanced Event System for Inter-component Communication
 * 
 * Provides hierarchical event routing, scoped communication, and advanced
 * event patterns for nested live components.
 * 
 * Features:
 * - Scoped event routing (local, parent, children, siblings, global, subtree)
 * - Event history and replay capabilities
 * - Component-aware filtering and targeting
 * - Event propagation control
 * - Debug and monitoring tools
 */

import { ComponentTreeManager, ComponentNode } from './ComponentTreeManager'

export interface LiveEvent {
  /** Unique event identifier */
  id: string
  
  /** Event type/name */
  type: string
  
  /** Event payload data */
  data?: any
  
  /** Source component ID */
  sourceId: string
  
  /** Target component IDs (calculated based on scope) */
  targetIds: string[]
  
  /** Event emission timestamp */
  timestamp: number
  
  /** Event scope for routing */
  scope: EventScope
  
  /** Whether event has been handled */
  handled: boolean
  
  /** Propagation stopped flag */
  stopped: boolean
  
  /** Event metadata */
  metadata: {
    /** Event priority (higher = processed first) */
    priority: number
    
    /** Maximum propagation hops */
    maxHops?: number
    
    /** Current hop count */
    hopCount: number
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export type EventScope = 
  | 'local'      // Only current component
  | 'parent'     // Only direct parent
  | 'children'   // Only direct children
  | 'siblings'   // Only sibling components
  | 'ancestors'  // All parent components up the tree
  | 'descendants'// All child components down the tree
  | 'subtree'    // Current component and all descendants
  | 'global'     // All components in the tree

export interface EventFilter {
  /** Filter by event type pattern */
  typePattern?: string | RegExp
  
  /** Filter by source component ID pattern */
  sourcePattern?: string | RegExp
  
  /** Filter by component type */
  componentType?: string
  
  /** Filter by component depth range */
  depthRange?: { min?: number; max?: number }
  
  /** Filter by component path pattern */
  pathPattern?: string | RegExp
  
  /** Custom filter function */
  custom?: (event: LiveEvent, component: ComponentNode) => boolean
}

export interface EventSubscription {
  /** Subscription ID */
  id: string
  
  /** Component ID that subscribed */
  componentId: string
  
  /** Event type to subscribe to */
  eventType: string
  
  /** Event scope to listen to */
  scope: EventScope
  
  /** Event filter */
  filter?: EventFilter
  
  /** Event handler function */
  handler: (event: LiveEvent) => void | Promise<void>
  
  /** Subscription metadata */
  metadata: {
    /** Subscription creation timestamp */
    createdAt: number
    
    /** Whether subscription is active */
    active: boolean
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface EventBusConfig {
  /** Maximum number of events to keep in history */
  maxHistorySize?: number
  
  /** Enable event debugging */
  enableDebug?: boolean
  
  /** Default event priority */
  defaultPriority?: number
  
  /** Maximum event propagation hops */
  maxHops?: number
  
  /** Event processing timeout in milliseconds */
  processingTimeout?: number
}

export interface EventTarget {
  /** Target component ID */
  componentId: string
  
  /** Component node reference */
  component: ComponentNode
  
  /** Hop count from source */
  hopCount: number
  
  /** Relationship to source (parent, child, sibling, etc.) */
  relationship: string
}

/**
 * LiveEventBus
 * 
 * Advanced event system for hierarchical component communication
 */
export class LiveEventBus {
  private treeManager: ComponentTreeManager
  private config: Required<EventBusConfig>
  private eventHistory: LiveEvent[] = []
  private subscriptions = new Map<string, EventSubscription>()
  private eventQueue: LiveEvent[] = []
  private processing = false
  
  constructor(
    treeManager: ComponentTreeManager,
    config: EventBusConfig = {}
  ) {
    this.treeManager = treeManager
    this.config = {
      maxHistorySize: config.maxHistorySize ?? 1000,
      enableDebug: config.enableDebug ?? false,
      defaultPriority: config.defaultPriority ?? 100,
      maxHops: config.maxHops ?? 10,
      processingTimeout: config.processingTimeout ?? 5000
    }
  }
  
  /**
   * Emit an event with scoped routing
   */
  emit(
    sourceId: string,
    eventType: string,
    data?: any,
    scope: EventScope = 'local',
    options: {
      priority?: number
      maxHops?: number
      metadata?: Record<string, any>
    } = {}
  ): string {
    // Generate event ID
    const eventId = this.generateEventId()
    
    // Calculate target components based on scope
    const targets = this.calculateTargets(sourceId, scope)
    
    // Create event
    const event: LiveEvent = {
      id: eventId,
      type: eventType,
      data,
      sourceId,
      targetIds: targets.map(t => t.componentId),
      timestamp: Date.now(),
      scope,
      handled: false,
      stopped: false,
      metadata: {
        priority: options.priority ?? this.config.defaultPriority,
        maxHops: options.maxHops ?? this.config.maxHops,
        hopCount: 0,
        custom: options.metadata
      }
    }
    
    // Add to history
    this.addToHistory(event)
    
    // Add to processing queue
    this.eventQueue.push(event)
    
    // Process events
    this.processEventQueue()
    
    if (this.config.enableDebug) {
      console.log(`[LiveEventBus] Emitted event: ${eventType} from ${sourceId} to ${targets.length} targets`)
    }
    
    return eventId
  }
  
  /**
   * Subscribe to events with filtering
   */
  subscribe(
    componentId: string,
    eventType: string,
    handler: (event: LiveEvent) => void | Promise<void>,
    scope: EventScope = 'global',
    filter?: EventFilter
  ): string {
    const subscriptionId = this.generateSubscriptionId()
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      componentId,
      eventType,
      scope,
      filter,
      handler,
      metadata: {
        createdAt: Date.now(),
        active: true
      }
    }
    
    this.subscriptions.set(subscriptionId, subscription)
    
    if (this.config.enableDebug) {
      console.log(`[LiveEventBus] Component ${componentId} subscribed to ${eventType} with scope ${scope}`)
    }
    
    return subscriptionId
  }
  
  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      return false
    }
    
    subscription.metadata.active = false
    this.subscriptions.delete(subscriptionId)
    
    if (this.config.enableDebug) {
      console.log(`[LiveEventBus] Unsubscribed: ${subscriptionId}`)
    }
    
    return true
  }
  
  /**
   * Calculate event targets based on scope
   */
  calculateTargets(sourceId: string, scope: EventScope): EventTarget[] {
    const sourceHierarchy = this.treeManager.getHierarchy(sourceId)
    if (!sourceHierarchy) {
      return []
    }
    
    const targets: EventTarget[] = []
    
    switch (scope) {
      case 'local':
        targets.push({
          componentId: sourceId,
          component: sourceHierarchy.node,
          hopCount: 0,
          relationship: 'self'
        })
        break
        
      case 'parent':
        if (sourceHierarchy.parent) {
          targets.push({
            componentId: sourceHierarchy.parent.id,
            component: sourceHierarchy.parent,
            hopCount: 1,
            relationship: 'parent'
          })
        }
        break
        
      case 'children':
        sourceHierarchy.children.forEach(child => {
          targets.push({
            componentId: child.id,
            component: child,
            hopCount: 1,
            relationship: 'child'
          })
        })
        break
        
      case 'siblings':
        sourceHierarchy.siblings.forEach(sibling => {
          targets.push({
            componentId: sibling.id,
            component: sibling,
            hopCount: 1,
            relationship: 'sibling'
          })
        })
        break
        
      case 'ancestors':
        let hopCount = 1
        sourceHierarchy.ancestors.forEach(ancestor => {
          targets.push({
            componentId: ancestor.id,
            component: ancestor,
            hopCount: hopCount++,
            relationship: 'ancestor'
          })
        })
        break
        
      case 'descendants':
        this.addDescendantTargets(sourceHierarchy.descendants, targets, 1)
        break
        
      case 'subtree':
        // Add self
        targets.push({
          componentId: sourceId,
          component: sourceHierarchy.node,
          hopCount: 0,
          relationship: 'self'
        })
        // Add all descendants
        this.addDescendantTargets(sourceHierarchy.descendants, targets, 1)
        break
        
      case 'global':
        // Add all components in the tree
        const allComponents = this.treeManager.getTreeStructure()
        this.addGlobalTargets(allComponents, sourceId, targets)
        break
    }
    
    return targets
  }
  
  /**
   * Get event history with optional filtering
   */
  getEventHistory(filter?: EventFilter): LiveEvent[] {
    if (!filter) {
      return [...this.eventHistory]
    }
    
    return this.eventHistory.filter(event => this.matchesFilter(event, filter))
  }
  
  /**
   * Replay events from history
   */
  replayEvents(
    events: LiveEvent[],
    options: {
      delay?: number
      skipHandled?: boolean
    } = {}
  ): void {
    const { delay = 0, skipHandled = true } = options
    
    events.forEach((event, index) => {
      if (skipHandled && event.handled) {
        return
      }
      
      setTimeout(() => {
        // Create replay event
        const replayEvent = {
          ...event,
          id: this.generateEventId(),
          timestamp: Date.now(),
          handled: false,
          metadata: {
            ...event.metadata,
            custom: {
              ...event.metadata.custom,
              replay: true,
              originalEventId: event.id
            }
          }
        }
        
        this.eventQueue.push(replayEvent)
        this.processEventQueue()
      }, delay * index)
    })
  }
  
  /**
   * Get active subscriptions for a component
   */
  getComponentSubscriptions(componentId: string): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.componentId === componentId && sub.metadata.active
    )
  }
  
  /**
   * Clear all subscriptions for a component
   */
  clearComponentSubscriptions(componentId: string): number {
    const componentSubs = this.getComponentSubscriptions(componentId)
    let cleared = 0
    
    componentSubs.forEach(sub => {
      if (this.unsubscribe(sub.id)) {
        cleared++
      }
    })
    
    return cleared
  }
  
  /**
   * Get event bus statistics
   */
  getStats() {
    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.metadata.active)
    
    const subscriptionsByComponent = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.componentId] = (acc[sub.componentId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const subscriptionsByEventType = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.eventType] = (acc[sub.eventType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalEvents: this.eventHistory.length,
      activeSubscriptions: activeSubscriptions.length,
      queuedEvents: this.eventQueue.length,
      subscriptionsByComponent,
      subscriptionsByEventType,
      memoryUsage: this.calculateMemoryUsage()
    }
  }
  
  /**
   * Dispose event bus
   */
  dispose(): void {
    this.eventHistory.length = 0
    this.subscriptions.clear()
    this.eventQueue.length = 0
    this.processing = false
  }
  
  // Private methods
  
  private async processEventQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return
    }
    
    this.processing = true
    
    try {
      // Sort events by priority (higher = first)
      this.eventQueue.sort((a, b) => b.metadata.priority - a.metadata.priority)
      
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!
        await this.processEvent(event)
      }
    } finally {
      this.processing = false
    }
  }
  
  private async processEvent(event: LiveEvent): Promise<void> {
    if (event.stopped) {
      return
    }
    
    // Find matching subscriptions
    const matchingSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => this.isSubscriptionMatch(sub, event))
    
    // Process subscriptions
    const processingPromises = matchingSubscriptions.map(async (subscription) => {
      try {
        await Promise.race([
          subscription.handler(event),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Handler timeout')), this.config.processingTimeout)
          )
        ])
        
        event.handled = true
        
        if (this.config.enableDebug) {
          console.log(`[LiveEventBus] Event ${event.type} handled by ${subscription.componentId}`)
        }
      } catch (error) {
        console.error(`[LiveEventBus] Error in event handler:`, error)
      }
    })
    
    await Promise.allSettled(processingPromises)
  }
  
  private isSubscriptionMatch(subscription: EventSubscription, event: LiveEvent): boolean {
    if (!subscription.metadata.active) {
      return false
    }
    
    // Check if component is in target list
    if (!event.targetIds.includes(subscription.componentId)) {
      return false
    }
    
    // Check event type match
    if (subscription.eventType !== '*' && subscription.eventType !== event.type) {
      return false
    }
    
    // Apply filter if present
    if (subscription.filter) {
      const component = this.treeManager.getHierarchy(subscription.componentId)?.node
      if (!component || !this.matchesFilter(event, subscription.filter, component)) {
        return false
      }
    }
    
    return true
  }
  
  private matchesFilter(
    event: LiveEvent, 
    filter: EventFilter, 
    component?: ComponentNode
  ): boolean {
    // Type pattern filter
    if (filter.typePattern) {
      const pattern = typeof filter.typePattern === 'string' 
        ? new RegExp(filter.typePattern) 
        : filter.typePattern
      if (!pattern.test(event.type)) {
        return false
      }
    }
    
    // Source pattern filter
    if (filter.sourcePattern) {
      const pattern = typeof filter.sourcePattern === 'string'
        ? new RegExp(filter.sourcePattern)
        : filter.sourcePattern
      if (!pattern.test(event.sourceId)) {
        return false
      }
    }
    
    // Component-specific filters (require component)
    if (component) {
      // Component type filter
      if (filter.componentType && component.type !== filter.componentType) {
        return false
      }
      
      // Depth range filter
      if (filter.depthRange) {
        const { min, max } = filter.depthRange
        if ((min !== undefined && component.depth < min) ||
            (max !== undefined && component.depth > max)) {
          return false
        }
      }
      
      // Path pattern filter
      if (filter.pathPattern) {
        const pattern = typeof filter.pathPattern === 'string'
          ? new RegExp(filter.pathPattern)
          : filter.pathPattern
        if (!pattern.test(component.path)) {
          return false
        }
      }
      
      // Custom filter
      if (filter.custom && !filter.custom(event, component)) {
        return false
      }
    }
    
    return true
  }
  
  private addDescendantTargets(
    descendants: ComponentNode[], 
    targets: EventTarget[], 
    startingHopCount: number
  ): void {
    descendants.forEach(descendant => {
      const hopCount = startingHopCount + (descendant.depth - descendants[0]?.depth || 0)
      targets.push({
        componentId: descendant.id,
        component: descendant,
        hopCount,
        relationship: 'descendant'
      })
    })
  }
  
  private addGlobalTargets(
    treeStructure: any[],
    sourceId: string,
    targets: EventTarget[]
  ): void {
    const processNode = (node: any, hopCount: number) => {
      if (node.id !== sourceId) {
        const component = this.treeManager.getHierarchy(node.id)?.node
        if (component) {
          targets.push({
            componentId: node.id,
            component,
            hopCount,
            relationship: 'global'
          })
        }
      }
      
      if (node.children) {
        node.children.forEach((child: any) => processNode(child, hopCount + 1))
      }
    }
    
    treeStructure.forEach(root => processNode(root, 1))
  }
  
  private addToHistory(event: LiveEvent): void {
    this.eventHistory.push(event)
    
    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory.shift()
    }
  }
  
  private generateEventId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `event-${timestamp}-${random}`
  }
  
  private generateSubscriptionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `sub-${timestamp}-${random}`
  }
  
  private calculateMemoryUsage(): number {
    let size = 0
    size += JSON.stringify(this.eventHistory).length * 2
    size += JSON.stringify(Array.from(this.subscriptions.values())).length * 2
    size += JSON.stringify(this.eventQueue).length * 2
    return size
  }
}

// Export singleton instance
export const liveEventBus = new LiveEventBus(
  require('./ComponentTreeManager').componentTreeManager
)