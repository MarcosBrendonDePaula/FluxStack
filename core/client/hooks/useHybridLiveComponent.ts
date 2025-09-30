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

// Client-side state persistence for reconnection
interface PersistedComponentState {
  componentName: string
  signedState: any
  room?: string
  userId?: string
  lastUpdate: number
}

const STORAGE_KEY_PREFIX = 'fluxstack_component_'
const STATE_MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

// Global re-hydration throttling by component name
const globalRehydrationAttempts = new Map<string, Promise<boolean>>()

// Utility functions for state persistence
const persistComponentState = (componentName: string, signedState: any, room?: string, userId?: string) => {
  try {
    const persistedState: PersistedComponentState = {
      componentName,
      signedState,
      room,
      userId,
      lastUpdate: Date.now()
    }
    
    const key = `${STORAGE_KEY_PREFIX}${componentName}`
    localStorage.setItem(key, JSON.stringify(persistedState))
    
    // State persisted silently to avoid log spam
  } catch (error) {
    console.warn('⚠️ Failed to persist component state:', error)
  }
}

const getPersistedState = (componentName: string): PersistedComponentState | null => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${componentName}`
    console.log('🔍 Getting persisted state', { componentName, key })
    const stored = localStorage.getItem(key)
    
    if (!stored) {
      console.log('❌ No localStorage data found', { key })
      return null
    }
    
    console.log('✅ Found localStorage data', { stored })
    const persistedState: PersistedComponentState = JSON.parse(stored)
    
    // Check if state is not too old
    const age = Date.now() - persistedState.lastUpdate
    if (age > STATE_MAX_AGE) {
      localStorage.removeItem(key)
      console.log('🗑️ Expired persisted state removed:', { componentName, age, maxAge: STATE_MAX_AGE })
      return null
    }
    
    console.log('✅ Valid persisted state found', { componentName, age })
    return persistedState
  } catch (error) {
    console.warn('⚠️ Failed to retrieve persisted state:', error)
    return null
  }
}

const clearPersistedState = (componentName: string) => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${componentName}`
    localStorage.removeItem(key)
    console.log('🗑️ Persisted state cleared:', componentName)
  } catch (error) {
    console.warn('⚠️ Failed to clear persisted state:', error)
  }
}

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
  
  // Connection status with all possible states
  status: 'synced' | 'disconnected' | 'connecting' | 'reconnecting' | 'loading' | 'mounting' | 'error'
  
  // Actions (all go to server)
  call: (action: string, payload?: any) => Promise<void>
  callAndWait: (action: string, payload?: any, timeout?: number) => Promise<any>
  mount: () => Promise<void>
  unmount: () => Promise<void>
  
  // WebSocket utilities
  sendMessage: (message: any) => Promise<WebSocketResponse>
  sendMessageAndWait: (message: any, timeout?: number) => Promise<WebSocketResponse>
  
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

  // Get state from Zustand store with optimized selectors
  const hybridState = store((state) => state.hybridState)
  const stateData = store((state) => state.hybridState.data)
  const updateState = store((state) => state.updateState)
  
  // Log state changes (throttled to avoid spam)
  const lastLoggedStateRef = useRef<string>('')
  useEffect(() => {
    if (debug) {
      const stateString = JSON.stringify(stateData)
      if (stateString !== lastLoggedStateRef.current) {
        console.log('🔍 [Zustand] State data changed:', stateData)
        lastLoggedStateRef.current = stateString
      }
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
  const [componentId, setComponentId] = useState<string | null>(null)
  const [lastServerState, setLastServerState] = useState<T | null>(null)
  const [mountLoading, setMountLoading] = useState(false) // Only for mount/unmount operations
  const [error, setError] = useState<string | null>(null)
  const [rehydrating, setRehydrating] = useState(false)
  const [currentSignedState, setCurrentSignedState] = useState<any>(null)
  const mountedRef = useRef(false)
  const mountingRef = useRef(false)
  const lastKnownComponentIdRef = useRef<string | null>(null)

  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[${logPrefix}] ${message}`, data)
    }
  }, [debug, logPrefix])

  // Prevent multiple simultaneous re-hydration attempts
  const rehydrationAttemptRef = useRef<Promise<boolean> | null>(null)

  // Automatic re-hydration on reconnection
  const attemptRehydration = useCallback(async () => {
    log('🔄 attemptRehydration called', { connected, rehydrating, mounting: mountingRef.current })
    
    if (!connected || rehydrating || mountingRef.current) {
      log('❌ Re-hydration blocked', { connected, rehydrating, mounting: mountingRef.current })
      return false
    }

    // Prevent multiple simultaneous attempts (local)
    if (rehydrationAttemptRef.current) {
      log('⏳ Re-hydration already in progress locally, waiting...')
      return await rehydrationAttemptRef.current
    }

    // Prevent multiple simultaneous attempts (global by component name)
    if (globalRehydrationAttempts.has(componentName)) {
      log('⏳ Re-hydration already in progress globally for', componentName)
      return await globalRehydrationAttempts.get(componentName)!
    }

    // Check for persisted state
    log('🔍 Checking for persisted state', { componentName })
    const persistedState = getPersistedState(componentName)
    if (!persistedState) {
      log('❌ No persisted state found for re-hydration', { componentName })
      return false
    }
    
    log('✅ Found persisted state', { persistedState })

    // Create and store the re-hydration promise
    const rehydrationPromise = (async () => {
      setRehydrating(true)
      setError(null)
      log('Attempting automatic re-hydration', {
        componentName,
        persistedState: {
          lastUpdate: persistedState.lastUpdate,
          age: Date.now() - persistedState.lastUpdate
        }
      })

      try {
            // Send re-hydration request with signed state
        const tempComponentId = lastKnownComponentIdRef.current || instanceId.current
        
        log('📤 Sending COMPONENT_REHYDRATE request', {
          tempComponentId,
          componentName,
          currentRehydrating: rehydrating,
          persistedState: {
            room: persistedState.room,
            userId: persistedState.userId,
            signedStateVersion: persistedState.signedState?.version
          }
        })
        
        const response = await sendMessageAndWait({
          type: 'COMPONENT_REHYDRATE',
          componentId: tempComponentId,
          payload: {
            componentName,
            signedState: persistedState.signedState,
            room: persistedState.room,
            userId: persistedState.userId
          },
          expectResponse: true
        }, 10000)

        log('💫 Re-hydration response received:', {
          success: response?.success,
          newComponentId: response?.result?.newComponentId,
          error: response?.error
        })

        if (response?.success && response?.result?.newComponentId) {
          log('✅ Re-hydration successful - updating componentId in attemptRehydration', {
            oldComponentId: componentId,
            newComponentId: response.result.newComponentId
          })
          
          // Update componentId immediately to prevent further re-hydration attempts
          setComponentId(response.result.newComponentId)
          lastKnownComponentIdRef.current = response.result.newComponentId
          
          return true
        } else {
          log('❌ Re-hydration failed', response?.error || 'Unknown error')
          // Clear invalid persisted state
          clearPersistedState(componentName)
          setError(response?.error || 'Re-hydration failed')
          return false
        }

      } catch (error: any) {
        log('Re-hydration error', error.message)
        clearPersistedState(componentName)
        setError(error.message)
        return false
      } finally {
        setRehydrating(false)
        rehydrationAttemptRef.current = null // Clear the local reference
        globalRehydrationAttempts.delete(componentName) // Clear the global reference
      }
    })()

    // Store both locally and globally
    rehydrationAttemptRef.current = rehydrationPromise
    globalRehydrationAttempts.set(componentName, rehydrationPromise)
    
    return await rehydrationPromise
  }, [connected, rehydrating, componentName, sendMessageAndWait, log])

  // Handle incoming WebSocket messages (real-time processing)
  useEffect(() => {
    if (!componentId) {
      return
    }

    // Process each message immediately as it arrives
    const unsubscribe = onMessage((message: any) => {
      // Debug: Log all received messages first
      log('🔍 Received WebSocket message', {
        type: message.type,
        messageComponentId: message.componentId,
        currentComponentId: componentId,
        requestId: message.requestId,
        success: message.success
      })
      
      // Don't filter STATE_REHYDRATED and COMPONENT_REHYDRATED - they may have different componentIds
      if (message.type !== 'STATE_REHYDRATED' && message.type !== 'COMPONENT_REHYDRATED' && message.componentId !== componentId) {
        log('🚫 Filtering out message - componentId mismatch', {
          type: message.type,
          messageComponentId: message.componentId,
          currentComponentId: componentId
        })
        return
      }

      log('✅ Processing message immediately', { type: message.type, componentId: message.componentId })
      
      switch (message.type) {
        case 'STATE_UPDATE':
          log('Processing STATE_UPDATE', message.payload)
          if (message.payload?.state) {
            const newState = message.payload.state
            log('Updating Zustand with server state', newState)
            updateState(newState, 'server')
            setLastServerState(newState)
            
            // Debug signed state persistence
            if (message.payload?.signedState) {
              log('Found signedState in STATE_UPDATE - persisting', {
                componentName,
                signedState: message.payload.signedState
              })
              setCurrentSignedState(message.payload.signedState)
              persistComponentState(componentName, message.payload.signedState, room, userId)
              log('State persisted successfully')
            } else {
              log('⚠️ No signedState in STATE_UPDATE payload', message.payload)
            }
            
            log('State updated from server successfully', newState)
          } else {
            log('STATE_UPDATE has no state payload', message.payload)
          }
          break

        case 'STATE_REHYDRATED':
          log('Processing STATE_REHYDRATED', message.payload)
          if (message.payload?.state && message.payload?.newComponentId) {
            const newState = message.payload.state
            const newComponentId = message.payload.newComponentId
            const oldComponentId = message.payload.oldComponentId
            
            log('Component re-hydrated successfully', {
              oldComponentId,
              newComponentId,
              state: newState
            })
            
            // Update component ID and state
            setComponentId(newComponentId)
            lastKnownComponentIdRef.current = newComponentId
            updateState(newState, 'server')
            setLastServerState(newState)
            
            // Update signed state
            if (message.payload?.signedState) {
              setCurrentSignedState(message.payload.signedState)
              persistComponentState(componentName, message.payload.signedState, room, userId)
            }
            
            setRehydrating(false)
            setError(null)
            
            log('Re-hydration completed successfully')
          }
          break

        case 'COMPONENT_REHYDRATED':
          log('🎉 Processing COMPONENT_REHYDRATED response', message)
          log('🎉 Response details:', {
            success: message.success,
            newComponentId: message.result?.newComponentId,
            requestId: message.requestId,
            currentRehydrating: rehydrating,
            currentComponentId: componentId
          })
          
          // Check if this is a successful re-hydration
          if (message.success && message.result?.newComponentId) {
            log('✅ Re-hydration succeeded, updating componentId', {
              from: componentId,
              to: message.result.newComponentId
            })
            
            // Update componentId immediately to stop the loop
            setComponentId(message.result.newComponentId)
            lastKnownComponentIdRef.current = message.result.newComponentId
            setRehydrating(false)
            setError(null)
            
            log('🎯 ComponentId updated, re-hydration completed')
          } else if (!message.success) {
            log('❌ Re-hydration failed', message.error)
            setRehydrating(false)
            setError(message.error || 'Re-hydration failed')
          }
          
          // This is also handled by sendMessageAndWait, but we process it here too for immediate UI updates
          break

        case 'MESSAGE_RESPONSE':
          if (message.originalType !== 'CALL_ACTION') {
            log('Received response for', message.originalType)
          }
          
          // Check for re-hydration required error
          if (!message.success && message.error?.includes?.('COMPONENT_REHYDRATION_REQUIRED')) {
            log('🔄 Component re-hydration required from MESSAGE_RESPONSE - attempting automatic re-hydration', {
              error: message.error,
              currentComponentId: componentId,
              rehydrating
            })
            
            if (!rehydrating) {
              attemptRehydration().then(rehydrated => {
                if (rehydrated) {
                  log('✅ Re-hydration successful after action error')
                } else {
                  log('❌ Re-hydration failed after action error')
                  setError('Component lost connection and could not be recovered')
                }
              }).catch(error => {
                log('💥 Re-hydration error after action error', error)
                setError('Component recovery failed')
              })
            } else {
              log('⚠️ Already re-hydrating, skipping duplicate attempt')
            }
          }
          break

        case 'BROADCAST':
          log('Received broadcast', message.payload)
          break

        case 'ERROR':
          log('Received error', message.payload)
          const errorMessage = message.payload?.error || 'Unknown error'
          
          // Check for re-hydration required error
          if (errorMessage.includes('COMPONENT_REHYDRATION_REQUIRED')) {
            log('🔄 Component re-hydration required from ERROR - attempting automatic re-hydration', {
              errorMessage,
              currentComponentId: componentId,
              rehydrating
            })
            
            if (!rehydrating) {
              attemptRehydration().then(rehydrated => {
                if (rehydrated) {
                  log('✅ Re-hydration successful after error')
                } else {
                  log('❌ Re-hydration failed after error')
                  setError('Component lost connection and could not be recovered')
                }
              }).catch(error => {
                log('💥 Re-hydration error after error', error)
                setError('Component recovery failed')
              })
            } else {
              log('⚠️ Already re-hydrating, skipping duplicate attempt from ERROR')
            }
          } else {
            setError(errorMessage)
          }
          break
      }
    })

    // Cleanup callback on unmount
    return unsubscribe
  }, [componentId, updateState, log, onMessage, attemptRehydration])

  // Mount component
  const mount = useCallback(async () => {
    if (!connected || mountedRef.current || mountingRef.current) {
      return
    }

    mountingRef.current = true
    setMountLoading(true)
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
        
        // Immediately persist signed state from mount response
        if (response.result.signedState) {
          log('Found signedState in mount response - persisting immediately', {
            componentName,
            signedState: response.result.signedState
          })
          setCurrentSignedState(response.result.signedState)
          persistComponentState(componentName, response.result.signedState, room, userId)
          log('Mount state persisted successfully')
        } else {
          log('⚠️ No signedState in mount response', response.result)
        }
        
        // Update state if provided
        if (response.result.initialState) {
          log('Updating state from mount response', response.result.initialState)
          updateState(response.result.initialState, 'server')
          setLastServerState(response.result.initialState)
        }
        
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
      setMountLoading(false)
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
      // Don't set loading for actions to avoid UI flicker
      
      const message: WebSocketMessage = {
        type: 'CALL_ACTION',
        componentId,
        action,
        payload,
        expectResponse: true  // Always expect response to catch errors like re-hydration required
      }

      // Send action - server will update state and send back changes
      try {
        const response = await sendMessageAndWait(message, 5000)
        
        // Check for re-hydration required error
        if (!response.success && response.error?.includes?.('COMPONENT_REHYDRATION_REQUIRED')) {
          log('Component re-hydration required - attempting automatic re-hydration')
          const rehydrated = await attemptRehydration()
          if (rehydrated) {
            log('Re-hydration successful - retrying action with new component ID')
            // Use the updated componentId after re-hydration
            const currentComponentId = componentId // This should be updated by re-hydration
            const retryMessage: WebSocketMessage = {
              type: 'CALL_ACTION',
              componentId: currentComponentId,
              action,
              payload,
              expectResponse: true
            }
            await sendMessageAndWait(retryMessage, 5000)
          } else {
            throw new Error('Component lost connection and could not be recovered')
          }
        } else if (!response.success) {
          throw new Error(response.error || 'Action failed')
        }
      } catch (wsError: any) {
        // Check if the WebSocket error is about re-hydration
        if (wsError.message?.includes?.('COMPONENT_REHYDRATION_REQUIRED')) {
          log('Component re-hydration required (from WebSocket error) - attempting automatic re-hydration')
          const rehydrated = await attemptRehydration()
          if (rehydrated) {
            log('Re-hydration successful - retrying action with new component ID')
            // Use the updated componentId after re-hydration
            const currentComponentId = componentId
            const retryMessage: WebSocketMessage = {
              type: 'CALL_ACTION',
              componentId: currentComponentId,
              action,
              payload,
              expectResponse: true
            }
            await sendMessageAndWait(retryMessage, 5000)
          } else {
            throw new Error('Component lost connection and could not be recovered')
          }
        } else {
          // Re-throw other WebSocket errors
          throw wsError
        }
      }
      
      log('Action sent to server - waiting for server state update', { action, payload })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed'
      setError(errorMessage)
      log('Action failed', { action, error: err })
      throw err
    } finally {
      // No loading state for actions to prevent UI flicker
    }
  }, [componentId, connected, sendMessage, log])

  // Call action and wait for specific return value
  const callAndWait = useCallback(async (action: string, payload?: any, timeout?: number): Promise<any> => {
    if (!componentId || !connected) {
      throw new Error('Component not mounted or WebSocket not connected')
    }

    log('Calling server action and waiting for response', { action, payload })

    try {
      // Don't set loading for callAndWait to avoid UI flicker
      
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
      // No loading state for actions to prevent UI flicker
    }
  }, [componentId, connected, sendMessageAndWait, log])

  // Auto-mount with re-hydration attempt
  useEffect(() => {
    if (connected && autoMount && !mountedRef.current && !componentId && !mountingRef.current && !rehydrating) {
      log('Auto-mounting with re-hydration attempt', { 
        connected, 
        autoMount, 
        mounted: mountedRef.current, 
        componentId, 
        mounting: mountingRef.current,
        rehydrating 
      })
      
      // First try re-hydration, then fall back to normal mount
      attemptRehydration().then(rehydrated => {
        if (!rehydrated && !mountedRef.current && !componentId && !mountingRef.current) {
          log('Re-hydration failed or not available, proceeding with normal mount')
          mount()
        } else if (rehydrated) {
          log('Re-hydration successful, skipping normal mount')
        }
      }).catch(error => {
        log('Re-hydration attempt failed with error, proceeding with normal mount', error)
        if (!mountedRef.current && !componentId && !mountingRef.current) {
          mount()
        }
      })
    }
  }, [connected, autoMount, mount, componentId, log, rehydrating, attemptRehydration])

  // Monitor connection status changes and force reconnection
  const prevConnectedRef = useRef(connected)
  useEffect(() => {
    const wasConnected = prevConnectedRef.current
    const isConnected = connected
    
    log('🔍 Connection status change detected:', {
      wasConnected,
      isConnected,
      componentMounted: mountedRef.current,
      componentId
    })
    
    // If we lost connection and had a component mounted, prepare for reconnection
    if (wasConnected && !isConnected && mountedRef.current) {
      log('🔄 Connection lost - marking component for remount on reconnection')
      mountedRef.current = false
      setComponentId(null)
    }
    
    // If we reconnected and don't have a component mounted, try re-hydration first
    if (!wasConnected && isConnected && !mountedRef.current && !mountingRef.current && !rehydrating) {
      log('🔗 Connection restored - checking for persisted state to re-hydrate')
      
      // Small delay to ensure WebSocket is fully established
      setTimeout(() => {
        if (!mountedRef.current && !mountingRef.current && !rehydrating) {
          const persistedState = getPersistedState(componentName)
          
          if (persistedState && persistedState.signedState) {
            log('🔄 Found persisted state - attempting re-hydration on reconnection', {
              hasSignedState: !!persistedState.signedState,
              lastUpdate: persistedState.lastUpdate,
              age: Date.now() - persistedState.lastUpdate
            })
            
            attemptRehydration().then(success => {
              if (success) {
                log('✅ Re-hydration successful on reconnection')
              } else {
                log('❌ Re-hydration failed on reconnection - falling back to mount')
                mount()
              }
            }).catch(error => {
              log('💥 Re-hydration error on reconnection - falling back to mount', error)
              mount()
            })
          } else {
            log('🚀 No persisted state found - executing fresh mount after reconnection')
            mount()
          }
        }
      }, 100)
    }
    
    // If connected but no component after some time, force mount (fallback)
    if (isConnected && !mountedRef.current && !mountingRef.current && !rehydrating) {
      log('🔄 Connected but no component - scheduling fallback mount attempt')
      setTimeout(() => {
        if (connected && !mountedRef.current && !mountingRef.current && !rehydrating) {
          log('🚀 Forcing fallback mount for orphaned connection')
          mount()
        }
      }, 500) // Increased timeout to allow for re-hydration attempts
    }
    
    prevConnectedRef.current = connected
  }, [connected, mount, componentId, log, attemptRehydration, componentName, rehydrating])

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

  // Calculate detailed status
  const getStatus = () => {
    if (!connected) return 'connecting'
    if (rehydrating) return 'reconnecting'
    if (mountLoading) return 'loading' // Only show loading for mount operations
    if (error) return 'error'
    if (!componentId) return 'mounting'
    if (hybridState.status === 'disconnected') return 'disconnected'
    return 'synced'
  }
  
  const status = getStatus()

  // Debug log for state return (throttled)
  const lastReturnedStateRef = useRef<string>('')
  if (debug) {
    const currentStateString = JSON.stringify(stateData)
    if (currentStateString !== lastReturnedStateRef.current) {
      console.log('🎯 [Hook] Returning state to component:', stateData)
      lastReturnedStateRef.current = currentStateString
    }
  }

  return {
    // Server-driven state
    state: stateData,
    
    // Status
    loading: mountLoading, // Only loading for mount operations
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