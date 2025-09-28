// 🔥 Hybrid Live Component Hook - Server-Driven with Zustand
// Direct WebSocket integration (no dependency on useLiveComponent)

import { useState, useEffect, useCallback, useRef } from 'react'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useWebSocket, type WebSocketMessage } from './useWebSocket'
import { StateValidator } from './state-validator'
import type { 
  HybridState, 
  StateConflict, 
  HybridComponentOptions
} from '../../types/types'

interface HybridStore<T> {
  hybridState: HybridState<T>
  updateState: (newState: T, source?: 'server' | 'mount') => void
  reset: (initialState: T) => void
}

export interface UseHybridLiveComponentReturn<T> {
  // Server-driven state (read-only from frontend perspective)
  state: T
  
  // Status information
  loading: boolean
  error: string | null
  connected: boolean
  componentId: string | null
  
  // Simple status (no conflicts in server-only model)
  status: 'synced' | 'disconnected'
  
  // Actions (all go to server)
  call: (action: string, payload?: any) => Promise<void>
  callAndWait: (action: string, payload?: any, timeout?: number) => Promise<any>
  mount: () => Promise<void>
  unmount: () => Promise<void>
  
  // Helper for temporary input state
  useControlledField: <K extends keyof T>(field: K, action?: string) => {
    value: T[K]
    setValue: (value: T[K]) => void
    commit: (value?: T[K]) => Promise<void>
    isDirty: boolean
  }
}

/**
 * Create Zustand store for component instance
 */
function createHybridStore<T>(initialState: T) {
  return create<HybridStore<T>>()(
    subscribeWithSelector((set, get) => ({
      hybridState: {
        data: initialState,
        validation: StateValidator.createValidation(initialState, 'mount'),
        conflicts: [],
        status: 'disconnected' as const
      },

      updateState: (newState: T, source: 'server' | 'mount' = 'server') => {
        console.log('🔄 [Zustand] Server state update', { newState, source })
        set((state) => {
          // Backend is ONLY source of state mutations
          const updatedData = newState
          
          console.log('🔄 [Zustand] State replaced from server', {
            from: state.hybridState.data,
            to: updatedData
          })
          
          return {
            hybridState: {
              data: updatedData,
              validation: StateValidator.createValidation(updatedData, source),
              conflicts: [], // No conflicts - server is source of truth
              status: 'synced'
            }
          }
        })
      },

      reset: (initialState: T) => {
        set({
          hybridState: {
            data: initialState,
            validation: StateValidator.createValidation(initialState, 'mount'),
            conflicts: [],
            status: 'disconnected'
          }
        })
      }
    }))
  )
}

