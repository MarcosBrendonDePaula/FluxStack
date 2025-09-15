/**
 * EventPropagationManager - Advanced Event Propagation & Bubbling System
 * 
 * Implements DOM-like event propagation with bubbling and capturing phases,
 * event middleware, priority systems, and conditional propagation.
 * 
 * Features:
 * - Event bubbling from children to parents
 * - Event capturing from parents to children
 * - stopPropagation and preventDefault mechanisms
 * - Event priority and ordering system
 * - Conditional propagation with filters
 * - Event middleware and transformation
 * - Performance monitoring and debugging
 */

import { ComponentTreeManager, ComponentNode } from './ComponentTreeManager'
import { LiveEvent, LiveEventBus, EventScope } from './LiveEventBus'

export type PropagationPhase = 'capturing' | 'target' | 'bubbling'

export interface PropagatedEvent extends LiveEvent {
  /** Current propagation phase */
  phase: PropagationPhase
  
  /** Current target component in propagation */
  currentTarget: string
  
  /** Original event target */
  originalTarget: string
  
  /** Path through the component tree */
  propagationPath: PropagationStep[]
  
  /** Event can be canceled */
  cancelable: boolean
  
  /** Event default action prevented */
  defaultPrevented: boolean
  
  /** Propagation control */
  propagation: {
    /** Stop propagation flag */
    stopped: boolean
    
    /** Stop immediate propagation flag */
    stoppedImmediate: boolean
    
    /** Phase where propagation was stopped */
    stoppedAt?: PropagationPhase
  }
}

export interface PropagationStep {
  /** Component ID */
  componentId: string
  
  /** Component node */
  component: ComponentNode
  
  /** Propagation phase */
  phase: PropagationPhase
  
  /** Step timestamp */
  timestamp: number
  
  /** Whether event was handled at this step */
  handled: boolean
}

export interface EventMiddleware {
  /** Middleware ID */
  id: string
  
  /** Middleware name */
  name: string
  
  /** Middleware priority (higher = runs first) */
  priority: number
  
  /** Phase to apply middleware */
  phase: PropagationPhase | 'all'
  
  /** Component filter */
  componentFilter?: (component: ComponentNode) => boolean
  
  /** Event filter */
  eventFilter?: (event: PropagatedEvent) => boolean
  
  /** Middleware function */
  handler: (event: PropagatedEvent, next: () => Promise<void>) => Promise<void>
  
  /** Middleware metadata */
  metadata: {
    /** Creation timestamp */
    createdAt: number
    
    /** Whether middleware is active */
    active: boolean
    
    /** Performance stats */
    stats: {
      /** Total executions */
      executions: number
      
      /** Total execution time */
      totalTime: number
      
      /** Average execution time */
      averageTime: number
    }
  }
}

export interface PropagationConfig {
  /** Enable bubbling by default */
  enableBubbling?: boolean
  
  /** Enable capturing by default */
  enableCapturing?: boolean
  
  /** Default event priority */
  defaultPriority?: number
  
  /** Maximum propagation steps */
  maxSteps?: number
  
  /** Propagation timeout in milliseconds */
  timeout?: number
  
  /** Enable propagation debugging */
  enableDebug?: boolean
}

export interface PropagationFilter {
  /** Stop propagation based on component criteria */
  componentFilter?: (component: ComponentNode, event: PropagatedEvent) => boolean
  
  /** Stop propagation based on event criteria */
  eventFilter?: (event: PropagatedEvent) => boolean
  
  /** Stop propagation based on phase */
  phaseFilter?: (phase: PropagationPhase) => boolean
  
  /** Stop propagation based on path depth */
  maxDepth?: number
  
  /** Custom propagation logic */
  custom?: (step: PropagationStep, event: PropagatedEvent) => boolean
}

/**
 * EventPropagationManager
 * 
 * Manages advanced event propagation with bubbling, capturing, and middleware
 */
export class EventPropagationManager {
  private treeManager: ComponentTreeManager
  private eventBus: LiveEventBus
  private config: Required<PropagationConfig>
  private middleware = new Map<string, EventMiddleware>()
  private propagationFilters = new Map<string, PropagationFilter>()
  
