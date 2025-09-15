/**
 * ParentChildStateManager
 * 
 * Manages state sharing and inheritance between parent and child components
 * in hierarchical live component structures.
 * 
 * Features:
 * - State inheritance from parent to children
 * - State bubbling from children to parents
 * - Conflict resolution for inherited state
 * - State change notifications across hierarchy
 */

import { ComponentTreeManager, ComponentNode } from './ComponentTreeManager'

export interface StateInheritanceRule {
  /** State key pattern to inherit (supports wildcards) */
  keyPattern: string
  
  /** Inheritance mode */
  mode: 'inherit' | 'merge' | 'override' | 'ignore'
  
  /** Direction of inheritance */
  direction: 'down' | 'up' | 'both'
  
  /** Custom transformation function */
  transform?: (value: any, context: StateInheritanceContext) => any
  
  /** Condition for when rule applies */
  condition?: (context: StateInheritanceContext) => boolean
}

export interface StateInheritanceContext {
  /** Source component */
  source: ComponentNode
  
  /** Target component */
  target: ComponentNode
  
  /** State key being processed */
  key: string
  
  /** Original value */
  value: any
  
  /** Existing target value (if any) */
  existingValue?: any
  
  /** Inheritance depth */
  depth: number
}

export interface StateConflict {
  /** Unique conflict ID */
  id: string
  
  /** Component where conflict occurred */
  componentId: string
  
  /** State key in conflict */
  key: string
  
  /** Parent value */
  parentValue: any
  
  /** Child value */
  childValue: any
  
  /** Conflict resolution strategy */
  resolution: 'parentWins' | 'childWins' | 'merge' | 'custom'
  
  /** Custom resolver function */
  customResolver?: (parentValue: any, childValue: any) => any
  
  /** When conflict occurred */
  timestamp: number
  
  /** Conflict status */
  status: 'pending' | 'resolved' | 'ignored'
}

export interface StateChangeNotification {
  /** Source component ID */
  sourceId: string
  
  /** Target component ID */
  targetId: string
  
  /** Type of change */
  type: 'inheritance' | 'bubble' | 'sync'
  
  /** Changed state keys */
  changedKeys: string[]
  
  /** Previous state */
  previousState: Record<string, any>
  
  /** New state */
  newState: Record<string, any>
  
  /** Timestamp */
  timestamp: number
}

export type StateChangeListener = (notification: StateChangeNotification) => void

export interface ParentChildStateConfig {
  /** Default inheritance rules */
  inheritanceRules?: StateInheritanceRule[]
  
  /** Enable automatic state inheritance */
  autoInherit?: boolean
  
  /** Enable state bubbling */
  enableBubbling?: boolean
  
  /** Conflict resolution strategy */
  conflictResolution?: 'parentWins' | 'childWins' | 'merge' | 'manual'
  
  /** Maximum inheritance depth */
  maxInheritanceDepth?: number
  
  /** Enable change notifications */
  enableNotifications?: boolean
  
  /** Debounce time for notifications (ms) */
  notificationDebounce?: number
}

/**
 * ParentChildStateManager
 * 
 * Manages state sharing between parent and child components
 */
export class ParentChildStateManager {
  private treeManager: ComponentTreeManager
  private config: Required<ParentChildStateConfig>
  private inheritanceRules: StateInheritanceRule[] = []
  private conflicts = new Map<string, StateConflict>()
  private changeListeners = new Set<StateChangeListener>()
  private notificationQueue = new Map<string, NodeJS.Timeout>()
  
  constructor(
    treeManager: ComponentTreeManager,
    config: ParentChildStateConfig = {}
  ) {
    this.treeManager = treeManager
    this.config = {
      inheritanceRules: config.inheritanceRules ?? [],
      autoInherit: config.autoInherit ?? true,
      enableBubbling: config.enableBubbling ?? true,
      conflictResolution: config.conflictResolution ?? 'parentWins',
      maxInheritanceDepth: config.maxInheritanceDepth ?? 5,
      enableNotifications: config.enableNotifications ?? true,
      notificationDebounce: config.notificationDebounce ?? 100
    }
    
    this.inheritanceRules = [...this.config.inheritanceRules]
    
    // Add default rules
    this.addDefaultInheritanceRules()
  }
  
