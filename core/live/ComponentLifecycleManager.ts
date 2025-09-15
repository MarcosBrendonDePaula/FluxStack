/**
 * ComponentLifecycleManager
 * 
 * Manages the lifecycle of hierarchical components with dependency tracking
 * and proper initialization/cleanup order.
 * 
 * Features:
 * - Dependency-aware component initialization
 * - Topological sorting for initialization order
 * - Cascading cleanup with proper dependency handling
 * - Automatic mounting of missing dependencies
 * - Lifecycle hooks and event notifications
 */

import { ComponentTreeManager, ComponentNode } from './ComponentTreeManager'

export interface ComponentDependency {
  /** Dependency type */
  type: 'component' | 'service' | 'data' | 'custom'
  
  /** Dependency identifier */
  id: string
  
  /** Is this dependency required? */
  required: boolean
  
  /** Dependency condition */
  condition?: (context: DependencyContext) => boolean
  
  /** Custom dependency resolver */
  resolver?: (context: DependencyContext) => Promise<any>
  
  /** Dependency metadata */
  metadata?: Record<string, any>
}

export interface DependencyContext {
  /** Component requesting the dependency */
  component: ComponentNode
  
  /** Dependency being resolved */
  dependency: ComponentDependency
  
  /** Current resolution depth */
  depth: number
  
  /** Maximum allowed depth */
  maxDepth: number
  
  /** Resolution chain (to detect cycles) */
  resolutionChain: string[]
}

export interface LifecycleHook {
  /** Hook type */
  type: 'beforeInit' | 'afterInit' | 'beforeCleanup' | 'afterCleanup' | 'onError'
  
  /** Hook function */
  handler: (context: LifecycleContext) => Promise<void> | void
  
  /** Hook priority (higher = runs first) */
  priority: number
  
  /** Hook condition */
  condition?: (context: LifecycleContext) => boolean
}

export interface LifecycleContext {
  /** Component being processed */
  component: ComponentNode
  
  /** Lifecycle phase */
  phase: 'initializing' | 'active' | 'cleanup' | 'disposed' | 'error'
  
  /** Dependencies involved */
  dependencies: ComponentDependency[]
  
  /** Error (if any) */
  error?: Error
  
  /** Additional context data */
  data?: Record<string, any>
}

export interface InitializationResult {
  /** Component ID */
  componentId: string
  
  /** Initialization success */
  success: boolean
  
  /** Error (if failed) */
  error?: Error
  
  /** Initialization time (ms) */
  duration: number
  
  /** Dependencies resolved */
  resolvedDependencies: string[]
  
  /** Initialization order */
  order: number
}

export interface CleanupResult {
  /** Component ID */
  componentId: string
  
  /** Cleanup success */
  success: boolean
  
  /** Error (if failed) */
  error?: Error
  
  /** Cleanup time (ms) */
  duration: number
  
  /** Dependencies cleaned */
  cleanedDependencies: string[]
  
  /** Cleanup order */
  order: number
}

export interface LifecycleConfig {
  /** Maximum dependency resolution depth */
  maxDependencyDepth?: number
  
  /** Enable automatic dependency mounting */
  autoMount?: boolean
  
  /** Initialization timeout (ms) */
  initTimeout?: number
  
  /** Cleanup timeout (ms) */
  cleanupTimeout?: number
  
  /** Enable parallel initialization */
  parallelInit?: boolean
  
  /** Maximum parallel operations */
  maxParallel?: number
  
  /** Enable lifecycle hooks */
  enableHooks?: boolean
  
  /** Retry failed initializations */
  retryFailedInit?: boolean
  
  /** Maximum retry attempts */
  maxRetries?: number
}

/**
 * ComponentLifecycleManager
 * 
 * Manages hierarchical component lifecycle with dependency tracking
 */
export class ComponentLifecycleManager {
  private treeManager: ComponentTreeManager
  private config: Required<LifecycleConfig>
  private dependencies = new Map<string, ComponentDependency[]>()
  private hooks = new Map<string, LifecycleHook[]>()
  private initializationOrder = new Map<string, number>()
  private cleanupOrder = new Map<string, number>()
  private activeOperations = new Set<string>()
  
  constructor(
    treeManager: ComponentTreeManager,
    config: LifecycleConfig = {}
  ) {
    this.treeManager = treeManager
    this.config = {
      maxDependencyDepth: config.maxDependencyDepth ?? 10,
      autoMount: config.autoMount ?? true,
      initTimeout: config.initTimeout ?? 30000,
      cleanupTimeout: config.cleanupTimeout ?? 10000,
      parallelInit: config.parallelInit ?? true,
      maxParallel: config.maxParallel ?? 5,
      enableHooks: config.enableHooks ?? true,
      retryFailedInit: config.retryFailedInit ?? true,
      maxRetries: config.maxRetries ?? 3
    }
  }
  
