import { useLiveStore } from '@/stores/live/liveStore'
import { useCallback, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

// Local storage keys for hydration
const HYDRATION_PREFIX = 'fluxstack_hydration_'
const FINGERPRINT_PREFIX = 'fluxstack_fingerprint_'

// Hydration utilities
const saveHydrationState = (componentId: string, state: any, fingerprint: string) => {
    try {
        localStorage.setItem(HYDRATION_PREFIX + componentId, JSON.stringify(state))
        localStorage.setItem(FINGERPRINT_PREFIX + componentId, fingerprint)
    } catch (error) {
        console.warn('Failed to save hydration state:', error)
    }
}

const loadHydrationState = (componentId: string): { state?: any; fingerprint?: string } => {
    try {
        const stateStr = localStorage.getItem(HYDRATION_PREFIX + componentId)
        const fingerprint = localStorage.getItem(FINGERPRINT_PREFIX + componentId)
        
        if (stateStr && fingerprint) {
            return {
                state: JSON.parse(stateStr),
                fingerprint
            }
        }
    } catch (error) {
        console.warn('Failed to load hydration state:', error)
    }
    return {}
}

const clearHydrationState = (componentId: string) => {
    try {
        localStorage.removeItem(HYDRATION_PREFIX + componentId)
        localStorage.removeItem(FINGERPRINT_PREFIX + componentId)
    } catch (error) {
        console.warn('Failed to clear hydration state:', error)
    }
}

interface UseLiveOptions {
    name: string
    props?: Record<string, any>
    componentId?: string
    // Livewire-style event handlers
    eventHandlers?: Record<string, (data?: any) => void>
}

// Simple UUID generation using uuid library
function generateRequestUUID(): string {
    return uuidv4()
}

// Dynamic helper para estado inicial do cliente via WebSocket com ID gerado pelo backend
async function getInitialClientStateWithId(
    componentName: string, 
    props: any, 
    ws: WebSocket | null,
    userProvidedId?: string,
    tempUUID?: string
): Promise<{ state: Record<string, any>; $ID: string }> {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn(`⚠️  WebSocket not available for getting initial state of ${componentName}, using fallback`)
        const fallbackState = getFallbackInitialState(componentName, props)
        const fallbackId = userProvidedId || `${componentName}-fallback-${Math.random().toString(36).substring(2, 15)}`
        return { 
            state: fallbackState, 
            $ID: fallbackId 
        }
    }

    return new Promise((resolve) => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data)
                if (data.updates && Array.isArray(data.updates)) {
                    for (const update of data.updates) {
                        if (update.type === 'initial_state' && update.componentName === componentName && update.tempUUID === tempUUID) {
                            ws.removeEventListener('message', handleMessage)
                            console.log(`📨 [FRONTEND] Matched initial state response: ${update.$ID} for temp: ${tempUUID}`)
                            resolve({ 
                                state: update.state, 
                                $ID: update.$ID 
                            })
                            return
                        }
                    }
                }
            } catch (error) {
                console.error('Error parsing initial state message:', error)
                ws.removeEventListener('message', handleMessage)
                const fallbackState = getFallbackInitialState(componentName, props)
                const fallbackId = userProvidedId || `${componentName}-error-${Math.random().toString(36).substring(2, 15)}`
                resolve({ 
                    state: fallbackState, 
                    $ID: fallbackId 
                })
            }
        }

        ws.addEventListener('message', handleMessage)

        // Send request for initial state with user provided ID if available
        ws.send(JSON.stringify({
            updates: [{
                type: 'getInitialState',
                componentName,
                props,
                userProvidedId,
                tempUUID // Include temp UUID for mapping
            }]
        }))

        // Timeout fallback with proper cleanup
        const timeoutId = setTimeout(() => {
            ws.removeEventListener('message', handleMessage)
            console.warn(`⚠️  Timeout getting initial state for ${componentName}, using fallback`)
            const fallbackState = getFallbackInitialState(componentName, props)
            const fallbackId = userProvidedId || `${componentName}-timeout-${Math.random().toString(36).substring(2, 15)}`
            resolve({ 
                state: fallbackState, 
                $ID: fallbackId 
            })
        }, 1000)

        // Modify handleMessage to cleanup timeout if message received
        const originalHandleMessage = handleMessage
        const modifiedHandleMessage = (event: MessageEvent) => {
            clearTimeout(timeoutId)
            originalHandleMessage(event)
        }
        
        // Replace the event listener
        ws.removeEventListener('message', handleMessage)
        ws.addEventListener('message', modifiedHandleMessage)
    })
}

