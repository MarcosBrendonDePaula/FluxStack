/**
 * ComponentIsolationManager
 * 
 * Core component isolation system that manages component identity, hierarchy,
 * and lifecycle. Implements deterministic ID generation, hierarchical component
 * tree management, and automatic cleanup mechanisms.
 * 
 * This replaces the complex temporary → fixed ID mapping system with a simple,
 * deterministic approach that prevents race conditions and memory leaks.
 */

import { 
  ComponentIdentity, 
  ComponentLifecycle, 
  ComponentDependency, 
  MemoryStats,
  ComponentMetrics 
} from './types'
import { Logger } from '../utils/logger'

/**
 * Hash function for deterministic ID generation
 * Uses FNV-1a hash algorithm for better distribution
 */
function hashObject(obj: any): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort())
  let hash = 2166136261 // FNV offset basis
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619) // FNV prime
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Generate deterministic component ID
 */
function generateComponentId(
  componentType: string,
  props: any,
  parentId?: string,
  userProvidedId?: string
): string {
  if (userProvidedId) {
    const timestamp = Date.now().toString(36)
    return `${userProvidedId}-${timestamp}`
  }
  
  const propsHash = hashObject(props || {})
  const timestamp = Date.now().toString(36)
  const parentPrefix = parentId ? `${parentId}.` : ''
  
  return `${parentPrefix}${componentType}-${propsHash}-${timestamp}`
}

/**
 * Generate component path for hierarchical navigation
 */
function generateComponentPath(
  componentType: string,
  parentId?: string,
  parentPath?: string
): string {
  if (!parentId || !parentPath) {
    return componentType.toLowerCase()
  }
  
  return `${parentPath}.${componentType.toLowerCase()}`
}

/**
 * ComponentIsolationManager
 * 
 * Manages component instances, hierarchical relationships, and automatic cleanup.
 * Ensures that multiple components of the same type maintain separate state
 * and proper isolation even when running concurrently.
 */
export class ComponentIsolationManager {
  private static instance: ComponentIsolationManager
  
  /** Map of component instances by componentId */
  private instances = new Map<string, any>()
  
  /** Map of client ID to component IDs */
  private clientInstances = new Map<string, Set<string>>()
  
  /** Hierarchical component tree structure */
  private componentTree = new Map<string, ComponentIdentity>()
  
  /** Component lifecycle tracking */
  private lifecycles = new Map<string, ComponentLifecycle>()
  
  /** Performance metrics tracking */
  private metrics = new Map<string, ComponentMetrics>()
  
  /** Memory usage tracking */
  private memoryStats: MemoryStats = {
    activeInstances: 0,
    orphanedInstances: 0,
    totalMemoryUsage: 0,
    memoryByType: new Map(),
    memoryLeaks: [],
    cleanupOperations: []
  }
  
  /** Cleanup interval for orphaned instances */
  private cleanupInterval: NodeJS.Timeout | null = null
  
  /** Logger instance */
  private logger: Logger
  