  /**
   * Initialize component with dependency resolution
   */
  async initializeComponent(
    componentId: string,
    dependencies: ComponentDependency[] = [],
    options: {
      force?: boolean
      skipDependencies?: boolean
      timeout?: number
    } = {}
  ): Promise<InitializationResult> {
    const startTime = Date.now()
    
    try {
      // Check if already initializing
      if (this.activeOperations.has(componentId)) {
        throw new Error(`Component ${componentId} is already being initialized`)
      }
      
      this.activeOperations.add(componentId)
      
      const component = this.treeManager.getHierarchy(componentId)
      if (!component) {
        throw new Error(`Component not found: ${componentId}`)
      }
      
      // Check current status
      if (component.node.metadata.status === 'active' && !options.force) {
        return {
          componentId,
          success: true,
          duration: Date.now() - startTime,
          resolvedDependencies: [],
          order: this.initializationOrder.get(componentId) || 0
        }
      }
      
      // Store dependencies
      this.dependencies.set(componentId, dependencies)
      
      // Update status
      this.treeManager.updateComponentStatus(componentId, 'initializing')
      
      // Execute beforeInit hooks
      await this.executeHooks('beforeInit', component.node)
      
      let resolvedDependencies: string[] = []
      
      if (!options.skipDependencies) {
        // Resolve dependencies
        resolvedDependencies = await this.resolveDependencies(
          component.node,
          dependencies,
          options.timeout || this.config.initTimeout
        )
      }
      
      // Get initialization order
      const order = this.calculateInitializationOrder(componentId)
      this.initializationOrder.set(componentId, order)
      
      // Mark as active
      this.treeManager.updateComponentStatus(componentId, 'active')
      
      // Execute afterInit hooks
      await this.executeHooks('afterInit', component.node)
      
      const result: InitializationResult = {
        componentId,
        success: true,
        duration: Date.now() - startTime,
        resolvedDependencies,
        order
      }
      
      console.log(`[ComponentLifecycleManager] Initialized component: ${componentId} (order: ${order})`)
      return result
      
    } catch (error) {
      // Execute error hooks
      if (this.config.enableHooks) {
        const component = this.treeManager.getHierarchy(componentId)
        if (component) {
          await this.executeHooks('onError', component.node, error as Error)
        }
      }
      
      // Update status
      this.treeManager.updateComponentStatus(componentId, 'error')
      
      return {
        componentId,
        success: false,
        error: error as Error,
        duration: Date.now() - startTime,
        resolvedDependencies: [],
        order: 0
      }
    } finally {
      this.activeOperations.delete(componentId)
    }
  }
  
  /**
   * Cleanup component and its dependents
   */
  async cleanupComponent(
    componentId: string,
    options: {
      force?: boolean
      recursive?: boolean
      timeout?: number
    } = {}
  ): Promise<CleanupResult> {
    const startTime = Date.now()
    
    try {
      // Check if already cleaning up
      if (this.activeOperations.has(componentId)) {
        throw new Error(`Component ${componentId} is already being processed`)
      }
      
      this.activeOperations.add(componentId)
      
      const component = this.treeManager.getHierarchy(componentId)
      if (!component) {
        throw new Error(`Component not found: ${componentId}`)
      }
      
      // Update status
      this.treeManager.updateComponentStatus(componentId, 'cleanup')
      
      // Execute beforeCleanup hooks
      await this.executeHooks('beforeCleanup', component.node)
      
      let cleanedDependencies: string[] = []
      
      if (options.recursive) {
        // Cleanup dependents first (reverse topological order)
        const dependents = this.findComponentDependents(componentId)
        for (const dependentId of dependents) {
          const dependentResult = await this.cleanupComponent(dependentId, {
            ...options,
            recursive: false // Avoid infinite recursion
          })
          if (dependentResult.success) {
            cleanedDependencies.push(dependentId)
          }
        }
      }
      
      // Get cleanup order
      const order = this.calculateCleanupOrder(componentId)
      this.cleanupOrder.set(componentId, order)
      
      // Cleanup dependencies
      const dependencies = this.dependencies.get(componentId) || []
      for (const dependency of dependencies) {
        if (dependency.type === 'component') {
          cleanedDependencies.push(dependency.id)
        }
      }
      
      // Remove from dependencies
      this.dependencies.delete(componentId)
      this.initializationOrder.delete(componentId)
      this.cleanupOrder.delete(componentId)
      
      // Mark as disposed
      this.treeManager.updateComponentStatus(componentId, 'disposed')
      
      // Execute afterCleanup hooks
      await this.executeHooks('afterCleanup', component.node)
      
      const result: CleanupResult = {
        componentId,
        success: true,
        duration: Date.now() - startTime,
        cleanedDependencies,
        order
      }
      
      console.log(`[ComponentLifecycleManager] Cleaned up component: ${componentId} (order: ${order})`)
      return result
      
    } catch (error) {
      // Execute error hooks
      if (this.config.enableHooks) {
        const component = this.treeManager.getHierarchy(componentId)
        if (component) {
          await this.executeHooks('onError', component.node, error as Error)
        }
      }
      
      return {
        componentId,
        success: false,
        error: error as Error,
        duration: Date.now() - startTime,
        cleanedDependencies: [],
        order: 0
      }
    } finally {
      this.activeOperations.delete(componentId)
    }
  }
  
