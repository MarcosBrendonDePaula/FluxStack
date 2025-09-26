// 🔥 Live Component Hook

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocket, type WebSocketMessage } from './useWebSocket'

export interface LiveComponentOptions {
  room?: string
  userId?: string
  autoMount?: boolean
  debug?: boolean
}

export interface UseLiveComponentReturn<TState = any> {
  state: TState
  loading: boolean
  error: string | null
  connected: boolean
  componentId: string | null
  call: (action: string, payload?: any) => Promise<void>
  set: (property: string, value: any) => void
  mount: () => Promise<void>
  unmount: () => Promise<void>
}

export function useLiveComponent<TState = any>(
  componentName: string,
  initialProps: Partial<TState> = {},
  options: LiveComponentOptions = {}
): UseLiveComponentReturn<TState> {
  const {
    room,
    userId,
    autoMount = true,
    debug = false
  } = options

  const [state, setState] = useState<TState>(initialProps as TState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [componentId, setComponentId] = useState<string | null>(null)

  const mountedRef = useRef(false)

  const { 
    connected, 
    sendMessage, 
    lastMessage,
    messageHistory,
    error: wsError 
  } = useWebSocket({
    debug
  })

  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[useLiveComponent:${componentName}] ${message}`, data)
    }
  }, [debug, componentName])

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage || !componentId) {
      log('Skipping message processing', { hasMessage: !!lastMessage, hasComponentId: !!componentId })
      return
    }

    // Log ALL messages to debug the issue
    if (lastMessage.type === 'STATE_UPDATE') {
      log('🔍 STATE_UPDATE received', { 
        messageComponentId: lastMessage.componentId, 
        currentComponentId: componentId,
        match: lastMessage.componentId === componentId,
        payload: lastMessage.payload
      })
    }

    log('Processing message', { 
      messageType: lastMessage.type, 
      messageComponentId: lastMessage.componentId, 
      currentComponentId: componentId,
      match: lastMessage.componentId === componentId 
    })

    if (lastMessage.componentId === componentId) {
      switch (lastMessage.type) {
        case 'STATE_UPDATE':
          // Handle direct state updates from server
          log('Processing STATE_UPDATE', lastMessage.payload)
          if (lastMessage.payload?.state) {
            log('Updating state from:', state, 'to:', lastMessage.payload.state)
            const newState = lastMessage.payload.state
            setState(newState)
            log('State updated! New state:', newState)
          } else {
            log('No state in STATE_UPDATE payload', lastMessage.payload)
          }
          break

        case 'MESSAGE_RESPONSE':
          // Only handle non-action responses (mount, unmount, etc)
          if (lastMessage.originalType !== 'CALL_ACTION') {
            log('Received response for', lastMessage.originalType)
          }
          break

        case 'BROADCAST':
          // Handle broadcast messages (multi-user updates)
          log('Received broadcast', lastMessage.payload)
          break

        case 'ERROR':
          log('Received error', lastMessage.error)
          setError(lastMessage.error || 'Unknown error')
          break
      }
    }
  }, [lastMessage, componentId, log])

  // Mount component
  const mount = useCallback(async () => {
    if (!connected || mountedRef.current) {
      return
    }

    setLoading(true)
    setError(null)
    log('Mounting component', { componentName, initialProps, room, userId })

    try {
      const message: WebSocketMessage = {
        type: 'COMPONENT_MOUNT',
        componentId: 'mounting', // Temporary ID
        payload: {
          component: componentName,
          props: initialProps,
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
    } finally {
      setLoading(false)
    }
  }, [connected, componentName, initialProps, room, userId, sendMessage, log])

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

  // Call action on component
  const call = useCallback(async (action: string, payload?: any): Promise<void> => {
    if (!componentId || !connected) {
      throw new Error('Component not mounted or WebSocket not connected')
    }

    log('Calling action', { action, payload })

    try {
      // Send action - no response expected, STATE_UPDATE will come if state changes
      const message: WebSocketMessage = {
        type: 'CALL_ACTION',
        componentId,
        action,
        payload
      }

      // Fire and forget - don't wait for response
      sendMessage(message).catch(err => {
        log('Send failed', err)
        throw err
      })
      
      log('Action sent', { action, payload })
      // State updates will come via STATE_UPDATE messages
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed'
      setError(errorMessage)
      log('Action failed', { action, error: err })
      throw err
    } finally {
      setLoading(false)
    }
  }, [componentId, connected, sendMessage, log])

  // Set property on component
  const set = useCallback((property: string, value: any) => {
    if (!componentId || !connected) {
      log('Cannot set property - component not mounted', { property, value })
      return
    }

    // Optimistic update
    setState(prev => ({ ...prev, [property]: value }))
    log('Setting property (optimistic)', { property, value })

    // Send to server
    sendMessage({
      type: 'PROPERTY_UPDATE',
      componentId,
      property,
      payload: { value }
    }).catch(err => {
      // Revert optimistic update on error
      setState(prev => ({ ...prev, [property]: (prev as any)[property] }))
      log('Property update failed, reverted', { property, error: err })
    })
  }, [componentId, connected, sendMessage, log])

  // Auto-mount when connected (only once on initial connection)
  useEffect(() => {
    if (connected && autoMount && !mountedRef.current) {
      mount()
    }
  }, [connected, autoMount, mount])

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

  return {
    state,
    loading,
    error,
    connected,
    componentId,
    call,
    set,
    mount,
    unmount
  }
}