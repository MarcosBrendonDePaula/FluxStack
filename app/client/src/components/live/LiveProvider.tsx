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

// Modern Debug Panel - Beautiful and Professional
export function LiveDebugPanel() {
    const components = useLiveStore(s => s.components)
    const connections = useLiveStore(s => s.connections)
    const globalEvents = useLiveStore(s => s.globalEvents)
    const ws = useLiveStore(s => s.ws)
    
    // State management
    const [position, setPosition] = React.useState({ x: 20, y: 20 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
    const [isMinimized, setIsMinimized] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState<'overview' | 'components' | 'events' | 'ws'>('overview')
    
    // Dragging logic
    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.closest('.debug-content') || target.closest('.debug-tabs') || target.closest('.debug-actions')) {
            return // Don't drag when interacting with content
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
        
        const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragStart.x))
        const newY = Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragStart.y))
        
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
    
    // Stats
    const connectedComponents = Object.values(connections).filter(c => c.connected).length
    const recentEvents = globalEvents.slice(-10).reverse()
    
    return (
        <div 
            style={{ 
                position: 'fixed', 
                left: position.x,
                top: position.y,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                border: '1px solid #334155',
                borderRadius: '12px',
                fontSize: '13px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                zIndex: 9999,
                width: isMinimized ? '280px' : '400px',
                maxHeight: isMinimized ? 'auto' : '500px',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                overflow: 'hidden'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <div style={{ 
                padding: '12px 16px',
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'grab',
                borderRadius: '12px 12px 0 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <span style={{ fontSize: '16px' }}>🔌</span>
                    <span>FluxStack Live Debug</span>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: ws ? '#10b981' : '#ef4444',
                        boxShadow: ws ? '0 0 8px #10b981' : '0 0 8px #ef4444'
                    }} />
                </div>
                
                <div className="debug-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsMinimized(!isMinimized)
                        }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            transition: 'all 0.2s',
                            fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                        }}
                        title={isMinimized ? 'Expand Panel' : 'Minimize Panel'}
                    >
                        {isMinimized ? '⬆️' : '⬇️'}
                    </button>
                </div>
            </div>
            
            {!isMinimized && (
                <>
                    {/* Stats Cards */}
                    <div style={{ 
                        padding: '16px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px'
                    }}>
                        <div style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            borderRadius: '8px',
                            padding: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#22c55e', fontSize: '16px', fontWeight: '700' }}>
                                {ws ? '✅' : '❌'}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '10px' }}>WebSocket</div>
                        </div>
                        
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '8px',
                            padding: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#3b82f6', fontSize: '16px', fontWeight: '700' }}>
                                {Object.keys(components).length}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '10px' }}>Components</div>
                        </div>
                        
                        <div style={{
                            background: 'rgba(168, 85, 247, 0.1)',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            borderRadius: '8px',
                            padding: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#a855f7', fontSize: '16px', fontWeight: '700' }}>
                                {connectedComponents}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '10px' }}>Connected</div>
                        </div>
                        
                        <div style={{
                            background: 'rgba(245, 101, 101, 0.1)',
                            border: '1px solid rgba(245, 101, 101, 0.2)',
                            borderRadius: '8px',
                            padding: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#f56565', fontSize: '16px', fontWeight: '700' }}>
                                {globalEvents.length}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '10px' }}>Events</div>
                        </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="debug-tabs" style={{ 
                        display: 'flex',
                        borderBottom: '1px solid #334155',
                        background: 'rgba(15, 23, 42, 0.5)'
                    }}>
                        {[
                            { id: 'overview', label: '📊 Overview', icon: '📊' },
                            { id: 'components', label: '🧩 Components', icon: '🧩' },
                            { id: 'events', label: '⚡ Events', icon: '⚡' },
                            { id: 'ws', label: '🔌 WebSocket', icon: '🔌' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    border: 'none',
                                    color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
                                    padding: '8px 12px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                                    transition: 'all 0.2s',
                                    flex: 1
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.color = '#e2e8f0'
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.color = '#94a3b8'
                                        e.currentTarget.style.background = 'transparent'
                                    }
                                }}
                            >
                                {tab.icon}
                            </button>
                        ))}
                    </div>
                    
                    {/* Content */}
                    <div className="debug-content" style={{ 
                        padding: '16px',
                        maxHeight: '300px',
                        overflow: 'auto',
                        color: '#e2e8f0'
                    }}>
                        {activeTab === 'overview' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: '1px solid #334155'
                                }}>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#f1f5f9', fontSize: '12px' }}>System Status</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                        <span>Position:</span>
                                        <span style={{ color: '#94a3b8' }}>{Math.round(position.x)}, {Math.round(position.y)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                        <span>Memory:</span>
                                        <span style={{ color: '#94a3b8' }}>{(performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(1) || 'N/A'} MB</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                        <span>Uptime:</span>
                                        <span style={{ color: '#94a3b8' }}>{Math.floor(performance.now() / 1000)}s</span>
                                    </div>
                                </div>
                                
                                <div style={{
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    border: '1px solid #334155'
                                }}>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#f1f5f9', fontSize: '12px' }}>Quick Actions</h4>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button style={{
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                            color: '#22c55e',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            cursor: 'pointer'
                                        }} onClick={() => console.clear()}>
                                            🗑️ Clear Console
                                        </button>
                                        <button style={{
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            color: '#3b82f6',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            cursor: 'pointer'
                                        }} onClick={() => location.reload()}>
                                            🔄 Reload
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'components' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {Object.entries(components).length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                                        No components registered
                                    </div>
                                ) : (
                                    Object.entries(components).map(([id, state]) => (
                                        <div key={id} style={{
                                            background: 'rgba(15, 23, 42, 0.5)',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            border: '1px solid #334155'
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '6px'
                                            }}>
                                                <span style={{ color: '#fbbf24', fontWeight: '600', fontSize: '11px' }}>
                                                    {id}
                                                </span>
                                                <span style={{
                                                    background: connections[id]?.connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: connections[id]?.connected ? '#22c55e' : '#ef4444',
                                                    padding: '2px 6px',
                                                    borderRadius: '10px',
                                                    fontSize: '9px',
                                                    fontWeight: '500'
                                                }}>
                                                    {connections[id]?.connected ? 'Connected' : 'Disconnected'}
                                                </span>
                                            </div>
                                            <div style={{ 
                                                color: '#94a3b8', 
                                                fontSize: '10px',
                                                fontFamily: 'ui-monospace, "Fira Code", monospace',
                                                background: 'rgba(0, 0, 0, 0.3)',
                                                padding: '6px',
                                                borderRadius: '4px',
                                                maxHeight: '60px',
                                                overflow: 'hidden',
                                                wordBreak: 'break-all'
                                            }}>
                                                {JSON.stringify(state, null, 1).slice(0, 120)}...
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'events' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {recentEvents.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                                        No recent events
                                    </div>
                                ) : (
                                    recentEvents.map(event => (
                                        <div key={event.id} style={{
                                            background: 'rgba(15, 23, 42, 0.5)',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            border: '1px solid #334155'
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '6px'
                                            }}>
                                                <span style={{ color: '#c084fc', fontWeight: '600', fontSize: '11px' }}>
                                                    {event.type}
                                                </span>
                                                <span style={{ color: '#64748b', fontSize: '9px' }}>
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div style={{ 
                                                color: '#94a3b8', 
                                                fontSize: '10px',
                                                fontFamily: 'ui-monospace, "Fira Code", monospace',
                                                background: 'rgba(0, 0, 0, 0.3)',
                                                padding: '6px',
                                                borderRadius: '4px',
                                                maxHeight: '40px',
                                                overflow: 'hidden',
                                                wordBreak: 'break-all'
                                            }}>
                                                {JSON.stringify(event.data).slice(0, 100)}...
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'ws' && (
                            <div style={{
                                background: 'rgba(15, 23, 42, 0.5)',
                                borderRadius: '8px',
                                padding: '12px',
                                border: '1px solid #334155'
                            }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#f1f5f9', fontSize: '12px' }}>WebSocket Info</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Status:</span>
                                        <span style={{ 
                                            color: ws ? '#22c55e' : '#ef4444',
                                            fontWeight: '600'
                                        }}>
                                            {ws ? '🟢 Connected' : '🔴 Disconnected'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>URL:</span>
                                        <span style={{ color: '#94a3b8', fontSize: '10px' }}>ws://localhost:3000/live</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Ready State:</span>
                                        <span style={{ color: '#94a3b8' }}>
                                            {ws ? ws.readyState : 'N/A'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Protocol:</span>
                                        <span style={{ color: '#94a3b8' }}>
                                            {ws?.protocol || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}