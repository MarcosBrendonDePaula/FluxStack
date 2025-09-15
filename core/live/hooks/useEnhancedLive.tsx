/**
 * useEnhancedLive Hook
 * 
 * Enhanced React hook that integrates Task 4: Zustand Integration
 * with all previous Task 2 and Task 3 features.
 * 
 * Features:
 * - Global state management with Zustand
 * - Bi-directional data binding between local and global state
 * - Conflict resolution when local and global state diverge
 * - Global state change reactivity in components
 * - Selector/updater pattern for global state access
 * - All Task 2 features (race conditions, optimistic updates, retries)
 * - All Task 3 features (memory management, pooling, leak detection)
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { RequestTracker } from '../RequestTracker'
import { OptimisticUpdateManager } from '../OptimisticUpdateManager'
import { RetryManager } from '../RetryManager'
import { ComponentIsolationManager } from '../ComponentIsolationManager'
import { LiveComponentPool } from '../LiveComponentPool'
import { LivePerformanceMonitor } from '../LivePerformanceMonitor'
import { AutomaticCleanupSystem } from '../AutomaticCleanupSystem'
import { createLiveComponentsSlice, type LiveComponentsSlice } from '../zustand/LiveComponentsSlice'
import type { 
  UpdateRequest, 
  OptimisticUpdate, 
  RetryAttempt,
  RetryConfig,
  OptimisticUpdateConfig,
  VisualIndicator,
  PoolConfig,
  ComponentStateEntry
} from '../index'

/**
 * Global state selector function
 */
export type GlobalStateSelector<T = any> = (globalState: any) => T

/**
 * Global state updater function
 */
export type GlobalStateUpdater = (globalState: any, localState: any) => void

/**
 * Enhanced live component options with Zustand integration
 */
export interface UseEnhancedLiveOptions {
  /** Component action name on server */
  actionName: string
  
  /** Initial props for component */
  props?: Record<string, any>
  
  /** Parent component ID for hierarchical nesting */
  parentId?: string
  
  /** Enable optimistic updates */
  enableOptimistic?: boolean
  
  /** Optimistic update configuration */
  optimisticConfig?: Partial<OptimisticUpdateConfig>
  
  /** Enable automatic retry on failures */
  enableRetry?: boolean
  
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>
  
  /** Visual indicators for pending states */
  visualIndicators?: Partial<VisualIndicator>
  
  /** Request deduplication enabled */
  enableDeduplication?: boolean
  
  /** Maximum pending requests */
  maxPendingRequests?: number
  
  /** Component pooling configuration */
  poolConfig?: Partial<PoolConfig>
  
  /** Memory monitoring enabled */
  enableMemoryMonitoring?: boolean
  
  /** Automatic cleanup enabled */
  enableAutoCleanup?: boolean
  
  /** Zustand global state integration */
  globalState?: {
    /** Global state selector function */
    selector: GlobalStateSelector
    
    /** Global state updater function */
    updater?: GlobalStateUpdater
    
    /** Enable bi-directional sync */
    enableBiDirectional?: boolean
    
    /** Sync direction when bi-directional is disabled */
    syncDirection?: 'toGlobal' | 'fromGlobal'
    
    /** Keys to sync with global state */
    syncKeys?: string[]
    
    /** Keys to exclude from global sync */
    excludeKeys?: string[]
    
    /** Conflict resolution strategy */
    conflictResolution?: 'localWins' | 'globalWins' | 'lastWriteWins' | 'merge' | 'manual'
    
    /** Debounce global state updates (ms) */
    debounceMs?: number
  }
  
  /** Component lifecycle callbacks */
  onMount?: (componentId: string) => void
  onUnmount?: (componentId: string) => void
  onStateChange?: (newState: any, oldState: any) => void
  onGlobalStateChange?: (newGlobalState: any, oldGlobalState: any) => void
  onError?: (error: Error) => void
  onRetry?: (attempt: RetryAttempt) => void
  onConflict?: (localState: any, globalState: any, strategy: string) => void
  
  /** Server URL */
  serverUrl?: string
}

/**
 * Enhanced live component result with global state
 */
export interface UseEnhancedLiveResult {
  /** Component ID from server */
  componentId: string | null
  