  constructor(
    treeManager: ComponentTreeManager,
    eventBus: LiveEventBus,
    config: PropagationConfig = {}
  ) {
    this.treeManager = treeManager
    this.eventBus = eventBus
    this.config = {
      enableBubbling: config.enableBubbling ?? true,
      enableCapturing: config.enableCapturing ?? true,
      defaultPriority: config.defaultPriority ?? 100,
      maxSteps: config.maxSteps ?? 50,
      timeout: config.timeout ?? 10000,
      enableDebug: config.enableDebug ?? false
    }
  }
  
  /**
   * Emit event with advanced propagation
   */
  async emitWithPropagation(
    sourceId: string,
    eventType: string,
    data?: any,
    options: {
      bubbles?: boolean
      cancelable?: boolean
      priority?: number
      scope?: EventScope
      filter?: PropagationFilter
      metadata?: Record<string, any>
    } = {}
  ): Promise<PropagatedEvent> {
    const {
      bubbles = this.config.enableBubbling,
      cancelable = true,
      priority = this.config.defaultPriority,
      scope = 'subtree',
      filter,
      metadata
    } = options
    
    // Create propagated event
    const event: PropagatedEvent = {
      id: this.generateEventId(),
      type: eventType,
      data,
      sourceId,
      targetIds: [],
      timestamp: Date.now(),
      scope,
      handled: false,
      stopped: false,
      metadata: {
        priority,
        hopCount: 0,
        custom: metadata
      },
      phase: 'target',
      currentTarget: sourceId,
      originalTarget: sourceId,
      propagationPath: [],
      cancelable,
      defaultPrevented: false,
      propagation: {
        stopped: false,
        stoppedImmediate: false
      }
    }
    
    // Get component hierarchy
    const hierarchy = this.treeManager.getHierarchy(sourceId)
    if (!hierarchy) {
      throw new Error(`Component not found: ${sourceId}`)
    }
    
    try {
      // Capturing phase (from root to target)
      if (this.config.enableCapturing) {
        await this.executeCapturePhase(event, hierarchy, filter)
      }
      
      // Target phase
      if (!event.propagation.stopped) {
        await this.executeTargetPhase(event, hierarchy.node, filter)
      }
      
      // Bubbling phase (from target to root)
      if (bubbles && !event.propagation.stopped) {
        await this.executeBubblePhase(event, hierarchy, filter)
      }
      
      if (this.config.enableDebug) {
        console.log(`[EventPropagationManager] Event ${eventType} propagated through ${event.propagationPath.length} steps`)
      }
      
    } catch (error) {
      console.error(`[EventPropagationManager] Error during propagation:`, error)
    }
    
    return event
  }
  
  /**
   * Add event middleware
   */
  addMiddleware(middleware: Omit<EventMiddleware, 'metadata'>): string {
    const middlewareWithMeta: EventMiddleware = {
      ...middleware,
      metadata: {
        createdAt: Date.now(),
        active: true,
        stats: {
          executions: 0,
          totalTime: 0,
          averageTime: 0
        }
      }
    }
    
    this.middleware.set(middleware.id, middlewareWithMeta)
    
    if (this.config.enableDebug) {
      console.log(`[EventPropagationManager] Added middleware: ${middleware.name}`)
    }
    
    return middleware.id
  }
  
  /**
   * Remove event middleware
   */
  removeMiddleware(middlewareId: string): boolean {
    const middleware = this.middleware.get(middlewareId)
    if (!middleware) {
      return false
    }
    
    middleware.metadata.active = false
    this.middleware.delete(middlewareId)
    
    if (this.config.enableDebug) {
      console.log(`[EventPropagationManager] Removed middleware: ${middleware.name}`)
    }
    
    return true
  }
  
  /**
   * Add propagation filter
   */
  addPropagationFilter(filterId: string, filter: PropagationFilter): void {
    this.propagationFilters.set(filterId, filter)
  }
  
  /**
   * Remove propagation filter
   */
  removePropagationFilter(filterId: string): boolean {
    return this.propagationFilters.delete(filterId)
  }
  