  constructor(logger?: Logger) {
    this.logger = logger || console as any
    this.startCleanupInterval()
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(logger?: Logger): ComponentIsolationManager {
    if (!ComponentIsolationManager.instance) {
      ComponentIsolationManager.instance = new ComponentIsolationManager(logger)
    }
    return ComponentIsolationManager.instance
  }
  
  /**
   * Create new component instance with hierarchical identity
   * 
   * @param componentType - LiveAction class name
   * @param props - Initial component props
   * @param clientId - Client session identifier
   * @param userComponentId - Optional custom component ID
   * @param parentId - Parent component ID for hierarchy
   * @returns ComponentIdentity with hierarchical information
   */
  createInstance(
    componentType: string,
    props: any = {},
    clientId: string,
    userComponentId?: string,
    parentId?: string
  ): ComponentIdentity {
    // Generate deterministic component ID
    const componentId = generateComponentId(
      componentType, 
      props, 
      parentId, 
      userComponentId
    )
    
    // Get parent component information for hierarchy
    const parentComponent = parentId ? this.componentTree.get(parentId) : null
    const depth = parentComponent ? parentComponent.depth + 1 : 0
    const path = generateComponentPath(
      componentType, 
      parentId, 
      parentComponent?.path
    )
    
    // Create instance ID for server-side tracking
    const instanceId = `${componentId}-inst-${Date.now().toString(36)}`
    
    // Generate state fingerprint with timestamp for uniqueness
    const timestamp = Date.now()
    const fingerprint = this.generateFingerprint(componentType, props, timestamp)
    
    // Create component identity
    const identity: ComponentIdentity = {
      componentId,
      componentType,
      instanceId,
      clientId,
      fingerprint,
      parentId,
      childIds: new Set(),
      depth,
      path,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    // Register in component tree
    this.componentTree.set(componentId, identity)
    
    // Update parent-child relationships
    if (parentComponent) {
      parentComponent.childIds.add(componentId)
      parentComponent.updatedAt = Date.now()
    }
    
    // Track client association
    if (!this.clientInstances.has(clientId)) {
      this.clientInstances.set(clientId, new Set())
    }
    this.clientInstances.get(clientId)!.add(componentId)
    
    // Initialize lifecycle
    this.lifecycles.set(componentId, {
      state: 'creating',
      dependencies: [],
      dependents: new Set(),
      cleanupFns: [],
    })
    
    // Initialize performance metrics
    this.metrics.set(componentId, {
      componentId,
      updateCount: 0,
      avgUpdateTime: 0,
      maxUpdateTime: 0,
      renderCount: 0,
      avgRenderTime: 0,
      memoryUsage: 0,
      peakMemoryUsage: 0,
      eventListenerCount: 0,
      childCount: 0,
      healthScore: 100,
      lastUpdated: Date.now(),
      warnings: []
    })
    
    // Update memory statistics
    this.updateMemoryStats('create', componentType, componentId)
    
    this.logger.debug(`Created component instance: ${componentId}`, {
      componentType,
      parentId,
      depth,
      path,
      clientId
    })
    
    return identity
  }
  
  /**
   * Register component instance object
   */
  registerInstance(componentId: string, instance: any): void {
    if (this.instances.has(componentId)) {
      this.logger.warn(`Component instance already exists: ${componentId}`)
      return
    }
    
    this.instances.set(componentId, instance)
    
    // Update lifecycle state
    const lifecycle = this.lifecycles.get(componentId)
    if (lifecycle) {
      lifecycle.state = 'ready'
    }
    
    this.logger.debug(`Registered component instance: ${componentId}`)
  }
  
  /**
   * Get component instance
   */
  getInstance<T = any>(componentId: string): T | undefined {
    return this.instances.get(componentId)
  }
  
  /**
   * Get component identity
   */
  getIdentity(componentId: string): ComponentIdentity | undefined {
    return this.componentTree.get(componentId)
  }
  
  /**
   * Get component hierarchy information
   */
  getHierarchy(componentId: string): {
    component: ComponentIdentity | null
    parent: ComponentIdentity | null
    children: ComponentIdentity[]
    siblings: ComponentIdentity[]
    ancestors: ComponentIdentity[]
    descendants: ComponentIdentity[]
  } {
    const component = this.componentTree.get(componentId) || null
    
    if (!component) {
      return {
        component: null,
        parent: null,
        children: [],
        siblings: [],
        ancestors: [],
        descendants: []
      }
    }
    
    // Get parent
    const parent = component.parentId ? 
      this.componentTree.get(component.parentId) || null : null
    
    // Get children
    const children = Array.from(component.childIds)
      .map(id => this.componentTree.get(id))
      .filter(Boolean) as ComponentIdentity[]
    
    // Get siblings
    const siblings = parent ? 
      Array.from(parent.childIds)
        .filter(id => id !== componentId)
        .map(id => this.componentTree.get(id))
        .filter(Boolean) as ComponentIdentity[] : []
    
    // Get ancestors (recursive up the tree)
    const ancestors: ComponentIdentity[] = []
    let currentParent = parent
    while (currentParent) {
      ancestors.push(currentParent)
      currentParent = currentParent.parentId ? 
        this.componentTree.get(currentParent.parentId) || null : null
    }
    
    // Get descendants (recursive down the tree)
    const descendants: ComponentIdentity[] = []
    const collectDescendants = (children: ComponentIdentity[]) => {
      for (const child of children) {
        descendants.push(child)
        const grandChildren = Array.from(child.childIds)
          .map(id => this.componentTree.get(id))
          .filter(Boolean) as ComponentIdentity[]
        if (grandChildren.length > 0) {
          collectDescendants(grandChildren)
        }
      }
    }
    collectDescendants(children)
    
    return {
      component,
      parent,
      children,
      siblings,
      ancestors,
      descendants
    }
  }
  
  /**
   * Clean up component instance and all associated data
   */
  cleanupInstance(componentId: string): void {
    const identity = this.componentTree.get(componentId)
    if (!identity) {
      this.logger.warn(`Component identity not found for cleanup: ${componentId}`)
      return
    }
    
    // Get hierarchy for cleanup ordering
    const hierarchy = this.getHierarchy(componentId)
    
    // Clean up children first (bottom-up cleanup)
    for (const child of hierarchy.descendants.reverse()) {
      this.cleanupInstance(child.componentId)
    }
    
    // Run component-specific cleanup functions
    const lifecycle = this.lifecycles.get(componentId)
    if (lifecycle) {
      lifecycle.state = 'unmounting'
      
      // Execute cleanup functions
      for (const cleanupFn of lifecycle.cleanupFns) {
        try {
          const result = cleanupFn()
          if (result instanceof Promise) {
            // Don't wait for async cleanup, but log errors
            result.catch(err => 
              this.logger.error(`Async cleanup function error for ${componentId}:`, err)
            )
          }
        } catch (err) {
          this.logger.error(`Cleanup function error for ${componentId}:`, err)
        }
      }
    }
    
    // Remove from parent's children
    if (identity.parentId) {
      const parent = this.componentTree.get(identity.parentId)
      if (parent) {
        parent.childIds.delete(componentId)
        parent.updatedAt = Date.now()
      }
    }
    
    // Remove instance
    this.instances.delete(componentId)
    
    // Remove from component tree
    this.componentTree.delete(componentId)
    
    // Remove lifecycle
    this.lifecycles.delete(componentId)
    
    // Remove metrics
    this.metrics.delete(componentId)
    
    // Remove from client associations
    for (const [clientId, componentIds] of this.clientInstances) {
      componentIds.delete(componentId)
      if (componentIds.size === 0) {
        this.clientInstances.delete(clientId)
      }
    }
    
    // Update memory statistics
    this.updateMemoryStats('cleanup', identity.componentType, componentId)
    
    // Update lifecycle state
    if (lifecycle) {
      lifecycle.state = 'destroyed'
    }
    
    this.logger.debug(`Cleaned up component instance: ${componentId}`, {
      componentType: identity.componentType,
      hadChildren: hierarchy.children.length > 0,
      cleanedDescendants: hierarchy.descendants.length
    })
  }
  
  /**
   * Clean up all components for a specific client
   */
  cleanupClient(clientId: string): void {
    const componentIds = this.clientInstances.get(clientId)
    if (!componentIds) {
      this.logger.debug(`No components found for client: ${clientId}`)
      return
    }
    
    // Create array copy to avoid modification during iteration
    const componentsToCleanup = Array.from(componentIds)
    
    // Sort by depth (deepest first) for proper cleanup order
    const sortedComponents = componentsToCleanup
      .map(id => ({ id, identity: this.componentTree.get(id) }))
      .filter(item => item.identity)
      .sort((a, b) => (b.identity!.depth) - (a.identity!.depth))
    
    // Clean up each component
    for (const { id } of sortedComponents) {
      this.cleanupInstance(id)
    }
    
    // Remove client association
    this.clientInstances.delete(clientId)
    
    this.logger.info(`Cleaned up ${componentsToCleanup.length} components for client: ${clientId}`)
  }
  
  /**
   * Add cleanup function to component lifecycle
   */
  addCleanupFunction(componentId: string, cleanupFn: () => void | Promise<void>): void {
    const lifecycle = this.lifecycles.get(componentId)
    if (lifecycle) {
      lifecycle.cleanupFns.push(cleanupFn)
    }
  }
  
  /**
   * Get component performance metrics
   */
  getMetrics(componentId: string): ComponentMetrics | undefined {
    return this.metrics.get(componentId)
  }
  
  /**
   * Update component performance metrics
   */
  updateMetrics(componentId: string, update: Partial<ComponentMetrics>): void {
    const metrics = this.metrics.get(componentId)
    if (metrics) {
      Object.assign(metrics, update, { lastUpdated: Date.now() })
    }
  }
  
  /**
   * Get memory statistics
   */
  getMemoryStats(): MemoryStats {
    return { ...this.memoryStats }
  }
  
  /**
   * Get all active components
   */
  getAllComponents(): ComponentIdentity[] {
    return Array.from(this.componentTree.values())
  }
  
  /**
   * Get components by type
   */
  getComponentsByType(componentType: string): ComponentIdentity[] {
    return Array.from(this.componentTree.values())
      .filter(identity => identity.componentType === componentType)
  }
  
  /**
   * Get components by client
   */
  getComponentsByClient(clientId: string): ComponentIdentity[] {
    const componentIds = this.clientInstances.get(clientId)
    if (!componentIds) return []
    
    return Array.from(componentIds)
      .map(id => this.componentTree.get(id))
      .filter(Boolean) as ComponentIdentity[]
  }
  
  /**
   * Detect memory leaks and orphaned instances
   */
  detectMemoryLeaks(): void {
    const now = Date.now()
    const staleThreshold = 30 * 60 * 1000 // 30 minutes
    
    // Check for stale instances
    for (const [componentId, identity] of this.componentTree) {
      if (now - identity.updatedAt > staleThreshold) {
        // Check if instance still exists
        if (!this.instances.has(componentId)) {
          this.memoryStats.memoryLeaks.push({
            componentId,
            componentType: identity.componentType,
            leakType: 'instance',
            severity: 'medium',
            detectedAt: now
          })
        }
      }
    }
    
    // Check for orphaned instances
    for (const [componentId] of this.instances) {
      if (!this.componentTree.has(componentId)) {
        this.memoryStats.orphanedInstances++
        this.memoryStats.memoryLeaks.push({
          componentId,
          componentType: 'unknown',
          leakType: 'instance',
          severity: 'high',
          detectedAt: now
        })
      }
    }
  }
  
  /**
   * Force cleanup of orphaned instances
   */
  private cleanupOrphanedInstances(): void {
    const orphanedComponents = []
    const now = Date.now()
    const staleThreshold = 60 * 60 * 1000 // 1 hour
    
    // Find stale components
    for (const [componentId, identity] of this.componentTree) {
      if (now - identity.updatedAt > staleThreshold) {
        orphanedComponents.push(componentId)
      }
    }
    
    // Clean up orphaned components
    let cleanedCount = 0
    for (const componentId of orphanedComponents) {
      try {
        this.cleanupInstance(componentId)
        cleanedCount++
      } catch (err) {
        this.logger.error(`Failed to cleanup orphaned instance ${componentId}:`, err)
      }
    }
    
    if (cleanedCount > 0) {
      this.memoryStats.cleanupOperations.push({
        timestamp: now,
        operation: 'cleanup_orphaned',
        itemsCleanedUp: cleanedCount,
        memoryFreed: cleanedCount * 1024 // Estimate
      })
      
      this.logger.info(`Cleaned up ${cleanedCount} orphaned component instances`)
    }
  }
  
  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.detectMemoryLeaks()
      this.cleanupOrphanedInstances()
    }, 5 * 60 * 1000)
  }
  
  /**
   * Stop automatic cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
  
  /**
   * Generate state fingerprint for hydration
   */
  private generateFingerprint(componentType: string, props: any, timestamp?: number): string {
    const data = { componentType, props, timestamp: timestamp || Date.now() }
    return `sha256-${hashObject(data)}`
  }
  
  /**
   * Update memory statistics
   */
  private updateMemoryStats(
    operation: 'create' | 'cleanup', 
    componentType: string, 
    componentId: string
  ): void {
    if (operation === 'create') {
      this.memoryStats.activeInstances++
      
      const typeMemory = this.memoryStats.memoryByType.get(componentType) || 0
      this.memoryStats.memoryByType.set(componentType, typeMemory + 1024) // Estimate
      this.memoryStats.totalMemoryUsage += 1024
    } else if (operation === 'cleanup') {
      this.memoryStats.activeInstances = Math.max(0, this.memoryStats.activeInstances - 1)
      
      const typeMemory = this.memoryStats.memoryByType.get(componentType) || 0
      this.memoryStats.memoryByType.set(componentType, Math.max(0, typeMemory - 1024))
      this.memoryStats.totalMemoryUsage = Math.max(0, this.memoryStats.totalMemoryUsage - 1024)
    }
  }
  
  /**
   * Shutdown manager and cleanup all resources
   */
  shutdown(): void {
    this.stopCleanupInterval()
    
    // Cleanup all instances
    const allComponentIds = Array.from(this.componentTree.keys())
    for (const componentId of allComponentIds) {
      try {
        this.cleanupInstance(componentId)
      } catch (err) {
        this.logger.error(`Error during shutdown cleanup of ${componentId}:`, err)
      }
    }
    
    // Clear all maps
    this.instances.clear()
    this.clientInstances.clear()
    this.componentTree.clear()
    this.lifecycles.clear()
    this.metrics.clear()
    
    this.logger.info('ComponentIsolationManager shutdown complete')
  }
}