/**
 * useLiveComponent Hook
 * 
 * React hook for creating and managing live components with real-time
 * server communication, state synchronization, and event handling.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { WebSocketManager } from '../WebSocketManager'
import { LiveComponentStateBridge } from '../LiveComponentStateBridge'
import { LiveComponentEventSystem } from '../LiveComponentEventSystem'
import type { ComponentIdentity } from '../types'

/**
 * Live component hook options
 */
export interface UseLiveComponentOptions {
  /** Component action name on server */
  actionName: string
  
  /** Initial props for component */
  props?: Record<string, any>
  
  /** Parent component ID for hierarchical nesting */
  parentId?: string
  
  /** Enable automatic state synchronization */
  enableSync?: boolean
  
  /** Sync interval in milliseconds */
  syncInterval?: number
  
  /** Enable optimistic updates */
  optimisticUpdates?: boolean
  
  /** Component lifecycle callbacks */
  onMount?: (componentId: string) => void
  onUnmount?: (componentId: string) => void
  onError?: (error: Error) => void
  
  /** WebSocket server URL */
  serverUrl?: string
}

/**
 * Live component hook result
 */
export interface UseLiveComponentResult {
  /** Component ID from server */
  componentId: string | null
  
  /** Current component state */
  state: any
  
  /** Loading state */
  isLoading: boolean
  
  /** Error state */
  error: Error | null
  
  /** Connection status */
  isConnected: boolean
  
  /** Update component state */
  setState: (newState: any) => Promise<void>
  
  /** Merge state with existing state */
  mergeState: (partialState: any) => Promise<void>
  
  /** Update specific state property */
  updateState: (path: string, value: any) => Promise<void>
  
  /** Call server method */
  callMethod: (methodName: string, ...args: any[]) => Promise<any>
  
  /** Emit event */
  emit: (eventName: string, payload?: any, options?: any) => Promise<void>
  
  /** Subscribe to events */
  on: (eventName: string, listener: (event: any) => void) => () => void
  
  /** Sync state with server */
  sync: () => Promise<void>
  
  /** Force reconnection */
  reconnect: () => Promise<void>
}

/**
 * Default hook options
 */
const defaultOptions: Partial<UseLiveComponentOptions> = {
  enableSync: true,
  syncInterval: 30000, // 30 seconds
  optimisticUpdates: true,
  serverUrl: 'ws://localhost:3000/fluxlive'
}

/**
 * useLiveComponent Hook
 */
