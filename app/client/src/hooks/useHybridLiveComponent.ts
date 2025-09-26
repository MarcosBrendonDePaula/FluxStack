// 🔥 Hybrid Live Component Hook - Zustand + Live Components

import { useState, useEffect, useCallback, useRef } from 'react'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useLiveComponent } from './useLiveComponent'
import { StateValidator } from '../lib/state-validator'
import type { 
  HybridState, 
  StateConflict, 
  HybridComponentOptions, 
  SyncResult 
} from '../lib/hybrid-types'

interface HybridStore<T> {
  hybridState: HybridState<T>
  updateState: (newState: Partial<T>, source?: 'client' | 'server') => void
  resolveConflicts: (conflicts: StateConflict<T>[]) => void
  reset: (initialState: T) => void
}

export interface UseHybridLiveComponentReturn<T> {
  // Combined state (client + server merged)
  state: T
  
  // Status information
  loading: boolean
  error: string | null
  connected: boolean
  componentId: string | null
  
  // Hybrid-specific info
  conflicts: StateConflict<T>[]
  status: 'synced' | 'pending' | 'conflict' | 'disconnected'
  validation: boolean
  
  // Actions
  call: (action: string, payload?: any) => Promise<void>
  set: (property: string, value: any) => void
  mount: () => Promise<void>
  unmount: () => Promise<void>
  
  // Hybrid actions
  sync: () => Promise<SyncResult<T>>
  resolveConflict: (field: keyof T, resolution: 'client' | 'server') => void
  validateState: () => boolean
}

/**
 * Create Zustand store for component instance
 */