  /**
   * Get initialization order for components
   */
  getInitializationOrder(componentIds: string[]): string[] {
    return this.topologicalSort(componentIds, 'init')
  }
  
  /**
   * Get cleanup order for components (reverse of initialization)
   */
  getCleanupOrder(componentIds: string[]): string[] {
    return this.topologicalSort(componentIds, 'cleanup')
  }
  
  /**
   * Auto-mount missing dependencies
   */
  async autoMountDependencies(componentId: string): Promise<string[]> {
    if (!this.config.autoMount) {
      return []
    }
    
    const dependencies = this.dependencies.get(componentId) || []
    const mountedDependencies: string[] = []
    
    for (const dependency of dependencies) {
      if (dependency.type === 'component' && dependency.required) {
        const dependentComponent = this.treeManager.getHierarchy(dependency.id)
        
        if (!dependentComponent || dependentComponent.node.metadata.status === 'disposed') {
          try {
            // Try to auto-mount the dependency
            if (dependency.resolver) {
              await dependency.resolver({
                component: this.treeManager.getHierarchy(componentId)!.node,
                dependency,
                depth: 0,
                maxDepth: this.config.maxDependencyDepth,
                resolutionChain: [componentId]
              })
              mountedDependencies.push(dependency.id)
            }
          } catch (error) {
            console.warn(`[ComponentLifecycleManager] Failed to auto-mount dependency: ${dependency.id}`, error)
          }
        }
      }
    }
    
    return mountedDependencies
  }
  
  /**
   * Add lifecycle hook
   */
  addLifecycleHook(componentId: string, hook: LifecycleHook): void {
    if (!this.hooks.has(componentId)) {
      this.hooks.set(componentId, [])
    }
    
    const componentHooks = this.hooks.get(componentId)!
    componentHooks.push(hook)
    
    // Sort by priority (highest first)
    componentHooks.sort((a, b) => b.priority - a.priority)
  }
  
  /**
   * Remove lifecycle hook
   */
  removeLifecycleHook(componentId: string, hookType: LifecycleHook['type']): boolean {
    const componentHooks = this.hooks.get(componentId)
    if (!componentHooks) {
      return false
    }
    
    const index = componentHooks.findIndex(hook => hook.type === hookType)
    if (index >= 0) {
      componentHooks.splice(index, 1)
      return true
    }
    
    return false
  }
  
  /**
   * Get component lifecycle status
   */
  getLifecycleStatus(): Record<string, any> {
    const components = Array.from(this.dependencies.keys())
    const status: Record<string, any> = {}
    
    for (const componentId of components) {
      const hierarchy = this.treeManager.getHierarchy(componentId)
      if (hierarchy) {
        status[componentId] = {
          status: hierarchy.node.metadata.status,
          dependencies: this.dependencies.get(componentId)?.length || 0,
          initOrder: this.initializationOrder.get(componentId),
          cleanupOrder: this.cleanupOrder.get(componentId),
          isActive: this.activeOperations.has(componentId)
        }
      }
    }
    
    return status
  }
  
  // Private methods
  
  private async resolveDependencies(
    component: ComponentNode,
    dependencies: ComponentDependency[],
    timeout: number
  ): Promise<string[]> {
    const resolved: string[] = []
    const promises: Promise<void>[] = []
    
    for (const dependency of dependencies) {
      const promise = this.resolveDependency(component, dependency, 0)
        .then(() => {
          resolved.push(dependency.id)
        })
        .catch(error => {
          if (dependency.required) {
            throw error
          }
          console.warn(`[ComponentLifecycleManager] Optional dependency failed: ${dependency.id}`, error)
        })
      
      promises.push(promise)
    }
    
    // Wait for all dependencies with timeout
    await Promise.race([
      Promise.all(promises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Dependency resolution timeout')), timeout)
      )
    ])
    
    return resolved
  }
  
