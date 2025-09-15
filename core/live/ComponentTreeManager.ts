/**
 * ComponentTreeManager
 * 
 * Manages hierarchical component relationships and provides tree navigation
 * functionality for nested live components.
 * 
 * Features:
 * - Parent-child relationship tracking
 * - Component tree traversal methods
 * - Hierarchical path generation
 * - Component discovery and navigation
 */

export interface ComponentNode {
  /** Component unique identifier */
  id: string
  
  /** Component type/class name */
  type: string
  
  /** Parent component ID */
  parentId?: string
  
  /** Set of direct child component IDs */
  childIds: Set<string>
  
  /** Component depth in tree (root = 0) */
  depth: number
  
  /** Full hierarchical path (e.g., "dashboard.header.userinfo") */
  path: string
  
  /** Component metadata */
  metadata: {
    /** When component was registered */
    registeredAt: number
    
    /** Component props for context */
    props?: Record<string, any>
    
    /** Current component state */
    state?: Record<string, any>
    
    /** Component lifecycle status */
    status: 'initializing' | 'active' | 'cleanup' | 'disposed'
    
    /** Custom metadata */
    custom?: Record<string, any>
  }
}

export interface ComponentHierarchy {
  /** Current component node */
  node: ComponentNode
  
  /** Parent component (if exists) */
  parent?: ComponentNode
  
  /** Direct children components */
  children: ComponentNode[]
  
  /** Sibling components (same parent) */
  siblings: ComponentNode[]
  
  /** All ancestor components (parents, grandparents, etc.) */
  ancestors: ComponentNode[]
  
  /** All descendant components (children, grandchildren, etc.) */
  descendants: ComponentNode[]
}

export interface ComponentTreeConfig {
  /** Maximum allowed tree depth */
  maxDepth?: number
  
  /** Path separator for hierarchical paths */
  pathSeparator?: string
  
  /** Enable automatic cleanup of orphaned nodes */
  autoCleanup?: boolean
  
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number
  
  /** Maximum number of components in tree */
  maxComponents?: number
}

/**
 * ComponentTreeManager
 * 
 * Manages hierarchical relationships between live components
 */
export class ComponentTreeManager {
  private components = new Map<string, ComponentNode>()
  private config: Required<ComponentTreeConfig>
  private cleanupInterval?: NodeJS.Timeout
  
  constructor(config: ComponentTreeConfig = {}) {
    this.config = {
      maxDepth: config.maxDepth ?? 10,
      pathSeparator: config.pathSeparator ?? '.',
      autoCleanup: config.autoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60000, // 1 minute
      maxComponents: config.maxComponents ?? 1000
    }
    
    if (this.config.autoCleanup) {
      this.startAutoCleanup()
    }
  }
  
  /**
   * Register a component in the tree
   */
  registerComponent(
    id: string,
    type: string,
    parentId?: string,
    props?: Record<string, any>,
    metadata?: Record<string, any>
  ): ComponentNode {
    // Validate component limit
    if (this.components.size >= this.config.maxComponents) {
      throw new Error(`Component limit reached: ${this.config.maxComponents}`)
    }
    
    // Validate parent exists if specified
    if (parentId && !this.components.has(parentId)) {
      throw new Error(`Parent component not found: ${parentId}`)
    }
    
    // Calculate depth and path
    const parent = parentId ? this.components.get(parentId) : undefined
    const depth = parent ? parent.depth + 1 : 0
    
    // Validate depth limit
    if (depth > this.config.maxDepth) {
      throw new Error(`Maximum tree depth exceeded: ${this.config.maxDepth}`)
    }
    
    // Generate hierarchical path
    const path = this.generatePath(type, parent)
    
    // Create component node
    const node: ComponentNode = {
      id,
      type,
      parentId,
      childIds: new Set(),
      depth,
      path,
      metadata: {
        registeredAt: Date.now(),
        props: props ? { ...props } : undefined,
        state: undefined,
        status: 'initializing',
        custom: metadata ? { ...metadata } : undefined
      }
    }
    
    // Add to components map
    this.components.set(id, node)
    
    // Update parent's children
    if (parent) {
      parent.childIds.add(id)
    }
    
    console.log(`[ComponentTreeManager] Registered component: ${id} at path: ${path}`)
    
    return node
  }
  
  /**
   * Unregister a component and its descendants
   */
  unregisterComponent(id: string): boolean {
    const component = this.components.get(id)
    if (!component) {
      return false
    }
    
    // Recursively unregister descendants
    const descendants = this.getDescendants(id)
    for (const descendant of descendants) {
      this.components.delete(descendant.id)
      console.log(`[ComponentTreeManager] Unregistered descendant: ${descendant.id}`)
    }
    
    // Remove from parent's children
    if (component.parentId) {
      const parent = this.components.get(component.parentId)
      if (parent) {
        parent.childIds.delete(id)
      }
    }
    
    // Remove component itself
    this.components.delete(id)
    console.log(`[ComponentTreeManager] Unregistered component: ${id}`)
    
    return true
  }
  
  /**
   * Get component hierarchy information
   */
  getHierarchy(id: string): ComponentHierarchy | null {
    const node = this.components.get(id)
    if (!node) {
      return null
    }
    
    const parent = node.parentId ? this.components.get(node.parentId) : undefined
    const children = Array.from(node.childIds)
      .map(childId => this.components.get(childId))
      .filter((child): child is ComponentNode => child !== undefined)
    
    const siblings = parent 
      ? Array.from(parent.childIds)
          .filter(siblingId => siblingId !== id)
          .map(siblingId => this.components.get(siblingId))
          .filter((sibling): sibling is ComponentNode => sibling !== undefined)
      : []
    
    const ancestors = this.getAncestors(id)
    const descendants = this.getDescendants(id)
    
    return {
      node,
      parent,
      children,
      siblings,
      ancestors,
      descendants
    }
  }
  
