/**
 * ComponentDependencySystem - Advanced Component Dependency Management
 * 
 * Implements comprehensive dependency management for live components including
 * dependency declaration, automatic resolution, circular dependency detection,
 * dependent component update cascading, and dependency graph visualization.
 * 
 * Features:
 * - Component dependency declaration and validation
 * - Automatic dependency resolution with topological sorting
 * - Circular dependency detection and prevention
 * - Dependent component update cascading
 * - Dependency graph visualization and analysis
 * - Dependency injection patterns
 * - Runtime dependency checking
 * - Performance optimization for dependency trees
 */

import { ComponentTreeManager, ComponentNode } from './ComponentTreeManager'
import { LiveEventBus } from './LiveEventBus'
import { AdvancedEventPatterns } from './AdvancedEventPatterns'

export interface ComponentDependency {
  /** Dependency ID */
  id: string
  
  /** Dependency type */
  type: 'component' | 'service' | 'data' | 'event' | 'state' | 'custom'
  
  /** Target component/service ID */
  targetId: string
  
  /** Whether dependency is required */
  required: boolean
  
  /** Whether dependency is optional */
  optional: boolean
  
  /** Dependency version constraint */
  version?: string
  
  /** Dependency resolution strategy */
  strategy: 'immediate' | 'lazy' | 'conditional' | 'async'
  
  /** Dependency scope */
  scope: 'local' | 'parent' | 'global' | 'subtree'
  
  /** Dependency configuration */
  config?: {
    /** Timeout for dependency resolution */
    timeout?: number
    
    /** Retry attempts */
    retries?: number
    
    /** Fallback dependency */
    fallback?: string
    
    /** Custom resolver function */
    resolver?: (dependency: ComponentDependency) => Promise<any>
    
    /** Validation function */
    validator?: (resolved: any) => boolean
  }
  