  /**
   * Share state from parent to children
   */
  shareStateToChildren(
    parentId: string,
    state: Record<string, any>,
    options: {
      /** Only share to specific children */
      targetChildren?: string[]
      /** Override inheritance rules */
      overrideRules?: StateInheritanceRule[]
      /** Force update even if no changes */
      force?: boolean
    } = {}
  ): StateChangeNotification[] {
    const parentNode = this.treeManager.getHierarchy(parentId)
    if (!parentNode) {
      throw new Error(`Parent component not found: ${parentId}`)
    }
    
    const notifications: StateChangeNotification[] = []
    const targetChildren = options.targetChildren 
      ? parentNode.children.filter(child => options.targetChildren!.includes(child.id))
      : parentNode.children
    
    const rules = options.overrideRules || this.inheritanceRules
    
    for (const child of targetChildren) {
      const inheritedState = this.calculateInheritedState(
        parentNode.node,
        child,
        state,
        rules
      )
      
      if (Object.keys(inheritedState).length > 0 || options.force) {
        // Update child state
        const previousState = child.metadata.state || {}
        const newState = { ...previousState, ...inheritedState }
        
        this.treeManager.updateComponentState(child.id, newState)
        
        // Create notification
        const notification: StateChangeNotification = {
          sourceId: parentId,
          targetId: child.id,
          type: 'inheritance',
          changedKeys: Object.keys(inheritedState),
          previousState,
          newState,
          timestamp: Date.now()
        }
        
        notifications.push(notification)
        this.emitNotification(notification)
      }
    }
    
    return notifications
  }
  
  /**
   * Bubble state from child to parent
   */
  bubbleStateToParent(
    childId: string,
    state: Record<string, any>,
    options: {
      /** Only bubble specific keys */
      bubbleKeys?: string[]
      /** Bubbling strategy */
      strategy?: 'merge' | 'override' | 'custom'
      /** Custom bubbling function */
      customBubbler?: (childState: any, parentState: any) => any
    } = {}
  ): StateChangeNotification | null {
    if (!this.config.enableBubbling) {
      return null
    }
    
    const childHierarchy = this.treeManager.getHierarchy(childId)
    if (!childHierarchy || !childHierarchy.parent) {
      return null
    }
    
    const parent = childHierarchy.parent
    const bubbleKeys = options.bubbleKeys || Object.keys(state)
    const bubbledState: Record<string, any> = {}
    
    // Apply bubbling rules
    for (const key of bubbleKeys) {
      const rule = this.findApplicableRule(key, 'up')
      if (rule && rule.mode !== 'ignore') {
        bubbledState[key] = rule.transform 
          ? rule.transform(state[key], {
              source: childHierarchy.node,
              target: parent,
              key,
              value: state[key],
              existingValue: parent.metadata.state?.[key],
              depth: 1
            })
          : state[key]
      }
    }
    
    if (Object.keys(bubbledState).length === 0) {
      return null
    }
    
    // Update parent state
    const previousState = parent.metadata.state || {}
    const newState = this.mergeStates(previousState, bubbledState, options.strategy || 'merge')
    
    this.treeManager.updateComponentState(parent.id, newState)
    
    // Create notification
    const notification: StateChangeNotification = {
      sourceId: childId,
      targetId: parent.id,
      type: 'bubble',
      changedKeys: Object.keys(bubbledState),
      previousState,
      newState,
      timestamp: Date.now()
    }
    
    this.emitNotification(notification)
    return notification
  }
  
  /**
   * Get inherited state for a child component
   */
  getInheritedState(
    childId: string,
    includeAncestors: boolean = true
  ): Record<string, any> {
    const hierarchy = this.treeManager.getHierarchy(childId)
    if (!hierarchy) {
      return {}
    }
    
    let inheritedState: Record<string, any> = {}
    
    if (includeAncestors) {
      // Inherit from all ancestors (deepest first)
      const ancestors = [...hierarchy.ancestors].reverse()
      for (const ancestor of ancestors) {
        const ancestorState = ancestor.metadata.state || {}
        const inherited = this.calculateInheritedState(
          ancestor,
          hierarchy.node,
          ancestorState,
          this.inheritanceRules
        )
        inheritedState = { ...inheritedState, ...inherited }
      }
    }
    
    // Direct parent inheritance
    if (hierarchy.parent) {
      const parentState = hierarchy.parent.metadata.state || {}
      const inherited = this.calculateInheritedState(
        hierarchy.parent,
        hierarchy.node,
        parentState,
        this.inheritanceRules
      )
      inheritedState = { ...inheritedState, ...inherited }
    }
    
    return inheritedState
  }
  
