// 🔥 Hybrid Live Component Hook - Server-Driven with Zustand
// Direct WebSocket integration (no dependency on useLiveComponent)

import { useState, useEffect, useCallback, useRef } from 'react'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useWebSocket, type WebSocketMessage } from './useWebSocket'
import { StateValidator } from '../lib/state-validator'
import type { 
  HybridState, 
  StateConflict, 
  HybridComponentOptions
} from '../lib/hybrid-types'

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

  // Create Zustand store instance (one per component instance)
  const storeRef = useRef<ReturnType<typeof createHybridStore<T>> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createHybridStore(initialState)
  }
  const store = storeRef.current

  // Get state from Zustand store
  const hybridState = store((state) => state.hybridState)
  const updateState = store((state) => state.updateState)

  // Direct WebSocket integration
  const { 
    connected, 
    sendMessage,
    sendMessageAndWait, 
    lastMessage,
    error: wsError 
  } = useWebSocket({
    debug
  })

  // Component state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [componentId, setComponentId] = useState<string | null>(null)
  const [lastServerState, setLastServerState] = useState<T | null>(null)
  const mountedRef = useRef(false)

  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[useHybridLiveComponent:${componentName}] ${message}`, data)
    }
  }, [debug, componentName])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage || !componentId) {
      return
    }

    if (lastMessage.componentId === componentId) {
      switch (lastMessage.type) {
        case 'STATE_UPDATE':
          log('Processing STATE_UPDATE', lastMessage.payload)
          if (lastMessage.payload?.state) {
            const newState = lastMessage.payload.state
            updateState(newState, 'server')
            setLastServerState(newState)
            log('State updated from server', newState)
          }
          break

        case 'MESSAGE_RESPONSE':
          if (lastMessage.originalType !== 'CALL_ACTION') {
            log('Received response for', lastMessage.originalType)
          }
          break

        case 'BROADCAST':
          log('Received broadcast', lastMessage.payload)
          break

        case 'ERROR':
          log('Received error', lastMessage.payload)
          setError(lastMessage.payload?.error || 'Unknown error')
          break
      }
    }
  }, [lastMessage, componentId, updateState, log])

  // Mount component
  const mount = useCallback(async () => {
    if (!connected || mountedRef.current) {
      return
    }

    setLoading(true)
    setError(null)
    log('Mounting component - server will control all state')

    try {
      const message: WebSocketMessage = {
        type: 'COMPONENT_MOUNT',
        componentId: 'mounting',
        payload: {
          component: componentName,
          props: initialState,
          room,
          userId
        }
      }

      const response = await sendMessage(message)
      
      if (response?.success) {
        const newComponentId = response.result?.componentId
        if (newComponentId) {
          setComponentId(newComponentId)
          mountedRef.current = true
          log('Component mounted successfully', { componentId: newComponentId })
        } else {
          throw new Error('No component ID returned')
        }
      } else {
        throw new Error(response?.error || 'Failed to mount component')
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
    if (connected && autoMount && !mountedRef.current && hybridState.status === 'disconnected') {
      mount()
    }
  }, [connected, autoMount, mount, hybridState.status])

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
    const [tempValue, setTempValue] = useState<T[K]>(hybridState.data[field])
    
    // Always sync temp value with server state (server is source of truth)
    useEffect(() => {
      setTempValue(hybridState.data[field])
    }, [hybridState.data[field]])
    
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
      isDirty: JSON.stringify(tempValue) !== JSON.stringify(hybridState.data[field])
    }
  }, [hybridState.data, call, log])

  // Calculate simple status
  const status = hybridState.status === 'disconnected' ? 'disconnected' : 'synced'

  return {
    // Server-driven state
    state: hybridState.data,
    
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
    
    // Helper for forms
    useControlledField
  }
}