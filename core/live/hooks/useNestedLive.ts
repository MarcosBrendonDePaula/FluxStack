/**
 * useNestedLive Hook
 * 
 * Enhanced version of useLive hook that supports hierarchical component
 * relationships, parent-child state sharing, and dependency management.
 * 
 * Features:
 * - Parent-child component relationships
 * - State inheritance and bubbling
 * - Inter-component communication
 * - Hierarchical lifecycle management
 * - Dependency tracking and resolution
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { ComponentTreeManager, ComponentNode, ComponentHierarchy } from '../ComponentTreeManager'
import { ParentChildStateManager, StateInheritanceRule, StateChangeNotification } from '../ParentChildStateManager'
import { ComponentLifecycleManager, ComponentDependency, LifecycleHook } from '../ComponentLifecycleManager'

// Re-export enhanced live hook
export { useEnhancedLive, UseEnhancedLiveOptions, UseEnhancedLiveResult } from './useEnhancedLive'

export interface UseNestedLiveOptions {
  /** Component action name on server */
  actionName: string
  
  /** Component props */
  props?: Record<string, any>
  
  /** Parent component ID */
  parentId?: string
  
  /** Properties to inherit from parent */
  inheritFromParent?: string[] | boolean
  
  /** Properties to share with children */
  shareToChildren?: string[] | boolean
  
  /** Custom inheritance rules */
  inheritanceRules?: StateInheritanceRule[]
  
  /** Component dependencies */
  dependencies?: ComponentDependency[]
  
  /** Lifecycle hooks */
  hooks?: LifecycleHook[]
  
  /** Enable automatic mounting of dependencies */
  autoMount?: boolean
  
  /** Enable state bubbling to parent */
  enableBubbling?: boolean
  
  /** Custom component metadata */
  metadata?: Record<string, any>
  
  /** Error handler */
  onError?: (error: Error) => void
  
  /** State change handler */
  onStateChange?: (notification: StateChangeNotification) => void
  
  /** Lifecycle event handler */
  onLifecycleChange?: (phase: ComponentNode['metadata']['status']) => void
}

export interface UseNestedLiveResult {
  /** Component state */
  state: Record<string, any>
  
  /** Loading state */
  loading: boolean
  
  /** Connection status */
  connected: boolean
  
  /** Error state */
  error: Error | null
  
  /** Component hierarchy information */
  hierarchy: ComponentHierarchy | null
  
  /** Inherited state from ancestors */
  inheritedState: Record<string, any>
  
  /** Update component state */
  setState: (newState: Record<string, any>, options?: {
    /** Apply optimistic update */
    optimistic?: boolean
    /** Share to children */
    shareToChildren?: boolean
    /** Bubble to parent */
    bubbleToParent?: boolean
    /** Specific keys to share/bubble */
    keys?: string[]
  }) => Promise<void>
  
  /** Call server method */
  callMethod: (method: string, ...args: any[]) => Promise<any>
  
  /** Emit event to parent */
  emitToParent: (event: string, data?: any) => void
  
  /** Emit event to children */
  emitToChildren: (event: string, data?: any, targetChildren?: string[]) => void
  
  /** Emit event to siblings */
  emitToSiblings: (event: string, data?: any) => void
  
  /** Subscribe to parent events */
  subscribeToParent: (event: string, handler: (data: any) => void) => () => void
  
  /** Subscribe to children events */
  subscribeToChildren: (event: string, handler: (data: any, childId: string) => void) => () => void
  
  /** Get component tree metadata */
  getTreeMetadata: () => {
    depth: number
    path: string
    parentId?: string
    childrenIds: string[]
    siblingIds: string[]
  }
  
  /** Force sync with hierarchy */
  syncHierarchy: () => Promise<StateChangeNotification[]>
  
  /** Cleanup component */
  cleanup: () => Promise<void>
}

// Singleton managers
const treeManager = new ComponentTreeManager({
  maxDepth: 10,
  autoCleanup: true,
  cleanupInterval: 60000
})

const stateManager = new ParentChildStateManager(treeManager, {
  autoInherit: true,
  enableBubbling: true,
  conflictResolution: 'parentWins'
})

const lifecycleManager = new ComponentLifecycleManager(treeManager, {
  autoMount: true,
  parallelInit: true,
  enableHooks: true
})

/**
 * useNestedLive Hook
 * 
 * Enhanced live component hook with hierarchical features
 */