// Fallback para quando não conseguir obter estado via WebSocket
function getFallbackInitialState(componentName: string, props: any): Record<string, any> {
    const baseName = componentName.toLowerCase().replace('action', '')
    
    // Fallbacks básicos para componentes conhecidos
    switch (baseName) {
        case 'counter':
            return { count: props.initialCount || 0, step: props.step || 1, label: props.label || "Counter", maxCount: props.maxCount || 100 }
        case 'clock':
            return { currentTime: "", timezone: props.timezone || "America/Sao_Paulo", format: props.format || "24h", isRunning: false }
        case 'calculator':
            return { displayValue: "0", result: 0, operation: "", waitingForOperand: false }
        default:
            console.warn(`⚠️  No fallback state for ${componentName}, using empty object`)
            return {}
    }
}

export function useLive({ name, props = {}, componentId, eventHandlers = {} }: UseLiveOptions) {
    // O ID será obtido do backend ou usado o fornecido pelo usuário
    const finalIdRef = useRef<string | null>(null)
    const isInitializedRef = useRef(false)
    const propsRef = useRef(props)
    const eventHandlersRef = useRef(eventHandlers)
    const handlersRegisteredRef = useRef(false)
    
    // Update props ref when props change
    propsRef.current = props
    
    // Update event handlers ref when they change
    eventHandlersRef.current = eventHandlers
    
    // Rate limiting state
    const lastCallTimestampRef = useRef<number>(0)
    const callCountRef = useRef<number>(0)
    const rateLimitWindowRef = useRef<number>(Date.now())

    // Zustand selectors (re-render otimizado) - usar ID final se disponível
    const currentId = finalIdRef.current || 'initializing'
    const state = useLiveStore(s => finalIdRef.current ? s.components[finalIdRef.current] : undefined)
    const connection = useLiveStore(s => finalIdRef.current ? s.connections[finalIdRef.current] : undefined)
    const ws = useLiveStore(s => s.ws)
    
    // Zustand actions
    const updateComponent = useLiveStore(s => s.updateComponent)
    const setComponentLoading = useLiveStore(s => s.setComponentLoading)
    const setComponentError = useLiveStore(s => s.setComponentError)
    const setComponentConnected = useLiveStore(s => s.setComponentConnected)
    const addConnection = useLiveStore(s => s.addConnection)
    const removeConnection = useLiveStore(s => s.removeConnection)

    // Setup inicial do componente
    useEffect(() => {
        if (isInitializedRef.current) return
        isInitializedRef.current = true

        const initializeState = async () => {
            try {
                // Generate temporary UUID for this component instance
                const tempUUID = uuidv4()
                console.log(`🔌 [FRONTEND] Setting up live component: ${name} (user ID: ${componentId || 'auto'}) | Temp UUID: ${tempUUID}`)
                
                // Set temporary ID first
                finalIdRef.current = tempUUID
                addConnection(tempUUID)
                
                // Obter estado inicial e ID seguro do backend
                const { state: dynamicInitialState, $ID } = await getInitialClientStateWithId(
                    name, 
                    props, 
                    ws, 
                    componentId,
                    tempUUID // Pass temp UUID for mapping
                )
                
                // Replace temporary ID with final backend-generated ID
                console.log(`🆔 [FRONTEND] Backend generated ID: ${$ID} | For user ID: ${componentId || 'auto'} | Component: ${name} | Replacing temp: ${tempUUID}`)
                
                // Remove temporary connection and add final one
                removeConnection(tempUUID)
                addConnection($ID)
                
                // Update final ID reference
                finalIdRef.current = $ID
                
                const initialState = {
                    $props: props,
                    $ID: $ID,
                    ...dynamicInitialState
                }
                
                updateComponent($ID, initialState)
                console.log(`🏗️  Initialized ${$ID} with backend state:`, initialState)
                
            } catch (error) {
                console.error(`❌ Error initializing component:`, error)
                
                // Fallback com ID local se tudo falhar
                const fallbackId = componentId || `${name}-error-${Math.random().toString(36).substring(2, 15)}`
                finalIdRef.current = fallbackId
                
                addConnection(fallbackId)
                
                const initialState = {
                    $props: props,
                    $ID: fallbackId,
                    ...getFallbackInitialState(name, props)
                }
                
                updateComponent(fallbackId, initialState)
                console.log(`🏗️  Initialized ${fallbackId} with fallback:`, initialState)
            }
        }
        
        initializeState()
        
        return () => {
            if (finalIdRef.current) {
                console.log(`🗑️  Cleaning up live component: ${finalIdRef.current}`)
                removeConnection(finalIdRef.current)
                // Clear hydration state on cleanup (component unmounted)
                clearHydrationState(finalIdRef.current)
            }
        }
    }, [name, ws, componentId])

    // Update connection status when WebSocket changes
    useEffect(() => {
        if (finalIdRef.current) {
            setComponentConnected(finalIdRef.current, !!ws && ws.readyState === WebSocket.OPEN)
        }
    }, [ws, finalIdRef.current])

    // Auto-register event handlers (Livewire-style) - Only once per component
    useEffect(() => {
        if (!finalIdRef.current || handlersRegisteredRef.current) return
        
        const eventListeners: Array<() => void> = []
        const hasHandlers = Object.keys(eventHandlersRef.current).length > 0
        
        // Only register if we have handlers and haven't registered yet
        if (!hasHandlers) return
        
        Object.entries(eventHandlersRef.current).forEach(([eventName, handler]) => {
            const fullEventName = `live:${eventName.replace(/^on/, '').toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2')}`
            
            const eventListener = (e: CustomEvent) => {
                if (e.detail.componentId === finalIdRef.current) {
                    console.log(`🎯 Auto-calling handler for ${eventName}:`, e.detail.data)
                    // Always use the latest handler from ref
                    const currentHandler = eventHandlersRef.current[eventName]
                    if (typeof currentHandler === 'function') {
                        currentHandler(e.detail.data)
                    } else {
                        console.warn(`⚠️ Handler for ${eventName} is not a function:`, typeof currentHandler)
                    }
                }
            }

            window.addEventListener(fullEventName, eventListener as EventListener)
            eventListeners.push(() => {
                window.removeEventListener(fullEventName, eventListener as EventListener)
            })
            
            console.log(`🎯 Auto-registered ${eventName} -> ${fullEventName} for ${finalIdRef.current}`)
        })

        // Mark as registered to prevent re-registration
        handlersRegisteredRef.current = true

        return () => {
            eventListeners.forEach(cleanup => cleanup())
            handlersRegisteredRef.current = false
        }
    }, [finalIdRef.current]) // Only depend on component ID, not handlers

    // Call backend method with return value support and rate limiting
    const callMethod = useCallback(async (methodName: string, ...params: any[]): Promise<any> => {
        const currentComponentId = finalIdRef.current
        
        if (!currentComponentId) {
            const error = 'Component not initialized yet'
            console.error(`❌ ${error}`)
            throw new Error(error)
        }
        
        // Basic rate limiting (max 20 calls per 10 seconds)
        const now = Date.now()
        const windowDuration = 10000 // 10 seconds
        const maxCallsPerWindow = 20
        
        // Reset counter if window expired
        if (now - rateLimitWindowRef.current > windowDuration) {
            rateLimitWindowRef.current = now
            callCountRef.current = 0
        }
        
        // Check rate limit
        if (callCountRef.current >= maxCallsPerWindow) {
            const error = 'Rate limit exceeded. Too many method calls.'
            console.error(`❌ ${error}`)
            setComponentError(currentComponentId, error)
            throw new Error(error)
        }
        
        // Increment call count
        callCountRef.current++
        lastCallTimestampRef.current = now
        
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            const error = 'WebSocket not connected'
            console.error(`❌ ${error}`)
            setComponentError(currentComponentId, error)
            throw new Error(error)
        }

        console.log(`🎯 [FRONTEND] Calling ${name}.${methodName}(${JSON.stringify(params)}) on ${currentComponentId} | User provided: ${componentId || 'auto'}`)
        
        setComponentLoading(currentComponentId, true)
        setComponentError(currentComponentId, null)

        // Generate unique request ID to avoid race conditions
        const requestId = generateRequestUUID()

        return new Promise((resolve, reject) => {

            // Create unique listeners for this specific function call
            const handleFunctionResult = (event: CustomEvent) => {
                if (event.detail.requestId === requestId) {
                    console.log(`✅ Function result received for ${methodName}:`, event.detail.result)
                    window.removeEventListener('live:function-result', handleFunctionResult as EventListener)
                    window.removeEventListener('live:function-error', handleFunctionError as EventListener)
                    resolve(event.detail.result)
                }
            }

            const handleFunctionError = (event: CustomEvent) => {
                if (event.detail.requestId === requestId) {
                    console.error(`❌ Function error received for ${methodName}:`, event.detail.error)
                    window.removeEventListener('live:function-result', handleFunctionResult as EventListener)
                    window.removeEventListener('live:function-error', handleFunctionError as EventListener)
                    reject(new Error(event.detail.error))
                }
            }

            // Listen for function result
            window.addEventListener('live:function-result', handleFunctionResult as EventListener)
            window.addEventListener('live:function-error', handleFunctionError as EventListener)

            // Get hydration state for resilience
            const hydrationData = loadHydrationState(currentComponentId)
            const storeState = useLiveStore.getState().components[currentComponentId]
            const currentState = storeState || { $props: propsRef.current, $ID: currentComponentId }
            
            const message = JSON.stringify({
                updates: [{
                    type: 'callMethod',
                    payload: {
                        name,
                        id: currentComponentId,
                        methodName,
                        params,
                        state: currentState,
                        fingerprint: hydrationData.fingerprint,
                        hydrationAttempt: !!hydrationData.fingerprint,
                        requestId: requestId
                    }
                }]
            })

            try {
                ws.send(message)
            } catch (error) {
                console.error(`❌ Error sending message:`, error)
                setComponentError(currentComponentId, error instanceof Error ? error.message : 'Send failed')
                setComponentLoading(currentComponentId, false)
                // Cleanup listeners
                window.removeEventListener('live:function-result', handleFunctionResult as EventListener)
                window.removeEventListener('live:function-error', handleFunctionError as EventListener)
                reject(error)
            }
        })
    }, [ws, name]) // Removed 'state' and 'props' to prevent closure issues

    // Optimistic updates (immediate UI feedback)
    const optimisticUpdate = useCallback((updates: Partial<any>) => {
        const currentComponentId = finalIdRef.current
        if (currentComponentId) {
            const currentState = useLiveStore.getState().components[currentComponentId]
            if (currentState) {
                updateComponent(currentComponentId, { ...currentState, ...updates })
                console.log(`⚡ Optimistic update for ${currentComponentId}:`, updates)
            }
        }
    }, [updateComponent])

    const currentComponentId = finalIdRef.current || 'initializing'
    const currentState = state || { $props: propsRef.current, $ID: currentComponentId }

    return {
        state: currentState,
        loading: connection?.loading || false,
        error: connection?.error || null,
        connected: connection?.connected || false,
        callMethod,
        optimisticUpdate,
        componentId: currentComponentId,
        
        // Function call state (para chamadas sync/async)
        functionResult: currentState.__functionResult || null,
        isFunctionLoading: currentState.__functionResult?.isLoading || false,
        functionError: currentState.__functionResult?.error || null,
        
        // UUID generation function for components to use
        generateUUID: useCallback(() => uuidv4(), []),
        
        // Debug info (useful for development)
        __debug: {
            componentName: name,
            hasState: !!state,
            wsReady: !!ws && ws.readyState === WebSocket.OPEN,
            registeredEvents: Object.keys(eventHandlers),
            functionCallState: currentState.__functionResult,
            backendGeneratedId: finalIdRef.current,
            userProvidedId: componentId,
            isInitialized: !!finalIdRef.current
        }
    }
}

// Export UUID generation for standalone use
export { generateRequestUUID as generateUUID }