  /**
   * Stop event propagation
   */
  stopPropagation(event: PropagatedEvent): void {
    event.propagation.stopped = true
    event.propagation.stoppedAt = event.phase
    
    if (this.config.enableDebug) {
      console.log(`[EventPropagationManager] Propagation stopped at ${event.phase} phase`)
    }
  }
  
  /**
   * Stop immediate event propagation
   */
  stopImmediatePropagation(event: PropagatedEvent): void {
    event.propagation.stopped = true
    event.propagation.stoppedImmediate = true
    event.propagation.stoppedAt = event.phase
    
    if (this.config.enableDebug) {
      console.log(`[EventPropagationManager] Immediate propagation stopped at ${event.phase} phase`)
    }
  }
  
  /**
   * Prevent default event action
   */
  preventDefault(event: PropagatedEvent): void {
    if (event.cancelable) {
      event.defaultPrevented = true
      
      if (this.config.enableDebug) {
        console.log(`[EventPropagationManager] Default action prevented for event ${event.type}`)
      }
    }
  }
  
  /**
   * Get middleware statistics
   */
  getMiddlewareStats(): Record<string, EventMiddleware['metadata']['stats']> {
    const stats: Record<string, EventMiddleware['metadata']['stats']> = {}
    
    for (const [id, middleware] of this.middleware) {
      stats[id] = { ...middleware.metadata.stats }
    }
    
    return stats
  }
  
  /**
   * Clear all middleware
   */
  clearMiddleware(): number {
    const count = this.middleware.size
    this.middleware.clear()
    return count
  }
  
  /**
   * Get propagation statistics
   */
  getStats() {
    const activeMiddleware = Array.from(this.middleware.values())
      .filter(m => m.metadata.active)
    
    return {
      activeMiddleware: activeMiddleware.length,
      totalMiddlewareExecutions: activeMiddleware.reduce(
        (sum, m) => sum + m.metadata.stats.executions, 0
      ),
      averageMiddlewareTime: activeMiddleware.reduce(
        (sum, m) => sum + m.metadata.stats.averageTime, 0
      ) / (activeMiddleware.length || 1),
      propagationFilters: this.propagationFilters.size,
      memoryUsage: this.calculateMemoryUsage()
    }
  }
  
  // Private methods
  
  private async executeCapturePhase(
    event: PropagatedEvent,
    hierarchy: any,
    filter?: PropagationFilter
  ): Promise<void> {
    event.phase = 'capturing'
    
    // Get path from root to target
    const capturePath = hierarchy.ancestors.reverse()
    
    for (const ancestor of capturePath) {
      if (event.propagation.stopped) break
      
      if (this.shouldStopPropagation(ancestor, event, filter)) {
        break
      }
      
      await this.executeEventStep(event, ancestor, 'capturing')
      
      if (event.propagation.stoppedImmediate) break
    }
  }
  
  private async executeTargetPhase(
    event: PropagatedEvent,
    target: ComponentNode,
    filter?: PropagationFilter
  ): Promise<void> {
    event.phase = 'target'
    
    if (!this.shouldStopPropagation(target, event, filter)) {
      await this.executeEventStep(event, target, 'target')
    }
  }
  
  private async executeBubblePhase(
    event: PropagatedEvent,
    hierarchy: any,
    filter?: PropagationFilter
  ): Promise<void> {
    event.phase = 'bubbling'
    
    // Get path from target to root
    const bubblePath = hierarchy.ancestors
    
    for (const ancestor of bubblePath) {
      if (event.propagation.stopped) break
      
      if (this.shouldStopPropagation(ancestor, event, filter)) {
        break
      }
      
      await this.executeEventStep(event, ancestor, 'bubbling')
      
      if (event.propagation.stoppedImmediate) break
    }
  }
  