export function useNestedLive(options: UseNestedLiveOptions): UseNestedLiveResult {
  // Generate unique component ID
  const componentId = useMemo(() => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const parentPrefix = options.parentId ? `${options.parentId}.` : ''
    return `${parentPrefix}${options.actionName}-${timestamp}-${random}`
  }, [options.actionName, options.parentId])
  
  // State management
  const [state, setStateInternal] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hierarchy, setHierarchy] = useState<ComponentHierarchy | null>(null)
  const [inheritedState, setInheritedState] = useState<Record<string, any>>({})
  
  // Refs
  const isInitialized = useRef(false)
  const eventListeners = useRef(new Map<string, Set<Function>>())
  
  // Initialize component
  useEffect(() => {
    let isMounted = true
    
    const initializeComponent = async () => {
      try {
        // Register component in tree
        const componentNode = treeManager.registerComponent(
          componentId,
          options.actionName,
          options.parentId,
          options.props,
          options.metadata
        )
        
        // Add lifecycle hooks
        if (options.hooks) {
          for (const hook of options.hooks) {
            lifecycleManager.addLifecycleHook(componentId, hook)
          }
        }
        
        // Initialize component with lifecycle manager
        const initResult = await lifecycleManager.initializeComponent(
          componentId,
          options.dependencies || []
        )
        
        if (!initResult.success) {
          throw initResult.error || new Error('Initialization failed')
        }
        
        if (!isMounted) return
        
        // Get hierarchy
        const componentHierarchy = treeManager.getHierarchy(componentId)
        setHierarchy(componentHierarchy)
        
        // Get inherited state
        const inherited = stateManager.getInheritedState(componentId)
        setInheritedState(inherited)
        
        // Initialize state with inherited values
        const initialState = { ...inherited, ...options.props }
        setStateInternal(initialState)
        treeManager.updateComponentState(componentId, initialState)
        
        // Mark as connected
        setConnected(true)
        setLoading(false)
        isInitialized.current = true
        
        console.log(`[useNestedLive] Component initialized: ${componentId}`)
        
      } catch (err) {
        if (!isMounted) return
        
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        setLoading(false)
        
        if (options.onError) {
          options.onError(error)
        }
        
        console.error(`[useNestedLive] Initialization failed for ${componentId}:`, error)
      }
    }
    
    initializeComponent()
    
    return () => {
      isMounted = false
    }
  }, [componentId, options.actionName, options.parentId])
  
  // Subscribe to state changes
  useEffect(() => {
    if (!isInitialized.current) return
    
    const unsubscribe = stateManager.subscribe((notification) => {
      if (notification.targetId === componentId) {
        // Update local state when we receive changes
        setStateInternal(notification.newState)
        
        if (notification.type === 'inheritance') {
          setInheritedState(stateManager.getInheritedState(componentId))
        }
        
        if (options.onStateChange) {
          options.onStateChange(notification)
        }
      }
    })
    
    return unsubscribe
  }, [componentId, options.onStateChange])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized.current) {
        lifecycleManager.cleanupComponent(componentId, { recursive: true })
          .then(() => {
            treeManager.unregisterComponent(componentId)
            console.log(`[useNestedLive] Component cleaned up: ${componentId}`)
          })
          .catch(error => {
            console.error(`[useNestedLive] Cleanup failed for ${componentId}:`, error)
          })
      }
    }
  }, [componentId])
  
  // setState with hierarchy support
  const setState = useCallback(async (
    newState: Record<string, any>,
    options: {
      optimistic?: boolean
      shareToChildren?: boolean
      bubbleToParent?: boolean
      keys?: string[]
    } = {}
  ): Promise<void> => {
    try {
      // Update local state
      const updatedState = { ...state, ...newState }
      setStateInternal(updatedState)
      treeManager.updateComponentState(componentId, updatedState)
      
      // Share to children if requested
      if (options.shareToChildren !== false && (options.shareToChildren || options.keys)) {
        const shareKeys = options.keys || Object.keys(newState)
        const stateToShare = shareKeys.reduce((acc, key) => {
          if (key in newState) acc[key] = newState[key]
          return acc
        }, {} as Record<string, any>)
        
        stateManager.shareStateToChildren(componentId, stateToShare)
      }
      
      // Bubble to parent if requested
      if (options.bubbleToParent && hierarchy?.parent) {
        const bubbleKeys = options.keys || Object.keys(newState)
        const stateToBubble = bubbleKeys.reduce((acc, key) => {
          if (key in newState) acc[key] = newState[key]
          return acc
        }, {} as Record<string, any>)
        
        stateManager.bubbleStateToParent(componentId, stateToBubble, {
          bubbleKeys
        })
      }
      
      // TODO: Call server method for persistence (integrate with existing server communication)
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('setState failed')
      setError(error)
      
      if (options.onError) {
        options.onError(error)
      }
    }
  }, [state, componentId, hierarchy, options.onError])
  
  // Call server method
  const callMethod = useCallback(async (method: string, ...args: any[]): Promise<any> => {
    // TODO: Integrate with existing server communication system
    console.log(`[useNestedLive] Calling method ${method} on ${componentId}`, args)
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return { success: true, method, args }
  }, [componentId])
  
  // Event communication methods
  const emitToParent = useCallback((event: string, data?: any) => {
    if (hierarchy?.parent) {
      console.log(`[useNestedLive] Emitting to parent: ${event}`, data)
      // TODO: Implement event system integration
    }
  }, [hierarchy])
  
  const emitToChildren = useCallback((event: string, data?: any, targetChildren?: string[]) => {
    if (hierarchy?.children.length) {
      const targets = targetChildren || hierarchy.children.map(c => c.id)
      console.log(`[useNestedLive] Emitting to children: ${event}`, data, targets)
      // TODO: Implement event system integration
    }
  }, [hierarchy])
  
  const emitToSiblings = useCallback((event: string, data?: any) => {
    if (hierarchy?.siblings.length) {
      const targets = hierarchy.siblings.map(c => c.id)
      console.log(`[useNestedLive] Emitting to siblings: ${event}`, data, targets)
      // TODO: Implement event system integration
    }
  }, [hierarchy])
  
  const subscribeToParent = useCallback((
    event: string, 
    handler: (data: any) => void
  ): (() => void) => {
    // TODO: Implement event subscription
    console.log(`[useNestedLive] Subscribing to parent event: ${event}`)
    
    return () => {
      console.log(`[useNestedLive] Unsubscribing from parent event: ${event}`)
    }
  }, [])
  
  const subscribeToChildren = useCallback((
    event: string, 
    handler: (data: any, childId: string) => void
  ): (() => void) => {
    // TODO: Implement event subscription
    console.log(`[useNestedLive] Subscribing to children event: ${event}`)
    
    return () => {
      console.log(`[useNestedLive] Unsubscribing from children event: ${event}`)
    }
  }, [])
  
  // Get tree metadata
  const getTreeMetadata = useCallback(() => {
    if (!hierarchy) {
      return {
        depth: 0,
        path: '',
        childrenIds: [],
        siblingIds: []
      }
    }
    
    return {
      depth: hierarchy.node.depth,
      path: hierarchy.node.path,
      parentId: hierarchy.parent?.id,
      childrenIds: hierarchy.children.map(c => c.id),
      siblingIds: hierarchy.siblings.map(c => c.id)
    }
  }, [hierarchy])
  
  // Sync hierarchy
  const syncHierarchy = useCallback(async (): Promise<StateChangeNotification[]> => {
    if (!hierarchy) return []
    
    // Find root component
    let rootId = componentId
    let current = hierarchy.parent
    while (current) {
      rootId = current.id
      const parentHierarchy = treeManager.getHierarchy(current.id)
      current = parentHierarchy?.parent
    }
    
    return stateManager.syncHierarchy(rootId)
  }, [componentId, hierarchy])
  
  // Cleanup
  const cleanup = useCallback(async (): Promise<void> => {
    await lifecycleManager.cleanupComponent(componentId, { recursive: true })
    treeManager.unregisterComponent(componentId)
  }, [componentId])
  
  return {
    state,
    loading,
    connected,
    error,
    hierarchy,
    inheritedState,
    setState,
    callMethod,
    emitToParent,
    emitToChildren,
    emitToSiblings,
    subscribeToParent,
    subscribeToChildren,
    getTreeMetadata,
    syncHierarchy,
    cleanup
  }
}

/**
 * Higher-order component for nested live functionality
 */
export function withNestedLive<P extends object>(
  Component: React.ComponentType<P & { nested: UseNestedLiveResult }>,
  nestedOptions: UseNestedLiveOptions
) {
  const WithNestedLiveWrapper = (props: P) => {
    const nested = useNestedLive(nestedOptions)
    
    return <Component {...props} nested={nested} />
  }
  
  WithNestedLiveWrapper.displayName = `withNestedLive(${Component.displayName || Component.name})`
  
  return WithNestedLiveWrapper
}

// Export managers for advanced usage
export {
  treeManager as componentTreeManager,
  stateManager as parentChildStateManager,
  lifecycleManager as componentLifecycleManager
}