export function useHybridLiveComponent<T = any>(
  componentName: string,
  initialState: T,
  options: HybridComponentOptions = {}
): UseHybridLiveComponentReturn<T> {
  const {
    fallbackToLocal = true,
    room,
    userId,
    autoMount = true,
    debug = false
  } = options

  // Create unique instance ID to avoid conflicts between multiple instances
  const instanceId = useRef(`${componentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const logPrefix = `${instanceId.current}${room ? `[${room}]` : ''}`

  // Create Zustand store instance (one per component instance)
  const storeRef = useRef<ReturnType<typeof createHybridStore<T>> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createHybridStore(initialState)
  }
  const store = storeRef.current

  // Get state from Zustand store directly
  const hybridState = store((state) => state.hybridState)
  const stateData = store((state) => state.hybridState.data)
  const updateState = store((state) => state.updateState)
  
  // Log state changes
  useEffect(() => {
    if (debug) {
      console.log('🔍 [Zustand] State data changed:', stateData)
    }
  }, [stateData, debug])

  // Direct WebSocket integration
  const { 
    connected, 
    sendMessage,
    sendMessageAndWait,
    onMessage,
    error: wsError 
  } = useWebSocket({
    debug
  })

  // Component state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [componentId, setComponentId] = useState<string | null>(null)
  const [lastServerState, setLastServerState] = useState<T | null>(null)
  const [, forceUpdate] = useState({})
  const mountedRef = useRef(false)
  const mountingRef = useRef(false)

  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[${logPrefix}] ${message}`, data)
    }
  }, [debug, logPrefix])

  // Handle incoming WebSocket messages (real-time processing)
  useEffect(() => {
    if (!componentId) {
      return
    }

    // Process each message immediately as it arrives
    const unsubscribe = onMessage((message: any) => {
      if (message.componentId !== componentId) {
        return
      }

      log('Processing message immediately', { type: message.type, componentId: message.componentId })
      
      switch (message.type) {
        case 'STATE_UPDATE':
          log('Processing STATE_UPDATE', message.payload)
          if (message.payload?.state) {
            const newState = message.payload.state
            log('Updating Zustand with server state', newState)
            updateState(newState, 'server')
            setLastServerState(newState)
            forceUpdate({}) // Force React re-render
            log('State updated from server successfully', newState)
          } else {
            log('STATE_UPDATE has no state payload', message.payload)
          }
          break

        case 'MESSAGE_RESPONSE':
          if (message.originalType !== 'CALL_ACTION') {
            log('Received response for', message.originalType)
          }
          break

        case 'BROADCAST':
          log('Received broadcast', message.payload)
          break

        case 'ERROR':
          log('Received error', message.payload)
          setError(message.payload?.error || 'Unknown error')
          break
      }
    })

    // Cleanup callback on unmount
    return unsubscribe
  }, [componentId, updateState, log, onMessage])

  // Mount component
  const mount = useCallback(async () => {
    if (!connected || mountedRef.current || mountingRef.current) {
      return
    }

    mountingRef.current = true
    setLoading(true)
    setError(null)
    log('Mounting component - server will control all state')

    try {
      const message: WebSocketMessage = {
        type: 'COMPONENT_MOUNT',
        componentId: instanceId.current,
        payload: {
          component: componentName,
          props: initialState,
          room,
          userId
        }
      }

      const response = await sendMessageAndWait(message, 10000)
      
      log('Mount response received', { response, fullResponse: JSON.stringify(response) })
      
      if (response?.success && response?.result?.componentId) {
        const newComponentId = response.result.componentId
        setComponentId(newComponentId)
        mountedRef.current = true
        log('Component mounted successfully', { componentId: newComponentId })
      } else {
        log('Failed to parse response', { 
          hasResponse: !!response,
          hasSuccess: response?.success,
          hasResult: !!response?.result,
          hasComponentId: response?.result?.componentId,
          error: response?.error 
        })
        throw new Error(response?.error || 'No component ID returned from server')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mount failed'
      setError(errorMessage)
      log('Mount failed', err)
      
      if (fallbackToLocal) {
        log('Using local state as fallback until reconnection')
      } else {
        throw err
      }
    } finally {
      setLoading(false)
      mountingRef.current = false
    }
  }, [connected, componentName, initialState, room, userId, sendMessage, log, fallbackToLocal])

  // Unmount component
  const unmount = useCallback(async () => {
    if (!componentId || !connected) {
      return
    }

    log('Unmounting component', { componentId })

    try {
      await sendMessage({
        type: 'COMPONENT_UNMOUNT',
        componentId
      })
      
      setComponentId(null)
      mountedRef.current = false
      mountingRef.current = false
      log('Component unmounted successfully')
    } catch (err) {
      log('Unmount failed', err)
    }
  }, [componentId, connected, sendMessage, log])

  // Server-only actions (no client-side state mutations)
  const call = useCallback(async (action: string, payload?: any): Promise<void> => {
    if (!componentId || !connected) {
      throw new Error('Component not mounted or WebSocket not connected')
    }

    log('Calling server action', { action, payload })

    try {
      setLoading(true)
      
      const message: WebSocketMessage = {
        type: 'CALL_ACTION',
        componentId,
        action,
        payload
      }

      // Send action - server will update state and send back changes
      await sendMessage(message)
      
      log('Action sent to server - waiting for server state update', { action, payload })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed'
      setError(errorMessage)
      log('Action failed', { action, error: err })
      throw err
    } finally {
      setLoading(false)
    }
  }, [componentId, connected, sendMessage, log])

  // Call action and wait for specific return value
  const callAndWait = useCallback(async (action: string, payload?: any, timeout?: number): Promise<any> => {
    if (!componentId || !connected) {
      throw new Error('Component not mounted or WebSocket not connected')
    }

    log('Calling server action and waiting for response', { action, payload })

    try {
      setLoading(true)
      
      const message: WebSocketMessage = {
        type: 'CALL_ACTION',
        componentId,
        action,
        payload
      }

      // Send action and wait for response
      const result = await sendMessageAndWait(message, timeout)
      
      log('Action completed with result', { action, payload, result })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed'
      setError(errorMessage)
      log('Action failed', { action, error: err })
      throw err
    } finally {
      setLoading(false)
    }
  }, [componentId, connected, sendMessageAndWait, log])

  // Auto-mount when connected
  useEffect(() => {
    if (connected && autoMount && !mountedRef.current && !componentId && !mountingRef.current) {
      log('Auto-mounting component', { connected, autoMount, mounted: mountedRef.current, componentId, mounting: mountingRef.current })
      mount()
    }
  }, [connected, autoMount, mount, componentId, log])

  // Unmount on cleanup
  useEffect(() => {
    return () => {
      if (mountedRef.current) {
        unmount()
      }
    }
  }, [unmount])

  // Update error from WebSocket
  useEffect(() => {
    if (wsError) {
      setError(wsError)
    }
  }, [wsError])

  // Helper for controlled inputs (temporary local state + server commit)
  const useControlledField = useCallback(<K extends keyof T>(
    field: K,
    action: string = 'updateField'
  ) => {
    const [tempValue, setTempValue] = useState<T[K]>(stateData[field])
    
    // Always sync temp value with server state (server is source of truth)
    useEffect(() => {
      setTempValue(stateData[field])
    }, [stateData[field]])
    
    const commitValue = useCallback(async (value?: T[K]) => {
      const valueToCommit = value !== undefined ? value : tempValue
      log('Committing field to server', { field, value: valueToCommit })
      
      // Call server action - server will update state and send back changes
      await call(action, { field, value: valueToCommit })
      
      // No local state mutation - wait for server response
    }, [tempValue, field, action])
    
    return {
      value: tempValue,
      setValue: setTempValue,
      commit: commitValue,
      isDirty: JSON.stringify(tempValue) !== JSON.stringify(stateData[field])
    }
  }, [stateData, call, log])

  // Calculate simple status
  const status = hybridState.status === 'disconnected' ? 'disconnected' : 'synced'

  // Debug log for state return
  if (debug) {
    console.log('🎯 [Hook] Returning state to component:', stateData)
  }

  return {
    // Server-driven state
    state: stateData,
    
    // Status
    loading,
    error,
    connected,
    componentId,
    status,
    
    // Actions (all server-driven)
    call,
    callAndWait,
    mount,
    unmount,
    
    // WebSocket utilities
    sendMessage,
    sendMessageAndWait,
    
    // Helper for forms
    useControlledField
  }
}