export function useLiveComponent(options: UseLiveComponentOptions): UseLiveComponentResult {
  const opts = { ...defaultOptions, ...options }
  
  // State
  const [componentId, setComponentId] = useState<string | null>(null)
  const [state, setState] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Refs for stable references
  const wsManagerRef = useRef<WebSocketManager | null>(null)
  const stateBridgeRef = useRef<LiveComponentStateBridge | null>(null)
  const eventSystemRef = useRef<LiveComponentEventSystem | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(false)
  
  // Initialize managers
  useEffect(() => {
    const wsManager = new WebSocketManager({
      url: opts.serverUrl!,
      maxReconnectAttempts: 10,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      maxQueueSize: 100,
      connectionTimeout: 10000,
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 100
    })
    
    wsManagerRef.current = wsManager
    
    // Setup connection handlers
    wsManager.onConnectionChange((connectionState, error) => {
      setIsConnected(connectionState === 'connected')
      
      if (error) {
        setError(error)
        opts.onError?.(error)
      }
    })
    
    return () => {
      wsManager.shutdown()
    }
  }, [opts.serverUrl])
  
  // Initialize other managers after WebSocket is ready
  useEffect(() => {
    if (!wsManagerRef.current || !isConnected) return
    
    // Create state bridge (requires isolation manager - simplified for React hook)
    // In a full implementation, you'd need the ComponentIsolationManager instance
    
    // For now, create a simplified version
    const mockIsolationManager = {
      getInstance: (id: string) => ({ state }),
      getAllComponents: () => []
    } as any
    
    const stateBridge = new LiveComponentStateBridge(
      wsManagerRef.current,
      mockIsolationManager,
      {
        enableOptimisticUpdates: opts.optimisticUpdates,
        conflictStrategy: 'last_write_wins',
        enablePersistence: false,
        debounceDelay: 100
      }
    )
    
    const eventSystem = new LiveComponentEventSystem(
      wsManagerRef.current,
      mockIsolationManager,
      {
        maxQueueSize: 1000,
        processingTimeout: 5000,
        enableBatching: true,
        batchSize: 10,
        enableHistory: true
      }
    )
    
    stateBridgeRef.current = stateBridge
    eventSystemRef.current = eventSystem
    
    // Listen for state changes
    const unsubscribeState = stateBridge.onStateChange((change) => {
      if (change.componentId === componentId) {
        setState(change.value)
      }
    })
    
    return () => {
      unsubscribeState()
      stateBridge.shutdown()
      eventSystem.shutdown()
    }
  }, [isConnected, componentId, opts.optimisticUpdates])
  
  // Mount component on server
  useEffect(() => {
    if (!wsManagerRef.current || !isConnected || mountedRef.current) return
    
    const mountComponent = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await wsManagerRef.current!.send({
          type: 'component_mount',
          componentId: 'pending',
          payload: {
            actionName: opts.actionName,
            props: opts.props || {},
            parentId: opts.parentId
          }
        })
        
        if (response && response.componentId) {
          setComponentId(response.componentId)
          setState(response.identity.state || {})
          mountedRef.current = true
          opts.onMount?.(response.componentId)
        }
        
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Component mount failed')
        setError(error)
        opts.onError?.(error)
      } finally {
        setIsLoading(false)
      }
    }
    
    mountComponent()
  }, [isConnected, opts.actionName, opts.props, opts.parentId])
  
  // Setup periodic sync
  useEffect(() => {
    if (!componentId || !opts.enableSync || !opts.syncInterval) return
    
    syncIntervalRef.current = setInterval(() => {
      if (stateBridgeRef.current && componentId) {
        stateBridgeRef.current.syncState(componentId).catch(err => {
          console.error('Auto-sync failed:', err)
        })
      }
    }, opts.syncInterval)
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [componentId, opts.enableSync, opts.syncInterval])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (componentId && wsManagerRef.current) {
        wsManagerRef.current.send({
          type: 'component_unmount',
          componentId,
          payload: { componentId }
        }).catch(err => {
          console.error('Component unmount failed:', err)
        })
        
        opts.onUnmount?.(componentId)
      }
    }
  }, [componentId])
  
  // Memoized methods
  const setStateMethod = useCallback(async (newState: any) => {
    if (!componentId || !stateBridgeRef.current) return
    
    try {
      await stateBridgeRef.current.setState(componentId, newState, opts.optimisticUpdates)
      if (!opts.optimisticUpdates) {
        setState(newState)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('State update failed')
      setError(error)
      opts.onError?.(error)
    }
  }, [componentId, opts.optimisticUpdates])
  
  const mergeStateMethod = useCallback(async (partialState: any) => {
    if (!componentId || !stateBridgeRef.current) return
    
    try {
      await stateBridgeRef.current.mergeState(componentId, partialState, opts.optimisticUpdates)
      if (!opts.optimisticUpdates) {
        setState(prev => ({ ...prev, ...partialState }))
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('State merge failed')
      setError(error)
      opts.onError?.(error)
    }
  }, [componentId, opts.optimisticUpdates])
  
  const updateStateMethod = useCallback(async (path: string, value: any) => {
    if (!componentId || !stateBridgeRef.current) return
    
    try {
      await stateBridgeRef.current.updateState(componentId, 'set', path, value, opts.optimisticUpdates)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('State update failed')
      setError(error)
      opts.onError?.(error)
    }
  }, [componentId, opts.optimisticUpdates])
  
  const callMethod = useCallback(async (methodName: string, ...args: any[]) => {
    if (!componentId || !wsManagerRef.current) {
      throw new Error('Component not ready')
    }
    
    try {
      const response = await wsManagerRef.current.send({
        type: 'method_call',
        componentId,
        payload: {
          componentId,
          methodName,
          args
        }
      })
      
      return response.result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Method call failed')
      setError(error)
      opts.onError?.(error)
      throw error
    }
  }, [componentId])
  
  const emit = useCallback(async (eventName: string, payload: any = {}, eventOptions: any = {}) => {
    if (!componentId || !eventSystemRef.current) return
    
    try {
      await eventSystemRef.current.emit(componentId, eventName, payload, eventOptions)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Event emit failed')
      setError(error)
      opts.onError?.(error)
    }
  }, [componentId])
  
  const on = useCallback((eventName: string, listener: (event: any) => void) => {
    if (!componentId || !eventSystemRef.current) {
      return () => {} // No-op unsubscribe
    }
    
    return eventSystemRef.current.on(componentId, eventName, listener)
  }, [componentId])
  
  const sync = useCallback(async () => {
    if (!componentId || !stateBridgeRef.current) return
    
    try {
      const newState = await stateBridgeRef.current.syncState(componentId)
      setState(newState)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync failed')
      setError(error)
      opts.onError?.(error)
    }
  }, [componentId])
  
  const reconnect = useCallback(async () => {
    if (!wsManagerRef.current) return
    
    try {
      wsManagerRef.current.disconnect()
      await wsManagerRef.current.connect()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Reconnection failed')
      setError(error)
      opts.onError?.(error)
    }
  }, [])
  
  // Memoized result
  const result = useMemo<UseLiveComponentResult>(() => ({
    componentId,
    state,
    isLoading,
    error,
    isConnected,
    setState: setStateMethod,
    mergeState: mergeStateMethod,
    updateState: updateStateMethod,
    callMethod,
    emit,
    on,
    sync,
    reconnect
  }), [
    componentId,
    state,
    isLoading,
    error,
    isConnected,
    setStateMethod,
    mergeStateMethod,
    updateStateMethod,
    callMethod,
    emit,
    on,
    sync,
    reconnect
  ])
  
  return result
}

/**
 * Higher-order component for live components
 */
export function withLiveComponent<P extends object>(
  WrappedComponent: React.ComponentType<P & { liveComponent: UseLiveComponentResult }>,
  liveOptions: UseLiveComponentOptions
) {
  const WithLiveComponentWrapper = (props: P) => {
    const liveComponent = useLiveComponent(liveOptions)
    
    return <WrappedComponent {...props} liveComponent={liveComponent} />
  }
  
  WithLiveComponentWrapper.displayName = `withLiveComponent(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithLiveComponentWrapper
}

/**
 * Hook for managing multiple live components
 */
export function useLiveComponents(
  components: Array<{ key: string; options: UseLiveComponentOptions }>
): Record<string, UseLiveComponentResult> {
  const results: Record<string, UseLiveComponentResult> = {}
  
  components.forEach(({ key, options }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useLiveComponent(options)
  })
  
  return results
}

/**
 * Context provider for sharing WebSocket connection
 */
import React, { createContext, useContext } from 'react'

interface LiveComponentContextValue {
  wsManager: WebSocketManager | null
  isConnected: boolean
}

const LiveComponentContext = createContext<LiveComponentContextValue>({
  wsManager: null,
  isConnected: false
})

export function LiveComponentProvider({ 
  children, 
  serverUrl = 'ws://localhost:3000/fluxlive' 
}: { 
  children: React.ReactNode
  serverUrl?: string 
}) {
  const [wsManager] = useState(() => new WebSocketManager({ url: serverUrl }))
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    wsManager.onConnectionChange((state) => {
      setIsConnected(state === 'connected')
    })
    
    wsManager.connect().catch(console.error)
    
    return () => {
      wsManager.shutdown()
    }
  }, [wsManager])
  
  return (
    <LiveComponentContext.Provider value={{ wsManager, isConnected }}>
      {children}
    </LiveComponentContext.Provider>
  )
}

export function useLiveComponentContext() {
  return useContext(LiveComponentContext)
}