import { useLiveStore } from '@/stores/live/liveStore'
import { useEffect, ReactNode } from 'react'

interface LiveProviderProps {
    children: ReactNode
    wsUrl?: string
    debug?: boolean
}

export function LiveProvider({ 
    children, 
    wsUrl = 'ws://localhost:3000/live',
    debug = false
}: LiveProviderProps) {
    // Zustand actions
    const setWebSocket = useLiveStore(s => s.setWebSocket)
    const updateComponent = useLiveStore(s => s.updateComponent)
    const setComponentLoading = useLiveStore(s => s.setComponentLoading)
    const setComponentError = useLiveStore(s => s.setComponentError)
    const setComponentConnected = useLiveStore(s => s.setComponentConnected)
    const addGlobalEvent = useLiveStore(s => s.addGlobalEvent)

    useEffect(() => {
        console.log(`🚀 FluxStack Live connecting to ${wsUrl}`)
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log('🔌 FluxStack Live connected successfully!')
            setWebSocket(ws)
        }

        ws.onclose = (event) => {
            console.log(`❌ FluxStack Live disconnected (code: ${event.code}, reason: ${event.reason})`)
            setWebSocket(null)
            
            // Update all connections as disconnected
            const connections = useLiveStore.getState().connections
            Object.keys(connections).forEach(id => {
                setComponentConnected(id, false)
            })
        }

        ws.onerror = (error) => {
            console.error('❌ FluxStack Live WebSocket error:', error)
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                
                if (debug) {
                    console.log('📨 Received message:', data)
                }
                
                if (data.updates && Array.isArray(data.updates)) {
                    for (const update of data.updates) {
                        switch (update.type) {
                            case 'state_update':
                                console.log(`📊 State update for ${update.id}:`, update.state)
                                updateComponent(update.id, update.state)
                                setComponentLoading(update.id, false)
                                setComponentError(update.id, null)
                                break
                                
                            case 'event':
                                console.log(`🔔 Event ${update.event} for component ${update.componentId}:`, update.data)
                                
                                // Store in global events
                                addGlobalEvent(update.event, update.data, update.componentId)
                                
                                // Dispatch custom event
                                window.dispatchEvent(new CustomEvent(`live:${update.event}`, {
                                    detail: { 
                                        componentId: update.componentId, 
                                        data: update.data 
                                    }
                                }))
                                break
                                
                            case 'broadcast':
                                console.log(`📢 Broadcast ${update.event} from ${update.componentName}:`, update.data)
                                
                                // Store in global events
                                addGlobalEvent(`broadcast.${update.event}`, update.data)
                                
                                // Dispatch global broadcast event
                                window.dispatchEvent(new CustomEvent(`live:broadcast:${update.event}`, {
                                    detail: { 
                                        componentName: update.componentName,
                                        data: update.data 
                                    }
                                }))
                                break
                                
                            case 'error':
                                console.error(`❌ Server error:`, update.error)
                                if (update.componentId) {
                                    setComponentLoading(update.componentId, false)
                                    setComponentError(update.componentId, update.error)
                                }
                                break
                                
                            default:
                                console.warn(`⚠️  Unknown update type: ${update.type}`, update)
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Error processing WebSocket message:', error, event.data)
            }
        }

        // Cleanup
        return () => {
            console.log('🔌 Closing FluxStack Live connection')
            if (ws.readyState === WebSocket.OPEN) {
                ws.close()
            }
        }
    }, [wsUrl, debug])

    return <>{children}</>
}

// Debug component (opcional)
export function LiveDebugPanel() {
    const components = useLiveStore(s => s.components)
    const connections = useLiveStore(s => s.connections)
    const globalEvents = useLiveStore(s => s.globalEvents)
    const ws = useLiveStore(s => s.ws)
    
    return (
        <div style={{ 
            position: 'fixed', 
            top: 10, 
            right: 10, 
            background: '#000', 
            color: '#0f0', 
            padding: 10, 
            borderRadius: 5,
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 9999,
            maxWidth: '300px',
            maxHeight: '400px',
            overflow: 'auto'
        }}>
            <div><strong>🔌 FluxStack Live Debug</strong></div>
            <div>WebSocket: {ws ? 'Connected' : 'Disconnected'}</div>
            <div>Components: {Object.keys(components).length}</div>
            <div>Events: {globalEvents.length}</div>
            
            <details>
                <summary>Components ({Object.keys(components).length})</summary>
                {Object.entries(components).map(([id, state]) => (
                    <div key={id} style={{ marginLeft: 10, fontSize: '10px' }}>
                        <strong>{id}</strong>: {JSON.stringify(state, null, 1).slice(0, 100)}...
                    </div>
                ))}
            </details>
            
            <details>
                <summary>Recent Events ({globalEvents.slice(-5).length})</summary>
                {globalEvents.slice(-5).map(event => (
                    <div key={event.id} style={{ marginLeft: 10, fontSize: '10px' }}>
                        <strong>{event.type}</strong>: {JSON.stringify(event.data).slice(0, 50)}...
                    </div>
                ))}
            </details>
        </div>
    )
}