  private async executeEventStep(
    event: PropagatedEvent,
    component: ComponentNode,
    phase: PropagationPhase
  ): Promise<void> {
    const stepStartTime = Date.now()
    
    // Update event context
    event.currentTarget = component.id
    event.phase = phase
    
    // Create propagation step
    const step: PropagationStep = {
      componentId: component.id,
      component,
      phase,
      timestamp: stepStartTime,
      handled: false
    }
    
    // Execute middleware chain
    await this.executeMiddlewareChain(event, component, phase)
    
    // Add step to propagation path
    event.propagationPath.push(step)
    
    // Update step as handled
    step.handled = true
    
    if (this.config.enableDebug) {
      const duration = Date.now() - stepStartTime
      console.log(`[EventPropagationManager] Executed ${phase} phase for ${component.id} in ${duration}ms`)
    }
  }
  
  private async executeMiddlewareChain(
    event: PropagatedEvent,
    component: ComponentNode,
    phase: PropagationPhase
  ): Promise<void> {
    // Get applicable middleware
    const applicableMiddleware = Array.from(this.middleware.values())
      .filter(m => this.isMiddlewareApplicable(m, event, component, phase))
      .sort((a, b) => b.priority - a.priority)
    
    let index = 0
    
    const next = async (): Promise<void> => {
      if (index >= applicableMiddleware.length) {
        return
      }
      
      const middleware = applicableMiddleware[index++]
      const startTime = Date.now()
      
      try {
        await middleware.handler(event, next)
        
        // Update middleware stats
        const executionTime = Date.now() - startTime
        middleware.metadata.stats.executions++
        middleware.metadata.stats.totalTime += executionTime
        middleware.metadata.stats.averageTime = 
          middleware.metadata.stats.totalTime / middleware.metadata.stats.executions
        
      } catch (error) {
        console.error(`[EventPropagationManager] Middleware error in ${middleware.name}:`, error)
      }
    }
    
    await next()
  }
  
  private isMiddlewareApplicable(
    middleware: EventMiddleware,
    event: PropagatedEvent,
    component: ComponentNode,
    phase: PropagationPhase
  ): boolean {
    if (!middleware.metadata.active) {
      return false
    }
    
    // Check phase filter
    if (middleware.phase !== 'all' && middleware.phase !== phase) {
      return false
    }
    
    // Check component filter
    if (middleware.componentFilter && !middleware.componentFilter(component)) {
      return false
    }
    
    // Check event filter
    if (middleware.eventFilter && !middleware.eventFilter(event)) {
      return false
    }
    
    return true
  }
  
  private shouldStopPropagation(
    component: ComponentNode,
    event: PropagatedEvent,
    filter?: PropagationFilter
  ): boolean {
    // Check if propagation was already stopped
    if (event.propagation.stopped) {
      return true
    }
    
    // Check max steps
    if (event.propagationPath.length >= this.config.maxSteps) {
      if (this.config.enableDebug) {
        console.warn(`[EventPropagationManager] Max propagation steps reached (${this.config.maxSteps})`)
      }
      return true
    }
    
    // Apply propagation filters
    if (filter) {
      if (filter.componentFilter && !filter.componentFilter(component, event)) {
        return true
      }
      
      if (filter.eventFilter && !filter.eventFilter(event)) {
        return true
      }
      
      if (filter.phaseFilter && !filter.phaseFilter(event.phase)) {
        return true
      }
      
      if (filter.maxDepth && component.depth > filter.maxDepth) {
        return true
      }
      
      if (filter.custom) {
        const step: PropagationStep = {
          componentId: component.id,
          component,
          phase: event.phase,
          timestamp: Date.now(),
          handled: false
        }
        
        if (!filter.custom(step, event)) {
          return true
        }
      }
    }
    
    // Apply global propagation filters
    for (const globalFilter of this.propagationFilters.values()) {
      if (this.shouldStopPropagation(component, event, globalFilter)) {
        return true
      }
    }
    
    return false
  }
  
  private generateEventId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `prop-event-${timestamp}-${random}`
  }
  
  private calculateMemoryUsage(): number {
    let size = 0
    size += JSON.stringify(Array.from(this.middleware.values())).length * 2
    size += JSON.stringify(Array.from(this.propagationFilters.values())).length * 2
    return size
  }
}

// Export types for external use
export type {
  PropagatedEvent,
  PropagationStep,
  EventMiddleware,
  PropagationConfig,
  PropagationFilter,
  PropagationPhase
}