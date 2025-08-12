import { useLiveStore } from '@/stores/live/liveStore'
import { useCallback, useEffect, useRef } from 'react'

interface UseLiveOptions {
    name: string
    props?: Record<string, any>
    componentId?: string
    // Livewire-style event handlers
    eventHandlers?: Record<string, (data?: any) => void>
}

// Helper para estado inicial no cliente
function getInitialClientState(componentName: string, props: any): Record<string, any> {
    const baseName = componentName.toLowerCase().replace('action', '')
    
    switch (baseName) {
        case 'counter':
            return {
                count: props.initialCount || 0,
                step: props.step || 1,
                label: props.label || "Counter",
                maxCount: props.maxCount || 100
            }
        case 'userprofile':
            return {
                name: props.name || "",
                email: props.email || "",
                isLoading: false
            }
        case 'clock':
            return {
                currentTime: "",
                timezone: props.timezone || "America/Sao_Paulo",
                format: props.format || "24h",
                isRunning: false
            }
        default:
            return {}
    }
}

export function useLive({ name, props = {}, componentId, eventHandlers = {} }: UseLiveOptions) {
    // ID único automático se não fornecido
    const autoId = useRef(
        componentId || `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    )
    const id = componentId || autoId.current

    // Zustand selectors (re-render otimizado)
    const state = useLiveStore(s => s.components[id])
    const connection = useLiveStore(s => s.connections[id])
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
        console.log(`🔌 Setting up live component: ${id}`)
        addConnection(id)
        
        // Initialize com props se ainda não existir estado
        if (!state) {
            const initialState = {
                $props: props,
                $ID: id,
                ...getInitialClientState(name, props)
            }
            updateComponent(id, initialState)
            console.log(`🏗️  Initialized ${id} with:`, initialState)
        }
        
        return () => {
            console.log(`🗑️  Cleaning up live component: ${id}`)
            removeConnection(id)
        }
    }, [id, name])

    // Update connection status when WebSocket changes
    useEffect(() => {
        setComponentConnected(id, !!ws && ws.readyState === WebSocket.OPEN)
    }, [ws, id])

    // Auto-register event handlers (Livewire-style)
    useEffect(() => {
        const eventListeners: Array<() => void> = []
        
        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            const fullEventName = `live:${eventName.replace(/^on/, '').toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2')}`
            
            const eventListener = (e: CustomEvent) => {
                if (e.detail.componentId === id) {
                    console.log(`🎯 Auto-calling handler for ${eventName}:`, e.detail.data)
                    handler(e.detail.data)
                }
            }

            window.addEventListener(fullEventName, eventListener as EventListener)
            eventListeners.push(() => {
                window.removeEventListener(fullEventName, eventListener as EventListener)
            })
            
            console.log(`🎯 Auto-registered ${eventName} -> ${fullEventName} for ${id}`)
        })

        return () => {
            eventListeners.forEach(cleanup => cleanup())
        }
    }, [eventHandlers, id])

    // Call backend method
    const callMethod = useCallback(async (methodName: string, ...params: any[]) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            const error = 'WebSocket not connected'
            console.error(`❌ ${error}`)
            setComponentError(id, error)
            return
        }

        console.log(`🎯 Calling ${name}.${methodName}(${JSON.stringify(params)})`)
        
        setComponentLoading(id, true)
        setComponentError(id, null)

        const message = JSON.stringify({
            updates: [{
                type: 'callMethod',
                payload: {
                    name,
                    id,
                    methodName,
                    params,
                    state: state || { $props: props, $ID: id }
                }
            }]
        })

        try {
            ws.send(message)
        } catch (error) {
            console.error(`❌ Error sending message:`, error)
            setComponentError(id, error instanceof Error ? error.message : 'Send failed')
            setComponentLoading(id, false)
        }
    }, [ws, name, id, state, props])

    // Optimistic updates (immediate UI feedback)
    const optimisticUpdate = useCallback((updates: Partial<any>) => {
        if (state) {
            updateComponent(id, { ...state, ...updates })
            console.log(`⚡ Optimistic update for ${id}:`, updates)
        }
    }, [id, state, updateComponent])


    const currentState = state || { $props: props, $ID: id }

    return {
        state: currentState,
        loading: connection?.loading || false,
        error: connection?.error || null,
        connected: connection?.connected || false,
        callMethod,
        optimisticUpdate,
        componentId: id,
        
        // Debug info (useful for development)
        __debug: {
            componentName: name,
            hasState: !!state,
            wsReady: !!ws && ws.readyState === WebSocket.OPEN,
            registeredEvents: Object.keys(eventHandlers)
        }
    }
}