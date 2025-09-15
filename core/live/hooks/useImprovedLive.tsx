/**
 * useImprovedLive Hook
 * 
 * Enhanced React hook that integrates Task 2: Improved State Synchronization
 * features including race condition prevention, optimistic updates, and retry mechanisms.
 * 
 * This is the improved version of useLiveComponent with all Task 2 features.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { RequestTracker } from '../RequestTracker'
import { OptimisticUpdateManager } from '../OptimisticUpdateManager'
import { RetryManager } from '../RetryManager'
import { ComponentIsolationManager } from '../ComponentIsolationManager'
import type { 
  UpdateRequest, 
  OptimisticUpdate, 
  RetryAttempt,
  RetryConfig,
  OptimisticUpdateConfig,
  VisualIndicator
} from '../index'

/**
 * Enhanced live component options
 */
export interface UseImprovedLiveOptions {
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
  
  /** Component lifecycle callbacks */
  onMount?: (componentId: string) => void
  onUnmount?: (componentId: string) => void
  onStateChange?: (newState: any, oldState: any) => void
  onError?: (error: Error) => void
  onRetry?: (attempt: RetryAttempt) => void
  
  /** Server URL */
  serverUrl?: string
}

/**
 * Enhanced live component result
 */
export interface UseImprovedLiveResult {
  /** Component ID from server */
  componentId: string | null
  
  /** Current component state (includes optimistic changes) */
  state: any
  
  /** Original server state (without optimistic changes) */
  serverState: any
  
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
  
  /** Update methods */
  setState: (newState: any, optimistic?: boolean) => Promise<void>
  mergeState: (partialState: any, optimistic?: boolean) => Promise<void>
  updateState: (path: string, value: any, optimistic?: boolean) => Promise<void>
  
  /** Server methods */
  callMethod: (methodName: string, ...args: any[]) => Promise<any>
  
  /** Retry methods */
  retryFailedRequests: () => Promise<boolean[]>
  cancelRetries: () => number
  
  /** Request management */
  getPendingRequests: () => UpdateRequest[]
  getOptimisticUpdates: () => OptimisticUpdate[]
  getRetryAttempts: () => RetryAttempt[]
  
  /** Utility methods */
  sync: () => Promise<void>
  reconnect: () => Promise<void>
  clearOptimistic: () => void
}

/**
 * Default options
 */
const defaultOptions: Partial<UseImprovedLiveOptions> = {
  enableOptimistic: true,
  enableRetry: true,
  enableDeduplication: true,
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
  }
}

/**
 * useImprovedLive Hook
 * 
 * Enhanced live component hook with Task 2 features:
 * - Race condition prevention
 * - Optimistic updates with rollback
 * - Intelligent retry mechanisms
 * - Network-aware operations
 */