  /** Current component state (includes optimistic changes) */
  state: any
  
  /** Original server state (without optimistic changes) */
  serverState: any
  
  /** Global state (from selector) */
  globalState: any
  
  /** Loading states */
  isLoading: boolean
  isUpdating: boolean
  isRetrying: boolean
  
  /** Error state */
  error: Error | null
  
  /** Connection status */
  isConnected: boolean
  
  /** Optimistic update status */
  hasPendingOptimistic: boolean
  pendingOptimisticCount: number
  
  /** Retry status */
  hasActiveRetries: boolean
  retryCount: number
  nextRetryTime?: number
  canManualRetry: boolean
  
  /** Global state sync status */
  globalSyncEnabled: boolean
  hasGlobalConflicts: boolean
  lastGlobalSync?: number
  
  /** Memory and performance info */
  memoryUsage?: number
  performanceScore?: number
  
  /** Update methods */
  setState: (newState: any, optimistic?: boolean) => Promise<void>
  mergeState: (partialState: any, optimistic?: boolean) => Promise<void>
  updateState: (path: string, value: any, optimistic?: boolean) => Promise<void>
  
  /** Global state methods */
  updateGlobal: (updater: (global: any) => void) => void
  syncToGlobal: (keys?: string[]) => void
  syncFromGlobal: (keys?: string[]) => void
  resolveGlobalConflict: (strategy: 'local' | 'global' | 'merge', mergedState?: any) => void
  
  /** Server methods */
  callMethod: (methodName: string, ...args: any[]) => Promise<any>
  
  /** Retry methods */
  retryFailedRequests: () => Promise<boolean[]>
  cancelRetries: () => number
  
  /** Request management */
  getPendingRequests: () => UpdateRequest[]
  getOptimisticUpdates: () => OptimisticUpdate[]
  getRetryAttempts: () => RetryAttempt[]
  getGlobalConflicts: () => any[]
  
  /** Utility methods */
  sync: () => Promise<void>
  reconnect: () => Promise<void>
  clearOptimistic: () => void
  clearGlobalConflicts: () => void
  
  /** Component tree info */
  hierarchy: {
    parent?: ComponentStateEntry
    children: ComponentStateEntry[]
    siblings: ComponentStateEntry[]
    ancestors: ComponentStateEntry[]
    descendants: ComponentStateEntry[]
  }
  
  /** Debug information */
  debug: {
    componentInfo: any
    memoryInfo: any
    performanceInfo: any
    globalStateInfo: any
  }
}

/**
 * Default options
 */
const defaultOptions: Partial<UseEnhancedLiveOptions> = {
  enableOptimistic: true,
  enableRetry: true,
  enableDeduplication: true,
  enableMemoryMonitoring: true,
  enableAutoCleanup: true,
  maxPendingRequests: 10,
  serverUrl: 'ws://localhost:3000/fluxlive',
  optimisticConfig: {
    enabled: true,
    defaultTimeout: 10000,
    enableAutoRollback: true,
    showVisualIndicators: true
  },
  retryConfig: {
    enabled: true,
    strategy: 'exponential',
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000
  },
  visualIndicators: {
    showSpinner: true,
    applyPendingStyles: true,
    customClasses: ['live-pending']
  },
  poolConfig: {
    maxPoolSize: 50,
    minPoolSize: 5,
    autoScale: true
  },
  globalState: {
    enableBiDirectional: true,
    syncDirection: 'toGlobal',
    syncKeys: [],
    excludeKeys: ['__internal', '_meta'],
    conflictResolution: 'lastWriteWins',
    debounceMs: 100
  }
}

/**
 * Global Zustand store with LiveComponents slice
 */
let globalStore: ReturnType<typeof create<LiveComponentsSlice>> | null = null

function getGlobalStore() {
  if (!globalStore) {
    globalStore = create<LiveComponentsSlice>()(
      devtools(
        persist(
          createLiveComponentsSlice,
          {
            name: 'fluxlive-global-store',
            partialize: (state) => ({
              components: Array.from(state.components.entries()),
              persistence: state.persistence
            }),
            merge: (persistedState: any, currentState) => ({
              ...currentState,
              components: new Map(persistedState.components || []),
              persistence: { ...currentState.persistence, ...persistedState.persistence }
            })
          }
        ),
        { name: 'FluxLive Global Store' }
      )
    )
  }
  return globalStore
}

