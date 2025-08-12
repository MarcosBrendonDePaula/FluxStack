import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

interface LiveStore {
    // Estado de cada componente live
    components: Record<string, any>
    
    // Status de conexões WebSocket
    connections: Record<string, {
        connected: boolean
        loading: boolean
        error: string | null
    }>
    
    // WebSocket global
    ws: WebSocket | null
    
    // Eventos globais
    globalEvents: Array<{
        id: string
        type: string
        data: any
        timestamp: number
        componentId?: string
    }>
    
    // Actions
    updateComponent: (id: string, state: any) => void
    setComponentLoading: (id: string, loading: boolean) => void
    setComponentError: (id: string, error: string | null) => void
    setComponentConnected: (id: string, connected: boolean) => void
    addConnection: (id: string) => void
    removeConnection: (id: string) => void
    setWebSocket: (ws: WebSocket | null) => void
    addGlobalEvent: (type: string, data: any, componentId?: string) => void
    clearGlobalEvents: () => void
    
    // Stats
    getConnectionCount: () => number
    getComponentIds: () => string[]
}

export const useLiveStore = create<LiveStore>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            components: {},
            connections: {},
            ws: null,
            globalEvents: [],

            // Update component state (triggers re-render)
            updateComponent: (id, state) => 
                set(s => ({ 
                    components: { ...s.components, [id]: state } 
                }), false, 'updateComponent'),

            setComponentLoading: (id, loading) =>
                set(s => ({
                    connections: {
                        ...s.connections,
                        [id]: { ...s.connections[id], loading }
                    }
                }), false, 'setComponentLoading'),

            setComponentError: (id, error) =>
                set(s => ({
                    connections: {
                        ...s.connections,
                        [id]: { ...s.connections[id], error }
                    }
                }), false, 'setComponentError'),

            setComponentConnected: (id, connected) =>
                set(s => ({
                    connections: {
                        ...s.connections,
                        [id]: { ...s.connections[id], connected }
                    }
                }), false, 'setComponentConnected'),

            addConnection: (id) =>
                set(s => ({
                    connections: {
                        ...s.connections,
                        [id]: { connected: false, loading: false, error: null }
                    }
                }), false, 'addConnection'),

            removeConnection: (id) => {
                const { components, connections } = get()
                const newComponents = { ...components }
                const newConnections = { ...connections }
                
                delete newComponents[id]
                delete newConnections[id]
                
                set({ 
                    components: newComponents, 
                    connections: newConnections 
                }, false, 'removeConnection')
            },

            setWebSocket: (ws) => set({ ws }, false, 'setWebSocket'),

            addGlobalEvent: (type, data, componentId) => {
                const event = {
                    id: Math.random().toString(36),
                    type,
                    data,
                    componentId,
                    timestamp: Date.now()
                }
                
                set(s => ({
                    globalEvents: [...s.globalEvents, event].slice(-100) // Keep last 100
                }), false, 'addGlobalEvent')
            },

            clearGlobalEvents: () => set({ globalEvents: [] }, false, 'clearGlobalEvents'),

            // Utility functions
            getConnectionCount: () => Object.keys(get().connections).length,
            getComponentIds: () => Object.keys(get().components)
        })),
        { 
            name: 'flux-live-store',
            serialize: true
        }
    )
)