export function useImprovedLive(options: UseImprovedLiveOptions): UseImprovedLiveResult {
  const opts = { ...defaultOptions, ...options }
  
  // State management
  const [componentId, setComponentId] = useState<string | null>(null)
  const [serverState, setServerState] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Manager instances
  const isolationManagerRef = useRef<ComponentIsolationManager | null>(null)
  const requestTrackerRef = useRef<RequestTracker | null>(null)
  const optimisticManagerRef = useRef<OptimisticUpdateManager | null>(null)
  const retryManagerRef = useRef<RetryManager | null>(null)
  
  // Internal state
  const mountedRef = useRef(false)
  const [pendingRequests, setPendingRequests] = useState<UpdateRequest[]>([])
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>([])
  const [retryAttempts, setRetryAttempts] = useState<RetryAttempt[]>([])
  
  // Initialize managers
  useEffect(() => {
    // Create isolation manager
    const isolationManager = new ComponentIsolationManager()
    isolationManagerRef.current = isolationManager
    
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
  
  // Calculate optimistic state
  const state = useMemo(() => {
    if (!componentId || !optimisticManagerRef.current) {
      return serverState
    }
    
    return optimisticManagerRef.current.getOptimisticState(componentId, serverState)
  }, [componentId, serverState, optimisticUpdates])
  
  // Update methods
  const setState = useCallback(async (newState: any, optimistic = opts.enableOptimistic) => {
    if (!componentId || !optimisticManagerRef.current || !requestTrackerRef.current) {
      throw new Error('Component not ready')
    }
    
    setIsUpdating(true)
    
    try {
      if (optimistic) {
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
        const request = requestTrackerRef.current.createRequest(
          componentId,
          'setState',
          newState,
          serverState
        )
        
        if (requestTrackerRef.current.submitRequest(request)) {
          // Simulate server update for now
          setTimeout(() => {
            requestTrackerRef.current!.confirmRequest(request.id, newState)
            setServerState(newState)
            setIsUpdating(false)
          }, 500)
        }
      }
      
      // Call state change callback
      if (opts.onStateChange) {
        opts.onStateChange(newState, serverState)
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('State update failed')
      setError(error)
      setIsUpdating(false)
      opts.onError?.(error)
      throw error
    }
  }, [componentId, serverState, opts.enableOptimistic, opts.visualIndicators])
  
  const mergeState = useCallback(async (partialState: any, optimistic = opts.enableOptimistic) => {
    const newState = { ...state, ...partialState }
    await setState(newState, optimistic)
  }, [state, setState])
  
  const updateState = useCallback(async (path: string, value: any, optimistic = opts.enableOptimistic) => {
    // Simple path update - can be enhanced for nested paths
    const newState = { ...state, [path]: value }
    await setState(newState, optimistic)
  }, [state, setState])
  
  // Server method calls
  const callMethod = useCallback(async (methodName: string, ...args: any[]) => {
    if (!componentId) {
      throw new Error('Component not ready')
    }
    
    // This would integrate with WebSocket system for actual method calls
    // For now, return a simulated result
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
  
  // Utility methods
  const sync = useCallback(async () => {
    if (!componentId) return
    
    // Clear optimistic updates and sync with server
    if (optimisticManagerRef.current) {
      optimisticManagerRef.current.clearComponent(componentId)
    }
    
    // Re-fetch server state
    // This would integrate with actual server sync
    setOptimisticUpdates([])
  }, [componentId])
  
  const reconnect = useCallback(async () => {
    // This would trigger WebSocket reconnection
    setIsConnected(false)
    setTimeout(() => setIsConnected(true), 1000)
  }, [])
  
  const clearOptimistic = useCallback(() => {
    if (componentId && optimisticManagerRef.current) {
      optimisticManagerRef.current.clearComponent(componentId)
      setOptimisticUpdates([])
    }
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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (componentId) {
        opts.onUnmount?.(componentId)
      }
    }
  }, [componentId])
  
  // Build result object
  const result = useMemo<UseImprovedLiveResult>(() => ({
    // State
    componentId,
    state,
    serverState,
    
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
    
    // Methods
    setState,
    mergeState,
    updateState,
    callMethod,
    retryFailedRequests,
    cancelRetries,
    
    // Information
    getPendingRequests,
    getOptimisticUpdates,
    getRetryAttempts,
    
    // Utilities
    sync,
    reconnect,
    clearOptimistic
  }), [
    componentId,
    state,
    serverState,
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
    setState,
    mergeState,
    updateState,
    callMethod,
    retryFailedRequests,
    cancelRetries,
    getPendingRequests,
    getOptimisticUpdates,
    getRetryAttempts,
    sync,
    reconnect,
    clearOptimistic
  ])
  
  return result
}

/**
 * Higher-order component with improved live features
 */
export function withImprovedLive<P extends object>(
  WrappedComponent: React.ComponentType<P & { live: UseImprovedLiveResult }>,
  liveOptions: UseImprovedLiveOptions
) {
  const WithImprovedLiveWrapper = (props: P) => {
    const live = useImprovedLive(liveOptions)
    
    return <WrappedComponent {...props} live={live} />
  }
  
  WithImprovedLiveWrapper.displayName = `withImprovedLive(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithImprovedLiveWrapper
}