/**
 * useEnhancedLive Hook
 * 
 * Enhanced live component hook with Zustand global state integration
 * and all Task 2/Task 3 features.
 */
export function useEnhancedLive(options: UseEnhancedLiveOptions): UseEnhancedLiveResult {
  const opts = { ...defaultOptions, ...options }
  
  // State management
  const [componentId, setComponentId] = useState<string | null>(null)
  const [serverState, setServerState] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastGlobalSync, setLastGlobalSync] = useState<number>()
  
  // Manager instances
  const isolationManagerRef = useRef<ComponentIsolationManager | null>(null)
  const requestTrackerRef = useRef<RequestTracker | null>(null)
  const optimisticManagerRef = useRef<OptimisticUpdateManager | null>(null)
  const retryManagerRef = useRef<RetryManager | null>(null)
  const componentPoolRef = useRef<LiveComponentPool | null>(null)
  const performanceMonitorRef = useRef<LivePerformanceMonitor | null>(null)
  const cleanupSystemRef = useRef<AutomaticCleanupSystem | null>(null)
  
  // Global store
  const globalStore = useMemo(() => getGlobalStore(), [])
  
  // Global state subscription
  const globalState = globalStore(opts.globalState?.selector || ((state) => null))
  const globalStoreState = globalStore()
  
  // Internal state
  const mountedRef = useRef(false)
  const [pendingRequests, setPendingRequests] = useState<UpdateRequest[]>([])
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>([])
  const [retryAttempts, setRetryAttempts] = useState<RetryAttempt[]>([])
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Initialize managers
  useEffect(() => {
    // Create isolation manager
    const isolationManager = new ComponentIsolationManager()
    isolationManagerRef.current = isolationManager
    
    // Create component pool
    const componentPool = new LiveComponentPool(
      () => ({}), // Instance factory
      opts.poolConfig
    )
    componentPoolRef.current = componentPool
    
    // Create performance monitor
    const performanceMonitor = new LivePerformanceMonitor({
      enableMemoryTracking: opts.enableMemoryMonitoring,
      memoryCheckInterval: 30000,
      maxInstanceAge: 300000,
      enableAlerts: true
    })
    performanceMonitorRef.current = performanceMonitor
    
    // Create cleanup system
    const cleanupSystem = new AutomaticCleanupSystem({
      enableWeakRefTracking: true,
      enableBrowserLifecycleTracking: true,
      cleanupInterval: 60000,
      enablePeriodicCleanup: true
    })
    cleanupSystemRef.current = cleanupSystem
    
    // Create request tracker
    const requestTracker = new RequestTracker({
      requestTimeout: 10000,
      maxPendingRequests: opts.maxPendingRequests || 10,
      enableDeduplication: opts.enableDeduplication || true,
      deduplicationWindow: 1000,
      defaultConflictStrategy: 'last_write_wins'
    })
    requestTrackerRef.current = requestTracker
    
    // Create optimistic update manager
    const optimisticManager = new OptimisticUpdateManager(
      requestTracker,
      opts.optimisticConfig
    )
    optimisticManagerRef.current = optimisticManager
    
    // Create retry manager
    const retryManager = new RetryManager(opts.retryConfig)
    retryManagerRef.current = retryManager
    
    // Setup listeners
    setupManagerListeners()
    
    return () => {
      cleanupSystem.shutdown()
      performanceMonitor.shutdown()
      componentPool.shutdown()
      optimisticManager.shutdown()
      requestTracker.shutdown()
      retryManager.shutdown()
      isolationManager.shutdown()
    }
  }, [])
  
  // Setup manager event listeners
  const setupManagerListeners = useCallback(() => {
    if (!optimisticManagerRef.current || !retryManagerRef.current) return
    
    // Optimistic update state changes
    const unsubscribeOptimistic = optimisticManagerRef.current.onStateChange((update) => {
      if (update.componentId === componentId) {
        setOptimisticUpdates(prev => {
          const index = prev.findIndex(u => u.id === update.id)
          if (index >= 0) {
            const newUpdates = [...prev]
            newUpdates[index] = update
            return newUpdates
          } else {
            return [...prev, update]
          }
        })
      }
    })
    
    // Retry success
    const unsubscribeRetry = retryManagerRef.current.onRetrySuccess((attempt) => {
      if (attempt.componentId === componentId) {
        setRetryAttempts(prev => prev.filter(a => a.id !== attempt.id))
        setIsRetrying(false)
        opts.onRetry?.(attempt)
      }
    })
    
    // Network changes
    const unsubscribeNetwork = retryManagerRef.current.onNetworkChange((condition) => {
      setIsConnected(condition.status === 'online')
    })
    
    return () => {
      unsubscribeOptimistic()
      unsubscribeRetry()
      unsubscribeNetwork()
    }
  }, [componentId])
  
  // Mount component
  useEffect(() => {
    if (!isolationManagerRef.current || mountedRef.current) return
    
    const mountComponent = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const identity = isolationManagerRef.current!.createInstance(
          opts.actionName,
          opts.props || {},
          'client-123', // Would be actual client ID
          opts.parentId
        )
        
        setComponentId(identity.componentId)
        setServerState(identity.state || {})
        mountedRef.current = true
        
        // Register component in global store
        globalStore.getState().registerComponent(
          identity.componentId,
          opts.actionName,
          identity.state || {},
          {
            parentId: opts.parentId,
            isActive: true,
            props: opts.props || {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
            depth: 0,
            path: identity.componentId,
            childIds: []
          },
          {
            enabled: !!opts.globalState,
            direction: opts.globalState?.enableBiDirectional ? 'bidirectional' : (opts.globalState?.syncDirection || 'toGlobal'),
            syncKeys: opts.globalState?.syncKeys || [],
            excludeKeys: opts.globalState?.excludeKeys || [],
            conflictResolution: opts.globalState?.conflictResolution || 'lastWriteWins'
          }
        )
        
        // Track in performance monitor
        if (performanceMonitorRef.current) {
          performanceMonitorRef.current.trackInstance(
            identity.componentId,
            opts.actionName,
            opts.props || {}
          )
        }
        
        // Register for cleanup
        if (cleanupSystemRef.current) {
          cleanupSystemRef.current.registerTarget(
            identity.componentId,
            'LiveComponent',
            identity,
            [
              () => globalStore.getState().unregisterComponent(identity.componentId),
              () => performanceMonitorRef.current?.stopTracking(identity.componentId)
            ]
          )
        }
        
        opts.onMount?.(identity.componentId)
        
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Component mount failed')
        setError(error)
        opts.onError?.(error)
      } finally {
        setIsLoading(false)
      }
    }
    
    mountComponent()
  }, [opts.actionName, opts.props, opts.parentId])
  
  // Global state synchronization
  useEffect(() => {
    if (!componentId || !opts.globalState || !opts.globalState.enableBiDirectional) return
    
    const syncToGlobal = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        globalStore.getState().updateComponentState(componentId, serverState, 'local')
        setLastGlobalSync(Date.now())
      }, opts.globalState.debounceMs || 100)
    }
    
    syncToGlobal()
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [componentId, serverState, opts.globalState])
  
  // Global state change listener
  useEffect(() => {
    if (!componentId || !opts.globalState || !opts.globalState.enableBiDirectional) return
    
    const unsubscribe = globalStore.getState().subscribe(componentId, (newGlobalState) => {
      const currentState = serverState
      const hasChanges = Object.keys(newGlobalState).some(key => {
        if (opts.globalState?.excludeKeys?.includes(key)) return false
        if (opts.globalState?.syncKeys?.length && !opts.globalState.syncKeys.includes(key)) return false
        return currentState[key] !== newGlobalState[key]
      })
      
      if (hasChanges) {
        const strategy = opts.globalState.conflictResolution || 'lastWriteWins'
        
        if (strategy === 'manual') {
          opts.onConflict?.(currentState, newGlobalState, strategy)
        } else {
          // Auto-resolve conflict
          let resolvedState = newGlobalState
          if (strategy === 'localWins') {
            resolvedState = currentState
          } else if (strategy === 'merge') {
            resolvedState = { ...currentState, ...newGlobalState }
          }
          
          setServerState(resolvedState)
          opts.onGlobalStateChange?.(newGlobalState, currentState)
        }
      }
    })
    
    return unsubscribe
  }, [componentId, serverState, opts.globalState])
  
  // Calculate optimistic state
  const state = useMemo(() => {
    if (!componentId || !optimisticManagerRef.current) {
      return serverState
    }
    
    return optimisticManagerRef.current.getOptimisticState(componentId, serverState)
  }, [componentId, serverState, optimisticUpdates])
  
  // Update methods
  const setState = useCallback(async (newState: any, optimistic = opts.enableOptimistic) => {
    if (!componentId) {
      throw new Error('Component not ready')
    }
    
    setIsUpdating(true)
    
    try {
      if (optimistic && optimisticManagerRef.current && requestTrackerRef.current) {
        // Apply optimistic update
        const optimisticUpdate = await optimisticManagerRef.current.applyOptimisticUpdate(
          componentId,
          'setState',
          newState,
          serverState,
          {
            visualIndicator: opts.visualIndicators,
            onConfirmed: (update) => {
              setServerState(newState)
              setIsUpdating(false)
              
              // Update global state
              if (opts.globalState) {
                globalStore.getState().updateComponentState(componentId, newState, 'local')
              }
            },
            onFailed: (update, error) => {
              setError(error)
              setIsUpdating(false)
              
              // Schedule retry if enabled
              if (opts.enableRetry && retryManagerRef.current) {
                retryManagerRef.current.scheduleRetry(
                  update.requestId,
                  componentId,
                  error
                )
                setIsRetrying(true)
              }
              
              opts.onError?.(error)
            },
            rollbackFn: () => {
              // State will be reverted automatically by optimistic manager
            }
          }
        )
      } else {
        // Direct state update
        setServerState(newState)
        setIsUpdating(false)
        
        // Update global state
        if (opts.globalState) {
          globalStore.getState().updateComponentState(componentId, newState, 'local')
        }
      }
      
      // Call state change callback
      if (opts.onStateChange) {
        opts.onStateChange(newState, serverState)
      }
      
      // Update performance metrics
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.updateActivity(componentId)
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('State update failed')
      setError(error)
      setIsUpdating(false)
      opts.onError?.(error)
      throw error
    }
  }, [componentId, serverState, opts])
  
  const mergeState = useCallback(async (partialState: any, optimistic = opts.enableOptimistic) => {
    const newState = { ...state, ...partialState }
    await setState(newState, optimistic)
  }, [state, setState])
  
  const updateState = useCallback(async (path: string, value: any, optimistic = opts.enableOptimistic) => {
    // Simple path update - can be enhanced for nested paths
    const newState = { ...state, [path]: value }
    await setState(newState, optimistic)
  }, [state, setState])
  
  // Global state methods
  const updateGlobal = useCallback((updater: (global: any) => void) => {
    if (!opts.globalState) return
    
    const currentGlobal = globalState
    const newGlobal = { ...currentGlobal }
    updater(newGlobal)
    
    // This would update the global store through the updater function
    opts.globalState.updater?.(newGlobal, state)
  }, [globalState, state, opts.globalState])
  
  const syncToGlobal = useCallback((keys?: string[]) => {
    if (!componentId || !opts.globalState) return
    
    const keysToSync = keys || opts.globalState.syncKeys || Object.keys(state)
    const stateToSync = keysToSync.reduce((acc, key) => {
      if (!opts.globalState?.excludeKeys?.includes(key)) {
        acc[key] = state[key]
      }
      return acc
    }, {} as any)
    
    globalStore.getState().updateComponentState(componentId, stateToSync, 'local')
    setLastGlobalSync(Date.now())
  }, [componentId, state, opts.globalState])
  
  const syncFromGlobal = useCallback((keys?: string[]) => {
    if (!componentId || !opts.globalState) return
    
    const globalComponentState = globalStore.getState().getComponentState(componentId)
    if (!globalComponentState) return
    
    const keysToSync = keys || opts.globalState.syncKeys || Object.keys(globalComponentState)
    const stateToSync = keysToSync.reduce((acc, key) => {
      if (!opts.globalState?.excludeKeys?.includes(key)) {
        acc[key] = globalComponentState[key]
      }
      return acc
    }, {} as any)
    
    setServerState(prev => ({ ...prev, ...stateToSync }))
    setLastGlobalSync(Date.now())
  }, [componentId, opts.globalState])
  
  const resolveGlobalConflict = useCallback((strategy: 'local' | 'global' | 'merge', mergedState?: any) => {
    if (!componentId) return
    
    const conflicts = globalStore.getState().getConflicts(componentId)
    if (conflicts.length === 0) return
    
    conflicts.forEach(conflict => {
      globalStore.getState().resolveConflict(conflict.id, strategy, mergedState)
    })
  }, [componentId])
  
  // Server method calls
  const callMethod = useCallback(async (methodName: string, ...args: any[]) => {
    if (!componentId) {
      throw new Error('Component not ready')
    }
    
    // Update activity in performance monitor
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.updateActivity(componentId)
    }
    
    // This would integrate with WebSocket system for actual method calls
    return Promise.resolve({ result: 'success' })
  }, [componentId])
  
  // Retry methods
  const retryFailedRequests = useCallback(async () => {
    if (!componentId || !retryManagerRef.current) {
      return []
    }
    
    setIsRetrying(true)
    
    try {
      const results = await retryManagerRef.current.executeManualRetry(componentId)
      return results
    } finally {
      setIsRetrying(false)
    }
  }, [componentId])
  
  const cancelRetries = useCallback(() => {
    if (!componentId || !retryManagerRef.current) {
      return 0
    }
    
    const cancelled = retryManagerRef.current.cancelRetries(componentId)
    setRetryAttempts([])
    setIsRetrying(false)
    return cancelled
  }, [componentId])
  
  // Request management
  const getPendingRequests = useCallback(() => {
    if (!componentId || !requestTrackerRef.current) {
      return []
    }
    
    return requestTrackerRef.current.getPendingRequests(componentId)
  }, [componentId])
  
  const getOptimisticUpdates = useCallback(() => {
    if (!componentId || !optimisticManagerRef.current) {
      return []
    }
    
    return optimisticManagerRef.current.getComponentUpdates(componentId)
  }, [componentId])
  
  const getRetryAttempts = useCallback(() => {
    if (!componentId || !retryManagerRef.current) {
      return []
    }
    
    return retryManagerRef.current.getRetryStatus(componentId).hasActiveRetries 
      ? retryAttempts 
      : []
  }, [componentId, retryAttempts])
  
  const getGlobalConflicts = useCallback(() => {
    if (!componentId) return []
    
    return globalStore.getState().getConflicts(componentId)
  }, [componentId])
  
  // Utility methods
  const sync = useCallback(async () => {
    if (!componentId) return
    
    // Clear optimistic updates and sync with server
    if (optimisticManagerRef.current) {
      optimisticManagerRef.current.clearComponent(componentId)
    }
    
    // Sync with global state
    syncFromGlobal()
    
    setOptimisticUpdates([])
  }, [componentId, syncFromGlobal])
  
  const reconnect = useCallback(async () => {
    setIsConnected(false)
    setTimeout(() => setIsConnected(true), 1000)
  }, [])
  
  const clearOptimistic = useCallback(() => {
    if (componentId && optimisticManagerRef.current) {
      optimisticManagerRef.current.clearComponent(componentId)
      setOptimisticUpdates([])
    }
  }, [componentId])
  
  const clearGlobalConflicts = useCallback(() => {
    if (!componentId) return
    
    const conflicts = globalStore.getState().getConflicts(componentId)
    conflicts.forEach(conflict => {
      globalStore.getState().resolveConflict(conflict.id, 'local')
    })
  }, [componentId])
  
  // Calculate derived state
  const hasPendingOptimistic = optimisticUpdates.some(u => u.state === 'pending')
  const pendingOptimisticCount = optimisticUpdates.filter(u => u.state === 'pending').length
  const hasActiveRetries = retryAttempts.length > 0
  const retryCount = retryAttempts.length
  const nextRetryTime = retryAttempts.length > 0 
    ? Math.min(...retryAttempts.map(a => a.nextRetry))
    : undefined
  
  const canManualRetry = hasActiveRetries && retryManagerRef.current
    ? retryManagerRef.current.getRetryStatus(componentId || '').canManualRetry
    : false
  
  const globalSyncEnabled = !!(opts.globalState && componentId)
  const hasGlobalConflicts = componentId ? globalStore.getState().getConflicts(componentId).length > 0 : false
  
  // Get component hierarchy
  const hierarchy = useMemo(() => {
    if (!componentId) {
      return { children: [], siblings: [], ancestors: [], descendants: [] }
    }
    
    return globalStore.getState().getComponentHierarchy(componentId)
  }, [componentId])
  
  // Get debug information
  const debug = useMemo(() => ({
    componentInfo: componentId ? {
      id: componentId,
      type: opts.actionName,
      state: state,
      serverState: serverState,
      globalState: globalState
    } : null,
    memoryInfo: performanceMonitorRef.current?.getStats() || null,
    performanceInfo: globalStore.getState().getMetrics(),
    globalStateInfo: globalStore.getState().getDebugInfo()
  }), [componentId, state, serverState, globalState])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (componentId) {
        globalStore.getState().unregisterComponent(componentId)
        if (performanceMonitorRef.current) {
          performanceMonitorRef.current.stopTracking(componentId)
        }
        opts.onUnmount?.(componentId)
      }
    }
  }, [componentId])
  
  // Build result object
  const result = useMemo<UseEnhancedLiveResult>(() => ({
    // State
    componentId,
    state,
    serverState,
    globalState,
    
    // Loading states
    isLoading,
    isUpdating,
    isRetrying,
    
    // Status
    error,
    isConnected,
    
    // Optimistic state
    hasPendingOptimistic,
    pendingOptimisticCount,
    
    // Retry state
    hasActiveRetries,
    retryCount,
    nextRetryTime,
    canManualRetry,
    
    // Global state
    globalSyncEnabled,
    hasGlobalConflicts,
    lastGlobalSync,
    
    // Performance
    memoryUsage: performanceMonitorRef.current?.getStats().totalMemoryUsage,
    performanceScore: globalStore.getState().getMetrics().performanceScore,
    
    // Methods
    setState,
    mergeState,
    updateState,
    updateGlobal,
    syncToGlobal,
    syncFromGlobal,
    resolveGlobalConflict,
    callMethod,
    retryFailedRequests,
    cancelRetries,
    
    // Information
    getPendingRequests,
    getOptimisticUpdates,
    getRetryAttempts,
    getGlobalConflicts,
    
    // Utilities
    sync,
    reconnect,
    clearOptimistic,
    clearGlobalConflicts,
    
    // Tree
    hierarchy,
    
    // Debug
    debug
  }), [
    componentId,
    state,
    serverState,
    globalState,
    isLoading,
    isUpdating,
    isRetrying,
    error,
    isConnected,
    hasPendingOptimistic,
    pendingOptimisticCount,
    hasActiveRetries,
    retryCount,
    nextRetryTime,
    canManualRetry,
    globalSyncEnabled,
    hasGlobalConflicts,
    lastGlobalSync,
    setState,
    mergeState,
    updateState,
    updateGlobal,
    syncToGlobal,
    syncFromGlobal,
    resolveGlobalConflict,
    callMethod,
    retryFailedRequests,
    cancelRetries,
    getPendingRequests,
    getOptimisticUpdates,
    getRetryAttempts,
    getGlobalConflicts,
    sync,
    reconnect,
    clearOptimistic,
    clearGlobalConflicts,
    hierarchy,
    debug
  ])
  
  return result
}

/**
 * Higher-order component with enhanced live features
 */
export function withEnhancedLive<P extends object>(
  WrappedComponent: React.ComponentType<P & { live: UseEnhancedLiveResult }>,
  liveOptions: UseEnhancedLiveOptions
) {
  const WithEnhancedLiveWrapper = (props: P) => {
    const live = useEnhancedLive(liveOptions)
    
    return <WrappedComponent {...props} live={live} />
  }
  
  WithEnhancedLiveWrapper.displayName = `withEnhancedLive(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithEnhancedLiveWrapper
}

/**
 * Global store access for external use
 */
export function useGlobalLiveStore() {
  return getGlobalStore()
}

/**
 * Global state selector hook
 */
export function useGlobalLiveState<T = any>(selector: GlobalStateSelector<T>): T {
  const store = getGlobalStore()
  return store(selector)
}