  private async resolveDependency(
    component: ComponentNode,
    dependency: ComponentDependency,
    depth: number
  ): Promise<void> {
    if (depth > this.config.maxDependencyDepth) {
      throw new Error(`Maximum dependency depth exceeded: ${this.config.maxDependencyDepth}`)
    }
    
    const context: DependencyContext = {
      component,
      dependency,
      depth,
      maxDepth: this.config.maxDependencyDepth,
      resolutionChain: [component.id]
    }
    
    // Check condition
    if (dependency.condition && !dependency.condition(context)) {
      return
    }
    
    // Check for circular dependencies
    if (context.resolutionChain.includes(dependency.id)) {
      throw new Error(`Circular dependency detected: ${context.resolutionChain.join(' -> ')} -> ${dependency.id}`)
    }
    
    // Use custom resolver if available
    if (dependency.resolver) {
      await dependency.resolver(context)
      return
    }
    
    // Default resolution based on type
    switch (dependency.type) {
      case 'component':
        await this.resolveComponentDependency(dependency, context)
        break
      case 'service':
        await this.resolveServiceDependency(dependency, context)
        break
      case 'data':
        await this.resolveDataDependency(dependency, context)
        break
      default:
        console.warn(`[ComponentLifecycleManager] Unknown dependency type: ${dependency.type}`)
    }
  }
  
  private async resolveComponentDependency(
    dependency: ComponentDependency,
    context: DependencyContext
  ): Promise<void> {
    const dependentComponent = this.treeManager.getHierarchy(dependency.id)
    
    if (!dependentComponent) {
      if (dependency.required) {
        throw new Error(`Required component dependency not found: ${dependency.id}`)
      }
      return
    }
    
    // Initialize dependent component if needed
    if (dependentComponent.node.metadata.status !== 'active') {
      const dependentDependencies = this.dependencies.get(dependency.id) || []
      await this.initializeComponent(dependency.id, dependentDependencies)
    }
  }
  
  private async resolveServiceDependency(
    dependency: ComponentDependency,
    context: DependencyContext
  ): Promise<void> {
    // Service dependency resolution (placeholder)
    console.log(`[ComponentLifecycleManager] Resolving service dependency: ${dependency.id}`)
  }
  
  private async resolveDataDependency(
    dependency: ComponentDependency,
    context: DependencyContext
  ): Promise<void> {
    // Data dependency resolution (placeholder)
    console.log(`[ComponentLifecycleManager] Resolving data dependency: ${dependency.id}`)
  }
  
  private findComponentDependents(componentId: string): string[] {
    const dependents: string[] = []
    
    for (const [id, dependencies] of this.dependencies) {
      if (dependencies.some(dep => dep.id === componentId)) {
        dependents.push(id)
      }
    }
    
    return dependents
  }
  
  private topologicalSort(componentIds: string[], mode: 'init' | 'cleanup'): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const result: string[] = []
    
    const visit = (id: string) => {
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected involving: ${id}`)
      }
      
      if (visited.has(id)) {
        return
      }
      
      visiting.add(id)
      
      const dependencies = this.dependencies.get(id) || []
      const relatedIds = mode === 'init' 
        ? dependencies.map(dep => dep.id)
        : this.findComponentDependents(id)
      
      for (const relatedId of relatedIds) {
        if (componentIds.includes(relatedId)) {
          visit(relatedId)
        }
      }
      
      visiting.delete(id)
      visited.add(id)
      result.push(id)
    }
    
    for (const id of componentIds) {
      if (!visited.has(id)) {
        visit(id)
      }
    }
    
    return mode === 'cleanup' ? result.reverse() : result
  }
  
  private calculateInitializationOrder(componentId: string): number {
    const hierarchy = this.treeManager.getHierarchy(componentId)
    if (!hierarchy) {
      return 0
    }
    
    // Base order on depth and dependency count
    const dependencyCount = this.dependencies.get(componentId)?.length || 0
    return hierarchy.node.depth * 100 + dependencyCount
  }
  
  private calculateCleanupOrder(componentId: string): number {
    const hierarchy = this.treeManager.getHierarchy(componentId)
    if (!hierarchy) {
      return 0
    }
    
    // Reverse of initialization order
    const dependentCount = this.findComponentDependents(componentId).length
    return (10 - hierarchy.node.depth) * 100 + dependentCount
  }
  
  private async executeHooks(
    type: LifecycleHook['type'],
    component: ComponentNode,
    error?: Error
  ): Promise<void> {
    if (!this.config.enableHooks) {
      return
    }
    
    const componentHooks = this.hooks.get(component.id) || []
    const applicableHooks = componentHooks.filter(hook => 
      hook.type === type && (!hook.condition || hook.condition({
        component,
        phase: component.metadata.status,
        dependencies: this.dependencies.get(component.id) || [],
        error
      }))
    )
    
    for (const hook of applicableHooks) {
      try {
        await hook.handler({
          component,
          phase: component.metadata.status,
          dependencies: this.dependencies.get(component.id) || [],
          error
        })
      } catch (hookError) {
        console.error(`[ComponentLifecycleManager] Hook error in ${component.id}:`, hookError)
      }
    }
  }
}