  /**
   * Add inheritance rule
   */
  addInheritanceRule(rule: StateInheritanceRule): void {
    this.inheritanceRules.push(rule)
  }
  
  /**
   * Remove inheritance rule
   */
  removeInheritanceRule(keyPattern: string): boolean {
    const index = this.inheritanceRules.findIndex(rule => rule.keyPattern === keyPattern)
    if (index >= 0) {
      this.inheritanceRules.splice(index, 1)
      return true
    }
    return false
  }
  
  /**
   * Resolve state conflict
   */
  resolveConflict(
    conflictId: string,
    resolution: StateConflict['resolution'],
    customResolver?: (parentValue: any, childValue: any) => any
  ): boolean {
    const conflict = this.conflicts.get(conflictId)
    if (!conflict) {
      return false
    }
    
    conflict.resolution = resolution
    conflict.customResolver = customResolver
    conflict.status = 'resolved'
    
    // Apply resolution
    let resolvedValue: any
    
    switch (resolution) {
      case 'parentWins':
        resolvedValue = conflict.parentValue
        break
      case 'childWins':
        resolvedValue = conflict.childValue
        break
      case 'merge':
        resolvedValue = this.mergeValues(conflict.parentValue, conflict.childValue)
        break
      case 'custom':
        if (customResolver) {
          resolvedValue = customResolver(conflict.parentValue, conflict.childValue)
        } else {
          resolvedValue = conflict.childValue
        }
        break
    }
    
    // Update component state
    const component = this.treeManager.getHierarchy(conflict.componentId)
    if (component) {
      const currentState = component.node.metadata.state || {}
      this.treeManager.updateComponentState(conflict.componentId, {
        ...currentState,
        [conflict.key]: resolvedValue
      })
    }
    
    return true
  }
  
  /**
   * Get pending conflicts
   */
  getPendingConflicts(): StateConflict[] {
    return Array.from(this.conflicts.values()).filter(
      conflict => conflict.status === 'pending'
    )
  }
  
  /**
   * Subscribe to state change notifications
   */
  subscribe(listener: StateChangeListener): () => void {
    this.changeListeners.add(listener)
    
    return () => {
      this.changeListeners.delete(listener)
    }
  }
  
  /**
   * Force sync state across hierarchy
   */
  syncHierarchy(rootId: string): StateChangeNotification[] {
    const notifications: StateChangeNotification[] = []
    const rootHierarchy = this.treeManager.getHierarchy(rootId)
    
    if (!rootHierarchy) {
      return notifications
    }
    
    const processNode = (nodeId: string) => {
      const hierarchy = this.treeManager.getHierarchy(nodeId)
      if (!hierarchy) return
      
      // Share to children
      const nodeState = hierarchy.node.metadata.state || {}
      const childNotifications = this.shareStateToChildren(nodeId, nodeState)
      notifications.push(...childNotifications)
      
      // Process children recursively
      for (const child of hierarchy.children) {
        processNode(child.id)
      }
    }
    
    processNode(rootId)
    return notifications
  }
  
  // Private methods
  
  private calculateInheritedState(
    source: ComponentNode,
    target: ComponentNode,
    sourceState: Record<string, any>,
    rules: StateInheritanceRule[]
  ): Record<string, any> {
    const inheritedState: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(sourceState)) {
      const rule = this.findApplicableRule(key, 'down', rules)
      
      if (rule && rule.mode !== 'ignore') {
        const context: StateInheritanceContext = {
          source,
          target,
          key,
          value,
          existingValue: target.metadata.state?.[key],
          depth: Math.abs(target.depth - source.depth)
        }
        
        // Check condition
        if (rule.condition && !rule.condition(context)) {
          continue
        }
        
        // Check max depth
        if (context.depth > this.config.maxInheritanceDepth) {
          continue
        }
        
        // Apply inheritance
        let inheritedValue = rule.transform ? rule.transform(value, context) : value
        
        // Handle conflicts
        if (context.existingValue !== undefined && context.existingValue !== inheritedValue) {
          const conflictId = this.createConflict(target.id, key, value, context.existingValue)
          inheritedValue = this.resolveConflictValue(conflictId, value, context.existingValue)
        }
        
        inheritedState[key] = inheritedValue
      }
    }
    
