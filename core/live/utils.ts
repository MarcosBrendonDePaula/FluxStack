/**
 * FluxLive System Utilities
 * 
 * Common utility functions for the FluxLive system including
 * ID generation, hashing, validation, and debugging helpers.
 */

import { ComponentIdentity, EventScope, LiveEvent } from './types'

/**
 * Robust hash function for deterministic ID generation
 * Uses FNV-1a hash algorithm for better distribution
 */
export function hashObject(obj: any): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort())
  let hash = 2166136261 // FNV offset basis
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619) // FNV prime
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Generate timestamp-based unique suffix
 */
export function generateTimestamp(): string {
  return Date.now().toString(36)
}

/**
 * Generate secure random ID component
 */
export function generateRandomId(length: number = 8): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return result
}

/**
 * Validate component ID format
 */
export function isValidComponentId(componentId: string): boolean {
  // Pattern: [parent.]componentType-hash-timestamp[-suffix]
  const pattern = /^([a-z0-9.-]+\.)?[A-Za-z][A-Za-z0-9]*-[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)*$/
  return pattern.test(componentId)
}

/**
 * Parse component ID to extract information
 */
export function parseComponentId(componentId: string): {
  parentPath?: string
  componentType: string
  hash: string
  timestamp: string
  suffix?: string
} | null {
  const match = componentId.match(/^(?:([a-z0-9.-]+)\.)?([A-Za-z][A-Za-z0-9]*)-([a-z0-9]+)-([a-z0-9]+)(?:-(.+))?$/)
  
  if (!match) return null
  
  return {
    parentPath: match[1],
    componentType: match[2],
    hash: match[3],
    timestamp: match[4],
    suffix: match[5]
  }
}

/**
 * Generate component path from hierarchy
 */
export function generateComponentPath(components: ComponentIdentity[]): string {
  return components.map(c => c.componentType.toLowerCase()).join('.')
}

/**
 * Calculate component tree depth
 */
export function calculateDepth(componentId: string, componentTree: Map<string, ComponentIdentity>): number {
  let depth = 0
  let currentId = componentId
  
  while (currentId) {
    const component = componentTree.get(currentId)
    if (!component || !component.parentId) break
    
    depth++
    currentId = component.parentId
    
    // Prevent infinite loops
    if (depth > 100) {
      throw new Error(`Circular reference detected in component hierarchy for ${componentId}`)
    }
  }
  
  return depth
}

/**
 * Validate event scope configuration
 */
export function validateEventScope(scope: EventScope): boolean {
  const validTypes = ['local', 'parent', 'children', 'siblings', 'global', 'subtree']
  
  if (!validTypes.includes(scope.type)) {
    return false
  }
  
  if (scope.componentIds && !Array.isArray(scope.componentIds)) {
    return false
  }
  
  if (scope.maxDepth !== undefined && (typeof scope.maxDepth !== 'number' || scope.maxDepth < 0)) {
    return false
  }
  
  return true
}

/**
 * Create event scope for hierarchical communication
 */
export function createEventScope(
  type: EventScope['type'],
  options: Partial<EventScope> = {}
): EventScope {
  return {
    type,
    ...options
  }
}

/**
 * Check if component matches event scope
 */
export function componentMatchesScope(
  sourceComponentId: string,
  targetComponentId: string,
  scope: EventScope,
  componentTree: Map<string, ComponentIdentity>
): boolean {
  if (scope.type === 'local') {
    return sourceComponentId === targetComponentId
  }
  
  if (scope.type === 'global') {
    return true
  }
  
  if (scope.componentIds) {
    return scope.componentIds.includes(targetComponentId)
  }
  
  const sourceComponent = componentTree.get(sourceComponentId)
  const targetComponent = componentTree.get(targetComponentId)
  
  if (!sourceComponent || !targetComponent) {
    return false
  }
  
  switch (scope.type) {
    case 'parent':
      return targetComponentId === sourceComponent.parentId
    
    case 'children':
      return sourceComponent.childIds.has(targetComponentId)
    
    case 'siblings':
      return sourceComponent.parentId === targetComponent.parentId &&
             sourceComponentId !== targetComponentId
    
    case 'subtree':
      return isComponentInSubtree(sourceComponentId, targetComponentId, componentTree, scope.maxDepth)
    
    default:
      return false
  }
}

/**
 * Check if target component is in source component's subtree
 */
export function isComponentInSubtree(
  sourceComponentId: string,
  targetComponentId: string,
  componentTree: Map<string, ComponentIdentity>,
  maxDepth?: number
): boolean {
  const sourceComponent = componentTree.get(sourceComponentId)
  if (!sourceComponent) return false
  
  // BFS to find target in subtree
  const queue: Array<{ componentId: string, depth: number }> = [
    { componentId: sourceComponentId, depth: 0 }
  ]
  const visited = new Set<string>()
  
  while (queue.length > 0) {
    const { componentId, depth } = queue.shift()!
    
    if (visited.has(componentId)) continue
    visited.add(componentId)
    
    if (componentId === targetComponentId && depth > 0) {
      return true
    }
    
    if (maxDepth !== undefined && depth >= maxDepth) {
      continue
    }
    
    const component = componentTree.get(componentId)
    if (component) {
      for (const childId of component.childIds) {
        queue.push({ componentId: childId, depth: depth + 1 })
      }
    }
  }
  
  return false
}

