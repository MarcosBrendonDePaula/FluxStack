import { useLiveStore } from '@/stores/live/liveStore'
import { useEffect, ReactNode } from 'react'
import * as React from 'react'

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
                                
                                // 💾 Save hydration state if fingerprint provided
                                if (update.state.__fingerprint) {
                                    try {
                                        const stateToSave = { ...update.state }
                                        delete stateToSave.__fingerprint // Don't save the fingerprint in the state
                                        
                                        localStorage.setItem(`fluxstack_hydration_${update.id}`, JSON.stringify(stateToSave))
                                        localStorage.setItem(`fluxstack_fingerprint_${update.id}`, update.state.__fingerprint)
                                        
                                        if (debug) {
                                            console.log(`💾 Saved hydration state for ${update.id} (fingerprint: ${update.state.__fingerprint.substring(0, 8)}...)`)
                                        }
                                    } catch (error) {
                                        console.warn('Failed to save hydration state:', error)
                                    }
                                }
                                break
                                
                            case 'function_result':
                                console.log(`🔄 Function result for ${update.methodName} (async: ${update.isAsync}):`, update.result)
                                updateComponent(update.id, update.state)
                                setComponentLoading(update.id, false)
                                setComponentError(update.id, null)
                                
                                // Dispatch function result event
                                window.dispatchEvent(new CustomEvent(`live:function-result`, {
                                    detail: { 
                                        componentId: update.id,
                                        methodName: update.methodName,
                                        result: update.result,
                                        isAsync: update.isAsync
                                    }
                                }))
                                break
                                
                            case 'function_error':
                                console.error(`❌ Function error for ${update.methodName}:`, update.error)
                                setComponentLoading(update.id, false)
                                setComponentError(update.id, `${update.methodName}: ${update.error}`)
                                
                                // Dispatch function error event
                                window.dispatchEvent(new CustomEvent(`live:function-error`, {
                                    detail: { 
                                        componentId: update.id,
                                        methodName: update.methodName,
                                        error: update.error,
                                        isAsync: update.isAsync
                                    }
                                }))
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

// Debug component (opcional) - Draggable version
export function LiveDebugPanel() {
    const components = useLiveStore(s => s.components)
    const connections = useLiveStore(s => s.connections)
    const globalEvents = useLiveStore(s => s.globalEvents)
    const ws = useLiveStore(s => s.ws)
    
    // Dragging state
    const [position, setPosition] = React.useState({ x: 10, y: 10 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
    const [isMinimized, setIsMinimized] = React.useState(false)
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'DETAILS' || 
            (e.target as HTMLElement).tagName === 'SUMMARY') {
            return // Don't drag when interacting with details/summary
        }
        
        setIsDragging(true)
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        })
        e.preventDefault()
    }
    
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return
        
        const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragStart.x))
        const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragStart.y))
        
        setPosition({ x: newX, y: newY })
    }
    
    const handleMouseUp = () => {
        setIsDragging(false)
    }
    
    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.userSelect = 'none'
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
                document.body.style.userSelect = ''
            }
        }
    }, [isDragging, dragStart])
    
    return (
        <div 
            style={{ 
                position: 'fixed', 
                left: position.x,
                top: position.y,
                background: '#000', 
                color: '#0f0', 
                padding: 10, 
                borderRadius: 5,
                fontSize: '12px',
                fontFamily: 'monospace',
                zIndex: 9999,
                maxWidth: '320px',
                maxHeight: isMinimized ? 'auto' : '400px',
                overflow: 'auto',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                border: '2px solid #0f0',
                boxShadow: '0 4px 12px rgba(0,255,0,0.3)'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header with minimize button */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: isMinimized ? 0 : 8,
                cursor: 'grab'
            }}>
                <div><strong>🔌 FluxStack Live Debug</strong></div>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsMinimized(!isMinimized)
                    }}
                    style={{
                        background: 'transparent',
                        border: '1px solid #0f0',
                        color: '#0f0',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        fontSize: '10px',
                        borderRadius: '3px'
                    }}
                    title={isMinimized ? 'Expand' : 'Minimize'}
                >
                    {isMinimized ? '□' : '_'}
                </button>
            </div>
            
            {!isMinimized && (
                <>
                    <div>WebSocket: {ws ? 'Connected' : 'Disconnected'}</div>
                    <div>Components: {Object.keys(components).length}</div>
                    <div>Events: {globalEvents.length}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: 8 }}>
                        Position: {Math.round(position.x)}, {Math.round(position.y)}
                    </div>
                    
                    <details style={{ marginBottom: 8 }}>
                        <summary style={{ cursor: 'pointer', padding: '2px 0' }}>
                            Components ({Object.keys(components).length})
                        </summary>
                        <div style={{ maxHeight: '120px', overflow: 'auto' }}>
                            {Object.entries(components).map(([id, state]) => (
                                <div key={id} style={{ marginLeft: 10, fontSize: '10px', marginBottom: 4 }}>
                                    <strong style={{ color: '#ff0' }}>{id}</strong>
                                    <div style={{ color: '#0ff', marginLeft: 8 }}>
                                        {JSON.stringify(state, null, 1).slice(0, 80)}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    </details>
                    
                    <details>
                        <summary style={{ cursor: 'pointer', padding: '2px 0' }}>
                            Recent Events ({globalEvents.slice(-5).length})
                        </summary>
                        <div style={{ maxHeight: '120px', overflow: 'auto' }}>
                            {globalEvents.slice(-5).reverse().map(event => (
                                <div key={event.id} style={{ marginLeft: 10, fontSize: '10px', marginBottom: 4 }}>
                                    <strong style={{ color: '#f0f' }}>{event.type}</strong>
                                    <div style={{ color: '#0ff', marginLeft: 8 }}>
                                        {JSON.stringify(event.data).slice(0, 60)}...
                                    </div>
                                    <div style={{ color: '#888', marginLeft: 8, fontSize: '9px' }}>
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </details>
                </>
            )}
        </div>
    )
}