    return inheritedState
  }
  
  private findApplicableRule(
    key: string, 
    direction: 'up' | 'down',
    rules: StateInheritanceRule[] = this.inheritanceRules
  ): StateInheritanceRule | undefined {
    return rules.find(rule => {
      const directionMatch = rule.direction === 'both' || rule.direction === direction
      const keyMatch = this.matchesPattern(key, rule.keyPattern)
      return directionMatch && keyMatch
    })
  }
  
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'))
    return regex.test(key)
  }
  
  private createConflict(
    componentId: string,
    key: string,
    parentValue: any,
    childValue: any
  ): string {
    const conflictId = `conflict_${componentId}_${key}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    const conflict: StateConflict = {
      id: conflictId,
      componentId,
      key,
      parentValue,
      childValue,
      resolution: this.config.conflictResolution,
      timestamp: Date.now(),
      status: 'pending'
    }
    
    this.conflicts.set(conflictId, conflict)
    return conflictId
  }
  
  private resolveConflictValue(conflictId: string, parentValue: any, childValue: any): any {
    const conflict = this.conflicts.get(conflictId)
    if (!conflict) {
      return childValue
    }
    
    switch (this.config.conflictResolution) {
      case 'parentWins':
        return parentValue
      case 'childWins':
        return childValue
      case 'merge':
        return this.mergeValues(parentValue, childValue)
      case 'manual':
        return childValue // Keep child until manual resolution
      default:
        return childValue
    }
  }
  
  private mergeValues(parentValue: any, childValue: any): any {
    if (typeof parentValue === 'object' && typeof childValue === 'object' && 
        parentValue !== null && childValue !== null && 
        !Array.isArray(parentValue) && !Array.isArray(childValue)) {
      return { ...parentValue, ...childValue }
    }
    return childValue
  }
  
  private mergeStates(
    existingState: Record<string, any>,
    newState: Record<string, any>,
    strategy: 'merge' | 'override' | 'custom'
  ): Record<string, any> {
    switch (strategy) {
      case 'merge':
        return { ...existingState, ...newState }
      case 'override':
        return newState
      case 'custom':
        // For now, default to merge
        return { ...existingState, ...newState }
      default:
        return { ...existingState, ...newState }
    }
  }
  
  private emitNotification(notification: StateChangeNotification): void {
    if (!this.config.enableNotifications) {
      return
    }
    
    // Debounce notifications
    const key = `${notification.sourceId}_${notification.targetId}`
    
    if (this.notificationQueue.has(key)) {
      clearTimeout(this.notificationQueue.get(key)!)
    }
    
    const timeout = setTimeout(() => {
      this.changeListeners.forEach(listener => {
        try {
          listener(notification)
        } catch (error) {
          console.error('[ParentChildStateManager] Error in change listener:', error)
        }
      })
      this.notificationQueue.delete(key)
    }, this.config.notificationDebounce)
    
    this.notificationQueue.set(key, timeout)
  }
  
  private addDefaultInheritanceRules(): void {
    // Default rules for common patterns
    this.addInheritanceRule({
      keyPattern: 'theme',
      mode: 'inherit',
      direction: 'down'
    })
    
    this.addInheritanceRule({
      keyPattern: 'user*',
      mode: 'inherit',
      direction: 'down'
    })
    
    this.addInheritanceRule({
      keyPattern: 'config*',
      mode: 'inherit',
      direction: 'down'
    })
    
    this.addInheritanceRule({
      keyPattern: 'error*',
      mode: 'merge',
      direction: 'up'
    })
    
    this.addInheritanceRule({
      keyPattern: 'loading',
      mode: 'inherit',
      direction: 'down'
    })
  }
}