/**
 * Format component for debugging
 */
export function formatComponentForDebug(identity: ComponentIdentity): string {
  return `${identity.componentType}#${identity.componentId} (depth: ${identity.depth}, path: ${identity.path})`
}

/**
 * Format event for debugging
 */
export function formatEventForDebug(event: LiveEvent): string {
  return `${event.type} from ${event.sourceComponentId} to [${Array.from(event.targetComponentIds).join(', ')}] (${event.scope.type})`
}

/**
 * Create debug snapshot of component tree
 */
export function createTreeSnapshot(
  componentTree: Map<string, ComponentIdentity>,
  rootComponentIds?: string[]
): any {
  const roots = rootComponentIds || 
    Array.from(componentTree.values()).filter(c => !c.parentId)
  
  function buildNode(componentId: string, visited = new Set<string>()): any {
    if (visited.has(componentId)) {
      return { error: `Circular reference: ${componentId}` }
    }
    
    visited.add(componentId)
    const component = componentTree.get(componentId)
    
    if (!component) {
      return { error: `Component not found: ${componentId}` }
    }
    
    const children = Array.from(component.childIds)
      .map(childId => buildNode(childId, new Set(visited)))
    
    return {
      componentId: component.componentId,
      componentType: component.componentType,
      path: component.path,
      depth: component.depth,
      createdAt: new Date(component.createdAt).toISOString(),
      childCount: component.childIds.size,
      children: children.length > 0 ? children : undefined
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    totalComponents: componentTree.size,
    rootComponents: roots.length,
    tree: roots.map(rootId => buildNode(rootId))
  }
}

/**
 * Validate component hierarchy integrity
 */
export function validateComponentHierarchy(
  componentTree: Map<string, ComponentIdentity>
): Array<{ componentId: string, error: string }> {
  const errors: Array<{ componentId: string, error: string }> = []
  
  for (const [componentId, component] of componentTree) {
    // Check parent-child consistency
    if (component.parentId) {
      const parent = componentTree.get(component.parentId)
      if (!parent) {
        errors.push({
          componentId,
          error: `Parent component not found: ${component.parentId}`
        })
      } else if (!parent.childIds.has(componentId)) {
        errors.push({
          componentId,
          error: `Parent ${component.parentId} does not list this component as child`
        })
      }
    }
    
    // Check child-parent consistency
    for (const childId of component.childIds) {
      const child = componentTree.get(childId)
      if (!child) {
        errors.push({
          componentId,
          error: `Child component not found: ${childId}`
        })
      } else if (child.parentId !== componentId) {
        errors.push({
          componentId,
          error: `Child ${childId} does not reference this component as parent`
        })
      }
    }
    
    // Check depth consistency
    const calculatedDepth = calculateDepth(componentId, componentTree)
    if (calculatedDepth !== component.depth) {
      errors.push({
        componentId,
        error: `Depth mismatch: calculated ${calculatedDepth}, stored ${component.depth}`
      })
    }
    
    // Check path consistency
    if (component.parentId) {
      const parent = componentTree.get(component.parentId)
      if (parent) {
        const expectedPath = `${parent.path}.${component.componentType.toLowerCase()}`
        if (component.path !== expectedPath) {
          errors.push({
            componentId,
            error: `Path mismatch: expected ${expectedPath}, got ${component.path}`
          })
        }
      }
    }
  }
  
  return errors
}

/**
 * Performance measurement utilities
 */
export class PerformanceTimer {
  private startTime: number
  private marks: Map<string, number> = new Map()
  
  constructor() {
    this.startTime = performance.now()
  }
  
  mark(label: string): void {
    this.marks.set(label, performance.now())
  }
  
  measure(label: string): number {
    const markTime = this.marks.get(label)
    if (markTime === undefined) {
      throw new Error(`Mark '${label}' not found`)
    }
    return markTime - this.startTime
  }
  
  measureSince(label: string): number {
    const markTime = this.marks.get(label)
    if (markTime === undefined) {
      throw new Error(`Mark '${label}' not found`)
    }
    return performance.now() - markTime
  }
  
  elapsed(): number {
    return performance.now() - this.startTime
  }
  
  getAllMeasures(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [label, time] of this.marks) {
      result[label] = time - this.startTime
    }
    return result
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): T {
  let timeout: NodeJS.Timeout | null = null
  
  return ((...args: Parameters<T>): ReturnType<T> | void => {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(later, wait)
    
    if (callNow) {
      return func(...args)
    }
  }) as T
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean = false
  
  return ((...args: Parameters<T>): ReturnType<T> | void => {
    if (!inThrottle) {
      const result = func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
      return result
    }
  }) as T
}