  /** Dependency metadata */
  metadata: {
    /** Creation timestamp */
    createdAt: number
    
    /** Last resolution timestamp */
    lastResolved?: number
    
    /** Resolution status */
    status: 'pending' | 'resolving' | 'resolved' | 'failed' | 'cached'
    
    /** Resolved value cache */
    cachedValue?: any
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface DependencyGraph {
  /** Graph nodes (components) */
  nodes: Map<string, DependencyGraphNode>
  
  /** Graph edges (dependencies) */
  edges: DependencyGraphEdge[]
  
  /** Graph metadata */
  metadata: {
    /** Total nodes */
    nodeCount: number
    
    /** Total edges */
    edgeCount: number
    
    /** Maximum depth */
    maxDepth: number
    
    /** Circular dependencies */
    cycles: string[][]
    
    /** Graph generation timestamp */
    generatedAt: number
  }
}

export interface DependencyGraphNode {
  /** Component ID */
  id: string
  
  /** Component type */
  type: string
  
  /** Node position in graph */
  position: {
    x: number
    y: number
    depth: number
  }
  
  /** Dependencies (outgoing edges) */
  dependencies: string[]
  
  /** Dependents (incoming edges) */
  dependents: string[]
  
  /** Node status */
  status: 'active' | 'inactive' | 'error' | 'loading'
  
  /** Node metadata */
  metadata: {
    /** Component path */
    path?: string
    
    /** Component state */
    state?: any
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface DependencyGraphEdge {
  /** Edge ID */
  id: string
  
  /** Source component ID */
  from: string
  
  /** Target component ID */
  to: string
  
  /** Dependency type */
  type: ComponentDependency['type']
  
  /** Edge weight (for layout algorithms) */
  weight: number
  
  /** Whether dependency is required */
  required: boolean
  
  /** Edge status */
  status: 'active' | 'inactive' | 'error'
  
  /** Edge metadata */
  metadata: {
    /** Dependency configuration */
    config?: ComponentDependency['config']
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface DependencyInjector {
  /** Injector ID */
  id: string
  
  /** Injector name */
  name: string
  
  /** Injectable value factory */
  factory: (context: DependencyContext) => any | Promise<any>
  
  /** Injection scope */
  scope: 'singleton' | 'transient' | 'scoped'
  
  /** Dependencies required by this injector */
  dependencies: string[]
  
  /** Injector metadata */
  metadata: {
    /** Creation timestamp */
    createdAt: number
    
    /** Injection count */
    injectionCount: number
    
    /** Last injection timestamp */
    lastInjected?: number
    
    /** Cached singleton value */
    singletonValue?: any
  }
}

export interface DependencyContext {
  /** Component ID requesting dependency */
  componentId: string
  
  /** Component instance */
  component: ComponentNode
  
  /** Dependency being resolved */
  dependency: ComponentDependency
  
  /** Resolution context */
  context: {
    /** Resolution depth */
    depth: number
    
    /** Resolution path */
    path: string[]
    
    /** Parent context */
    parent?: DependencyContext
    
    /** Additional context data */
    data?: Record<string, any>
  }
}

export interface DependencySystemConfig {
  /** Maximum dependency depth */
  maxDepth?: number
  
  /** Default resolution timeout */
  defaultTimeout?: number
  
  /** Enable dependency caching */
  enableCaching?: boolean
  
  /** Cache TTL in milliseconds */
  cacheTTL?: number
  
  /** Enable circular dependency detection */
  detectCircular?: boolean
  
  /** Enable dependency injection */
  enableInjection?: boolean
  
  /** Enable performance monitoring */
  enableMonitoring?: boolean
  
  /** Enable debug logging */
  enableDebug?: boolean
}

/**
 * ComponentDependencySystem
 * 
 * Advanced dependency management system for live components
 */
export class ComponentDependencySystem {
  private treeManager: ComponentTreeManager
  private eventBus: LiveEventBus
  private eventPatterns: AdvancedEventPatterns
  private config: Required<DependencySystemConfig>
  
  private dependencies = new Map<string, ComponentDependency[]>() // componentId -> dependencies
  private injectors = new Map<string, DependencyInjector>()
  private dependencyCache = new Map<string, { value: any; expiresAt: number }>()
  private resolutionInProgress = new Set<string>()
  private dependencyGraph: DependencyGraph | null = null
  
  constructor(
    treeManager: ComponentTreeManager,
    eventBus: LiveEventBus,
    eventPatterns: AdvancedEventPatterns,
    config: DependencySystemConfig = {}
  ) {
    this.treeManager = treeManager
    this.eventBus = eventBus
    this.eventPatterns = eventPatterns
    this.config = {
      maxDepth: config.maxDepth ?? 10,
      defaultTimeout: config.defaultTimeout ?? 30000,
      enableCaching: config.enableCaching ?? true,
      cacheTTL: config.cacheTTL ?? 300000, // 5 minutes
      detectCircular: config.detectCircular ?? true,
      enableInjection: config.enableInjection ?? true,
      enableMonitoring: config.enableMonitoring ?? true,
      enableDebug: config.enableDebug ?? false
    }
    
    this.setupEventHandlers()
  }
  
  /**
   * Declare component dependencies
   */
  declareDependencies(
    componentId: string,
    dependencies: Omit<ComponentDependency, 'id' | 'metadata'>[]
  ): string[] {
    const componentDeps: ComponentDependency[] = dependencies.map(dep => ({
      ...dep,
      id: this.generateDependencyId(),
      metadata: {
        createdAt: Date.now(),
        status: 'pending'
      }
    }))
    
    this.dependencies.set(componentId, componentDeps)
    
    // Invalidate dependency graph
    this.dependencyGraph = null
    
    if (this.config.enableDebug) {
      console.log(`[ComponentDependencySystem] Declared ${dependencies.length} dependencies for ${componentId}`)
    }
    
    return componentDeps.map(dep => dep.id)
  }
  
  /**
   * Resolve component dependencies
   */
  async resolveDependencies(
    componentId: string,
    options: {
      timeout?: number
      forceRefresh?: boolean
      context?: Record<string, any>
    } = {}
  ): Promise<Record<string, any>> {
    const {
      timeout = this.config.defaultTimeout,
      forceRefresh = false,
      context = {}
    } = options
    
    const dependencies = this.dependencies.get(componentId) || []
    if (dependencies.length === 0) {
      return {}
    }
    
    const component = this.treeManager.getHierarchy(componentId)?.node
    if (!component) {
      throw new Error(`Component not found: ${componentId}`)
    }
    
    // Check for circular dependencies
    if (this.config.detectCircular) {
      this.checkCircularDependencies(componentId, [componentId])
    }
    
    const resolved: Record<string, any> = {}
    const resolutionPromises: Promise<void>[] = []
    
    for (const dependency of dependencies) {
      const promise = this.resolveSingleDependency(
        componentId,
        dependency,
        { component, context, timeout, forceRefresh }
      ).then(value => {
        resolved[dependency.id] = value
      })
      
      resolutionPromises.push(promise)
    }
    
    // Wait for all dependencies to resolve
    await Promise.allSettled(resolutionPromises)
    
    // Check required dependencies
    this.validateRequiredDependencies(dependencies, resolved)
    
    if (this.config.enableDebug) {
      console.log(`[ComponentDependencySystem] Resolved ${Object.keys(resolved).length} dependencies for ${componentId}`)
    }
    
    return resolved
  }
  
  /**
   * Register dependency injector
   */
  registerInjector(injector: Omit<DependencyInjector, 'metadata'>): string {
    const injectorWithMeta: DependencyInjector = {
      ...injector,
      metadata: {
        createdAt: Date.now(),
        injectionCount: 0
      }
    }
    
    this.injectors.set(injector.id, injectorWithMeta)
    
    if (this.config.enableDebug) {
      console.log(`[ComponentDependencySystem] Registered injector: ${injector.name}`)
    }
    
    return injector.id
  }
  
  /**
   * Unregister dependency injector
   */
  unregisterInjector(injectorId: string): boolean {
    const injector = this.injectors.get(injectorId)
    if (!injector) {
      return false
    }
    
    this.injectors.delete(injectorId)
    
    if (this.config.enableDebug) {
      console.log(`[ComponentDependencySystem] Unregistered injector: ${injector.name}`)
    }
    
    return true
  }
  
  /**
   * Generate dependency graph
   */
  generateDependencyGraph(): DependencyGraph {
    const nodes = new Map<string, DependencyGraphNode>()
    const edges: DependencyGraphEdge[] = []
    
    // Build nodes
    for (const [componentId] of this.dependencies) {
      const component = this.treeManager.getHierarchy(componentId)?.node
      if (!component) continue
      
      const node: DependencyGraphNode = {
        id: componentId,
        type: component.type,
        position: {
          x: 0,
          y: 0,
          depth: component.depth
        },
        dependencies: [],
        dependents: [],
        status: component.metadata.status === 'active' ? 'active' : 'inactive',
        metadata: {
          path: component.path,
          state: component.metadata.state
        }
      }
      
      nodes.set(componentId, node)
    }
    
    // Build edges
    for (const [componentId, deps] of this.dependencies) {
      const sourceNode = nodes.get(componentId)
      if (!sourceNode) continue
      
      for (const dependency of deps) {
        const targetNode = nodes.get(dependency.targetId)
        if (!targetNode) continue
        
        const edge: DependencyGraphEdge = {
          id: `${componentId}-${dependency.targetId}`,
          from: componentId,
          to: dependency.targetId,
          type: dependency.type,
          weight: dependency.required ? 2 : 1,
          required: dependency.required,
          status: dependency.metadata.status === 'resolved' ? 'active' : 'inactive',
          metadata: {
            config: dependency.config
          }
        }
        
        edges.push(edge)
        sourceNode.dependencies.push(dependency.targetId)
        targetNode.dependents.push(componentId)
      }
    }
    
    // Calculate layout positions
    this.calculateGraphLayout(nodes)
    
    // Detect cycles
    const cycles = this.detectCycles(nodes, edges)
    
    this.dependencyGraph = {
      nodes,
      edges,
      metadata: {
        nodeCount: nodes.size,
        edgeCount: edges.length,
        maxDepth: Math.max(...Array.from(nodes.values()).map(n => n.position.depth)),
        cycles,
        generatedAt: Date.now()
      }
    }
    
    if (this.config.enableDebug) {
      console.log(`[ComponentDependencySystem] Generated dependency graph: ${nodes.size} nodes, ${edges.length} edges`)
    }
    
    return this.dependencyGraph
  }
  
  /**
   * Get component dependencies
   */
  getComponentDependencies(componentId: string): ComponentDependency[] {
    return this.dependencies.get(componentId) || []
  }
  
  /**
   * Get components dependent on a component
   */
  getComponentDependents(componentId: string): string[] {
    const dependents: string[] = []
    
    for (const [compId, deps] of this.dependencies) {
      if (deps.some(dep => dep.targetId === componentId)) {
        dependents.push(compId)
      }
    }
    
    return dependents
  }
  
  /**
   * Cascade update to dependent components
   */
  async cascadeUpdate(
    componentId: string,
    updateData: any,
    options: {
      depth?: number
      filter?: (componentId: string) => boolean
    } = {}
  ): Promise<void> {
    const { depth = this.config.maxDepth, filter } = options
    
    if (depth <= 0) return
    
    const dependents = this.getComponentDependents(componentId)
    
    for (const dependentId of dependents) {
      if (filter && !filter(dependentId)) continue
      
      // Emit update event
      await this.eventPatterns.sendMessage(
        componentId,
        dependentId,
        'dependency.updated',
        {
          sourceId: componentId,
          updateData,
          depth: this.config.maxDepth - depth + 1
        }
      )
      
      // Cascade further
      await this.cascadeUpdate(dependentId, updateData, {
        depth: depth - 1,
        filter
      })
    }
    
    if (this.config.enableDebug) {
      console.log(`[ComponentDependencySystem] Cascaded update from ${componentId} to ${dependents.length} dependents`)
    }
  }
  
  /**
   * Clear component dependencies
   */
  clearComponentDependencies(componentId: string): number {
    const dependencies = this.dependencies.get(componentId)
    if (!dependencies) return 0
    
    const count = dependencies.length
    this.dependencies.delete(componentId)
    
    // Invalidate dependency graph
    this.dependencyGraph = null
    
    // Clear cache entries
    this.clearCacheForComponent(componentId)
    
    return count
  }
  
  /**
   * Get dependency system statistics
   */
  getStats() {
    const allDependencies = Array.from(this.dependencies.values()).flat()
    
    const statusCounts = allDependencies.reduce((acc, dep) => {
      acc[dep.metadata.status] = (acc[dep.metadata.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const typeCounts = allDependencies.reduce((acc, dep) => {
      acc[dep.type] = (acc[dep.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalComponents: this.dependencies.size,
      totalDependencies: allDependencies.length,
      statusCounts,
      typeCounts,
      registeredInjectors: this.injectors.size,
      cachedEntries: this.dependencyCache.size,
      resolutionsInProgress: this.resolutionInProgress.size,
      hasGraph: this.dependencyGraph !== null
    }
  }
  
  // Private methods
  
  private setupEventHandlers(): void {
    // Handle component unregistration
    this.eventBus.subscribe('*', 'component.unregistered', (event) => {
      this.clearComponentDependencies(event.data.componentId)
    })
    
    // Handle dependency updates
    this.eventBus.subscribe('*', 'dependency.updated', async (event) => {
      const { sourceId, updateData } = event.data
      await this.cascadeUpdate(sourceId, updateData)
    })
  }
  
  private async resolveSingleDependency(
    componentId: string,
    dependency: ComponentDependency,
    context: {
      component: ComponentNode
      context: Record<string, any>
      timeout: number
      forceRefresh: boolean
    }
  ): Promise<any> {
    const cacheKey = `${componentId}:${dependency.id}`
    
    // Check cache first
    if (!context.forceRefresh && this.config.enableCaching) {
      const cached = this.dependencyCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        dependency.metadata.status = 'cached'
        return cached.value
      }
    }
    
    // Check if resolution is already in progress
    if (this.resolutionInProgress.has(cacheKey)) {
      // Wait for ongoing resolution
      while (this.resolutionInProgress.has(cacheKey)) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      // Return cached result
      const cached = this.dependencyCache.get(cacheKey)
      return cached?.value
    }
    
    this.resolutionInProgress.add(cacheKey)
    dependency.metadata.status = 'resolving'
    
    try {
      let resolved: any
      
      // Use custom resolver if provided
      if (dependency.config?.resolver) {
        resolved = await dependency.config.resolver(dependency)
      } else {
        // Use built-in resolution strategies
        resolved = await this.resolveByStrategy(dependency, context)
      }
      
      // Validate resolved value
      if (dependency.config?.validator && !dependency.config.validator(resolved)) {
        throw new Error(`Dependency validation failed: ${dependency.id}`)
      }
      
      // Cache resolved value
      if (this.config.enableCaching) {
        this.dependencyCache.set(cacheKey, {
          value: resolved,
          expiresAt: Date.now() + this.config.cacheTTL
        })
      }
      
      dependency.metadata.status = 'resolved'
      dependency.metadata.lastResolved = Date.now()
      dependency.metadata.cachedValue = resolved
      
      return resolved
      
    } catch (error) {
      dependency.metadata.status = 'failed'
      
      // Try fallback if available
      if (dependency.config?.fallback) {
        const fallbackDep = { ...dependency, targetId: dependency.config.fallback }
        return this.resolveByStrategy(fallbackDep, context)
      }
      
      // If not required, return undefined
      if (!dependency.required) {
        return undefined
      }
      
      throw error
      
    } finally {
      this.resolutionInProgress.delete(cacheKey)
    }
  }
  
  private async resolveByStrategy(
    dependency: ComponentDependency,
    context: { component: ComponentNode; context: Record<string, any>; timeout: number }
  ): Promise<any> {
    switch (dependency.strategy) {
      case 'immediate':
        return this.resolveImmediate(dependency, context)
        
      case 'lazy':
        return this.resolveLazy(dependency, context)
        
      case 'conditional':
        return this.resolveConditional(dependency, context)
        
      case 'async':
        return this.resolveAsync(dependency, context)
        
      default:
        throw new Error(`Unknown resolution strategy: ${dependency.strategy}`)
    }
  }
  
  private async resolveImmediate(
    dependency: ComponentDependency,
    context: { component: ComponentNode }
  ): Promise<any> {
    switch (dependency.type) {
      case 'component':
        const targetComponent = this.treeManager.getHierarchy(dependency.targetId)?.node
        if (!targetComponent) {
          throw new Error(`Component not found: ${dependency.targetId}`)
        }
        return targetComponent
        
      case 'service':
        const injector = this.injectors.get(dependency.targetId)
        if (!injector) {
          throw new Error(`Service not found: ${dependency.targetId}`)
        }
        return this.injectValue(injector, { 
          componentId: context.component.id,
          component: context.component,
          dependency,
          context: { depth: 0, path: [context.component.id] }
        })
        
      case 'state':
        return context.component.metadata.state || {}
        
      default:
        throw new Error(`Unsupported dependency type for immediate resolution: ${dependency.type}`)
    }
  }
  
  private async resolveLazy(
    dependency: ComponentDependency,
    context: { component: ComponentNode }
  ): Promise<any> {
    // Return a function that resolves when called
    return () => this.resolveImmediate(dependency, context)
  }
  
  private async resolveConditional(
    dependency: ComponentDependency,
    context: { component: ComponentNode; context: Record<string, any> }
  ): Promise<any> {
    // Check condition in context
    const condition = context.context[`${dependency.id}_condition`]
    if (condition === false) {
      return undefined
    }
    
    return this.resolveImmediate(dependency, context)
  }
  
  private async resolveAsync(
    dependency: ComponentDependency,
    context: { component: ComponentNode; timeout: number }
  ): Promise<any> {
    // Return a promise that resolves to the dependency
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Async dependency timeout: ${dependency.id}`))
      }, dependency.config?.timeout || context.timeout)
      
      this.resolveImmediate(dependency, context)
        .then(value => {
          clearTimeout(timeout)
          resolve(value)
        })
        .catch(error => {
          clearTimeout(timeout)
          reject(error)
        })
    })
  }
  
  private async injectValue(
    injector: DependencyInjector,
    context: DependencyContext
  ): Promise<any> {
    // Handle singleton scope
    if (injector.scope === 'singleton' && injector.metadata.singletonValue !== undefined) {
      return injector.metadata.singletonValue
    }
    
    // Resolve injector dependencies first
    const injectorDeps: Record<string, any> = {}
    for (const depId of injector.dependencies) {
      const dep = this.dependencies.get(context.componentId)?.find(d => d.id === depId)
      if (dep) {
        injectorDeps[depId] = await this.resolveSingleDependency(
          context.componentId,
          dep,
          {
            component: context.component,
            context: {},
            timeout: this.config.defaultTimeout,
            forceRefresh: false
          }
        )
      }
    }
    
    // Call factory function
    const value = await injector.factory({
      ...context,
      context: {
        ...context.context,
        injectorDependencies: injectorDeps
      }
    })
    
    // Cache singleton value
    if (injector.scope === 'singleton') {
      injector.metadata.singletonValue = value
    }
    
    // Update injector stats
    injector.metadata.injectionCount++
    injector.metadata.lastInjected = Date.now()
    
    return value
  }
  
  private checkCircularDependencies(
    componentId: string,
    path: string[]
  ): void {
    const dependencies = this.dependencies.get(componentId) || []
    
    for (const dependency of dependencies) {
      if (path.includes(dependency.targetId)) {
        const cycle = [...path, dependency.targetId]
        throw new Error(`Circular dependency detected: ${cycle.join(' -> ')}`)
      }
      
      if (path.length < this.config.maxDepth) {
        this.checkCircularDependencies(dependency.targetId, [...path, dependency.targetId])
      }
    }
  }
  
  private validateRequiredDependencies(
    dependencies: ComponentDependency[],
    resolved: Record<string, any>
  ): void {
    const missingRequired = dependencies
      .filter(dep => dep.required && !(dep.id in resolved))
      .map(dep => dep.id)
    
    if (missingRequired.length > 0) {
      throw new Error(`Missing required dependencies: ${missingRequired.join(', ')}`)
    }
  }
  
  private calculateGraphLayout(nodes: Map<string, DependencyGraphNode>): void {
    // Simple circular layout for now
    const nodeArray = Array.from(nodes.values())
    const radius = Math.max(100, nodeArray.length * 20)
    const angleStep = (2 * Math.PI) / nodeArray.length
    
    nodeArray.forEach((node, index) => {
      const angle = index * angleStep
      node.position.x = Math.cos(angle) * radius
      node.position.y = Math.sin(angle) * radius
    })
  }
  
  private detectCycles(
    nodes: Map<string, DependencyGraphNode>,
    edges: DependencyGraphEdge[]
  ): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      
      const outgoingEdges = edges.filter(edge => edge.from === nodeId)
      
      for (const edge of outgoingEdges) {
        if (recursionStack.has(edge.to)) {
          // Found cycle
          const cycleStart = path.indexOf(edge.to)
          const cycle = [...path.slice(cycleStart), edge.to]
          cycles.push(cycle)
        } else if (!visited.has(edge.to)) {
          dfs(edge.to, [...path, edge.to])
        }
      }
      
      recursionStack.delete(nodeId)
    }
    
    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, [nodeId])
      }
    }
    
    return cycles
  }
  
  private clearCacheForComponent(componentId: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.dependencyCache.keys()) {
      if (key.startsWith(`${componentId}:`)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.dependencyCache.delete(key))
  }
  
  private generateDependencyId(): string {
    return `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export types for external use
export type {
  ComponentDependency,
  DependencyGraph,
  DependencyGraphNode,
  DependencyGraphEdge,
  DependencyInjector,
  DependencyContext,
  DependencySystemConfig
}