  /**
   * Get all descendants of a component
   */
  getDescendants(id: string): ComponentNode[] {
    const component = this.components.get(id)
    if (!component) {
      return []
    }
    
    const descendants: ComponentNode[] = []
    
    const collectDescendants = (nodeId: string) => {
      const node = this.components.get(nodeId)
      if (!node) return
      
      for (const childId of node.childIds) {
        const child = this.components.get(childId)
        if (child) {
          descendants.push(child)
          collectDescendants(childId) // Recursive call
        }
      }
    }
    
    collectDescendants(id)
    return descendants
  }
  
  /**
   * Get all ancestors of a component
   */
  getAncestors(id: string): ComponentNode[] {
    const ancestors: ComponentNode[] = []
    let currentId: string | undefined = id
    
    while (currentId) {
      const component = this.components.get(currentId)
      if (!component || !component.parentId) {
        break
      }
      
      const parent = this.components.get(component.parentId)
      if (parent) {
        ancestors.push(parent)
        currentId = component.parentId
      } else {
        break
      }
    }
    
    return ancestors
  }
  
  /**
   * Get siblings of a component
   */
  getSiblings(id: string): ComponentNode[] {
    const component = this.components.get(id)
    if (!component || !component.parentId) {
      return []
    }
    
    const parent = this.components.get(component.parentId)
    if (!parent) {
      return []
    }
    
    return Array.from(parent.childIds)
      .filter(siblingId => siblingId !== id)
      .map(siblingId => this.components.get(siblingId))
      .filter((sibling): sibling is ComponentNode => sibling !== undefined)
  }
  
  /**
   * Find components by type
   */
  findComponentsByType(type: string): ComponentNode[] {
    return Array.from(this.components.values()).filter(component => 
      component.type === type
    )
  }
  
  /**
   * Find components by path pattern
   */
  findComponentsByPath(pathPattern: string): ComponentNode[] {
    const regex = new RegExp(pathPattern.replace(/\*/g, '.*'))
    return Array.from(this.components.values()).filter(component =>
      regex.test(component.path)
    )
  }
  
  /**
   * Update component state
   */
  updateComponentState(id: string, state: Record<string, any>): boolean {
    const component = this.components.get(id)
    if (!component) {
      return false
    }
    
    component.metadata.state = { ...state }
    return true
  }
  
  /**
   * Update component status
   */
  updateComponentStatus(
    id: string, 
    status: ComponentNode['metadata']['status']
  ): boolean {
    const component = this.components.get(id)
    if (!component) {
      return false
    }
    
    component.metadata.status = status
    return true
  }
  
  /**
   * Get tree statistics
   */
  getTreeStats() {
    const components = Array.from(this.components.values())
    const rootComponents = components.filter(c => !c.parentId)
    const maxDepth = Math.max(...components.map(c => c.depth), 0)
    const totalNodes = components.length
    
    const byType = components.reduce((acc, component) => {
      acc[component.type] = (acc[component.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byStatus = components.reduce((acc, component) => {
      const status = component.metadata.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalNodes,
      rootComponents: rootComponents.length,
      maxDepth,
      averageDepth: totalNodes > 0 ? components.reduce((sum, c) => sum + c.depth, 0) / totalNodes : 0,
      byType,
      byStatus,
      memoryUsage: this.calculateMemoryUsage()
    }
  }
  
  /**
   * Get complete tree structure for debugging
   */
  getTreeStructure(): any {
    const buildTree = (nodeId: string): any => {
      const node = this.components.get(nodeId)
      if (!node) return null
      
      return {
        id: node.id,
        type: node.type,
        path: node.path,
        depth: node.depth,
        status: node.metadata.status,
        children: Array.from(node.childIds).map(buildTree).filter(Boolean)
      }
    }
    
    const rootComponents = Array.from(this.components.values())
      .filter(component => !component.parentId)
    
    return rootComponents.map(root => buildTree(root.id))
  }
  
  /**
   * Cleanup orphaned and disposed components
   */
  cleanup(): number {
    let cleanedCount = 0
    const toRemove: string[] = []
    
    for (const [id, component] of this.components) {
      // Remove disposed components
      if (component.metadata.status === 'disposed') {
        toRemove.push(id)
        continue
      }
      
      // Remove orphaned components (parent doesn't exist)
      if (component.parentId && !this.components.has(component.parentId)) {
        console.warn(`[ComponentTreeManager] Orphaned component detected: ${id}`)
        toRemove.push(id)
        continue
      }
    }
    
    for (const id of toRemove) {
      if (this.unregisterComponent(id)) {
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[ComponentTreeManager] Cleaned up ${cleanedCount} components`)
    }
    
    return cleanedCount
  }
  
  /**
   * Dispose the tree manager
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
    
    this.components.clear()
    console.log('[ComponentTreeManager] Disposed')
  }
  
  // Private methods
  
  private generatePath(type: string, parent?: ComponentNode): string {
    if (!parent) {
      return type
    }
    
    return `${parent.path}${this.config.pathSeparator}${type}`
  }
  
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }
  
  private calculateMemoryUsage(): number {
    // Rough estimation of memory usage
    let totalSize = 0
    
    for (const component of this.components.values()) {
      totalSize += JSON.stringify(component).length * 2 // Approximate bytes
    }
    
    return totalSize
  }
}

// Export singleton instance
export const componentTreeManager = new ComponentTreeManager()