function createHybridStore<T>(initialState: T) {
  return create<HybridStore<T>>()(
    subscribeWithSelector((set, get) => ({
      hybridState: {
        data: initialState,
        validation: StateValidator.createValidation(initialState, 'client'),
        conflicts: [],
        status: 'disconnected' as const
      },

      updateState: (newState: Partial<T> | T, source: 'client' | 'server' | 'mount' = 'server') => {
        console.log('🔄 [Zustand] updateState called', { newState, source })
        set((state) => {
          // Server/Mount: Replace state entirely (source of truth)
          // Client: Only for initial mount/reconnection
          const updatedData = source === 'client' || source === 'mount' 
            ? { ...state.hybridState.data, ...newState }
            : newState as T // Server replaces entirely
          
          console.log('🔄 [Zustand] State updated', {
            from: state.hybridState.data,
            to: updatedData
          })
          
          return {
            hybridState: {
              data: updatedData,
              validation: StateValidator.createValidation(updatedData, source),
              conflicts: [], // No conflicts in simplified model
              status: source === 'server' ? 'synced' : 'pending'
            }
          }
        })
      },

      resolveConflicts: (conflicts: StateConflict<T>[]) => {
        set((state) => ({
          hybridState: {
            ...state.hybridState,
            conflicts,
            status: conflicts.length > 0 ? 'conflict' : 'synced'
          }
        }))
      },

      reset: (initialState: T) => {
        set({
          hybridState: {
            data: initialState,
            validation: StateValidator.createValidation(initialState, 'client'),
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
    enableValidation = true,
    conflictResolution = 'auto',
    syncStrategy = 'optimistic',
    fallbackToLocal = true,
    ...liveOptions
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
  const resolveConflicts = store((state) => state.resolveConflicts)

  // Live Component integration
  const liveComponent = useLiveComponent<T>(componentName, initialState, {
    ...liveOptions,
    autoMount: false // We'll control mounting manually
  })

  const [lastServerState, setLastServerState] = useState<T | null>(null)
  const syncInProgress = useRef(false)

  const log = useCallback((message: string, data?: any) => {
    if (options.debug) {
      console.log(`[useHybridLiveComponent:${componentName}] ${message}`, data)
    }
  }, [componentName, options.debug])

  // Server state sync (Backend is ONLY source of mutations after mount)
  useEffect(() => {
    if (!liveComponent.componentId) {
      return
    }

    // Server state changed - directly sync (no conflict detection)
    if (liveComponent.state && JSON.stringify(liveComponent.state) !== JSON.stringify(lastServerState)) {
      log('Server state update', { 
        from: lastServerState, 
        to: liveComponent.state 
      })
      
      // Backend is source of truth - replace client state entirely
      updateState(liveComponent.state, 'server')
      setLastServerState(liveComponent.state)
    }
  }, [liveComponent.state, liveComponent.componentId, lastServerState, updateState, log])

  // Mount when connected (with initial client state for hydration)
  const mount = useCallback(async () => {
    if (!liveComponent.connected) return

    try {
      log('Mounting with initial client state', hybridState.data)
      
      // Mount with current client state as initial props (for first-time hydration)
      await liveComponent.mount()
      
      // After mount, server becomes source of truth
      log('Mount successful - server now controls state')
    } catch (error) {
      log('Mount failed', error)
      if (fallbackToLocal) {
        // Keep local state on mount failure
        log('Using local state as fallback')
      } else {
        throw error
      }
    }
  }, [liveComponent, hybridState.data, log, fallbackToLocal])

  // Auto-mount when connected
  useEffect(() => {
    if (liveComponent.connected && !liveComponent.componentId && hybridState.status === 'disconnected') {
      mount()
    }
  }, [liveComponent.connected, liveComponent.componentId, hybridState.status, mount])

  // Hybrid call action (with proper server sync)
  const call = useCallback(async (action: string, payload?: any): Promise<void> => {
    log('Calling server action', { action, payload, syncStrategy })

    // Execute on server (no optimistic updates - let server be source of truth via STATE_UPDATE)
    await liveComponent.call(action, payload)
    
    log('Action sent to server', { action, payload })
  }, [liveComponent, log])

  // Sync function (simplified - just request current server state)
  const sync = useCallback(async (): Promise<SyncResult<T>> => {
    if (!liveComponent.connected || !liveComponent.componentId) {
      return { success: false, error: 'Not connected' }
    }

    try {
      // Server state is already synced automatically - just return current state
      return { success: true, state: hybridState.data }
    } catch (error) {
      return { success: false, error: 'Sync failed' }
    }
  }, [liveComponent.connected, liveComponent.componentId, hybridState.data])

  // Simplified conflict resolution (no-op in simplified model)
  const resolveConflict = useCallback((field: keyof T, resolution: 'client' | 'server') => {
    log('No conflicts in simplified model', { field, resolution })
  }, [log])

  // Validate state
  const validateState = useCallback(() => {
    if (!enableValidation) return true
    return StateValidator.validateState(hybridState)
  }, [hybridState, enableValidation])

  // Helper for controlled inputs (temporary state + backend sync)
  const useControlledField = useCallback(<K extends keyof T>(
    field: K,
    action: string = 'set'
  ) => {
    const [tempValue, setTempValue] = useState<T[K]>(hybridState.data[field])
    
    // Sync temp value with server state when it changes
    useEffect(() => {
      setTempValue(hybridState.data[field])
    }, [hybridState.data[field]])
    
    const commitValue = useCallback(async (value?: T[K]) => {
      const valueToCommit = value !== undefined ? value : tempValue
      log('Committing field to server', { field, value: valueToCommit })
      await call(action, { [field]: valueToCommit })
    }, [tempValue, field, action])
    
    return {
      value: tempValue,
      setValue: setTempValue,
      commit: commitValue,
      isDirty: JSON.stringify(tempValue) !== JSON.stringify(hybridState.data[field])
    }
  }, [hybridState.data, call, log])

  return {
    // State
    state: hybridState.data,
    
    // Status
    loading: liveComponent.loading,
    error: liveComponent.error,
    connected: liveComponent.connected,
    componentId: liveComponent.componentId,
    
    // Hybrid status
    conflicts: hybridState.conflicts,
    status: hybridState.status,
    validation: validateState(),
    
    // Actions
    call,
    set: liveComponent.set,
    mount,
    unmount: liveComponent.unmount,
    
    // Hybrid actions
    sync,
    resolveConflict,
    validateState,
    
    // Field helpers
    useControlledField
  }
}