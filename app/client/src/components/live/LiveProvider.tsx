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
                                
                                // Dispatch function result event with requestId for proper matching
                                window.dispatchEvent(new CustomEvent(`live:function-result`, {
                                    detail: { 
                                        componentId: update.id,
                                        methodName: update.methodName,
                                        result: update.result,
                                        isAsync: update.isAsync,
                                        requestId: update.requestId  // Include requestId for matching
                                    }
                                }))
                                break
                                
                            case 'function_error':
                                console.error(`❌ Function error for ${update.methodName}:`, update.error)
                                setComponentLoading(update.id, false)
                                setComponentError(update.id, `${update.methodName}: ${update.error}`)
                                
                                // Dispatch function error event with requestId for proper matching
                                window.dispatchEvent(new CustomEvent(`live:function-error`, {
                                    detail: { 
                                        componentId: update.id,
                                        methodName: update.methodName,
                                        error: update.error,
                                        isAsync: update.isAsync,
                                        requestId: update.requestId  // Include requestId for matching
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
                                
                            // Removed: UUID generation is now handled client-side with uuid library
                                
                            case 'initial_state':
                                // Initial state responses are handled by individual components
                                // No need to process here, just log for debugging
                                if (debug) {
                                    console.log(`📊 Initial state response for ${update.componentName}: ${update.$ID}`)
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

// Laravel-style DebugBar - Fixed bottom bar that expands upward
export function LiveDebugPanel() {
    const components = useLiveStore(s => s.components)
    const connections = useLiveStore(s => s.connections)
    const globalEvents = useLiveStore(s => s.globalEvents)
    const ws = useLiveStore(s => s.ws)
    
    // State management
    const [isExpanded, setIsExpanded] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(() => {
        // Load visibility preference from localStorage
        try {
            const saved = localStorage.getItem('fluxstack-debugbar-visible')
            return saved !== null ? JSON.parse(saved) : true
        } catch {
            return true
        }
    })
    const [activeTab, setActiveTab] = React.useState<'overview' | 'components' | 'events' | 'ws' | 'performance'>('overview')
    
    // Save visibility preference to localStorage
    React.useEffect(() => {
        try {
            localStorage.setItem('fluxstack-debugbar-visible', JSON.stringify(isVisible))
        } catch {
            // Ignore localStorage errors
        }
    }, [isVisible])
    
    // Keyboard shortcut: Ctrl/Cmd + Shift + D to toggle debugbar
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault()
                setIsVisible(prev => !prev)
                if (!isVisible) {
                    setIsExpanded(false) // Close panel when hiding
                }
            }
        }
        
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isVisible])
    
    // Stats
    const connectedComponents = Object.values(connections).filter(c => c.connected).length
    const recentEvents = globalEvents.slice(-10).reverse()
    const memoryUsage = (performance.memory?.usedJSHeapSize / 1024 / 1024) || 0
    
    // Performance stats
    const [performanceStats, setPerformanceStats] = React.useState({
        requests: 0,
        avgResponseTime: 0,
        errors: 0,
        uptime: 0
    })
    
    React.useEffect(() => {
        const interval = setInterval(() => {
            setPerformanceStats(prev => ({
                ...prev,
                uptime: Math.floor(performance.now() / 1000)
            }))
        }, 1000)
        
        return () => clearInterval(interval)
    }, [])
    
    // Bar items for the main bar
    const barItems = [
        {
            id: 'status',
            icon: ws ? '🟢' : '🔴',
            label: ws ? 'Connected' : 'Disconnected',
            value: ws ? 'WS' : 'DC',
            color: ws ? '#10b981' : '#ef4444'
        },
        {
            id: 'components',
            icon: '🧩',
            label: 'Components',
            value: Object.keys(components).length.toString(),
            color: '#3b82f6'
        },
        {
            id: 'active',
            icon: '⚡',
            label: 'Active',
            value: connectedComponents.toString(),
            color: '#8b5cf6'
        },
        {
            id: 'events',
            icon: '📡',
            label: 'Events',
            value: globalEvents.length.toString(),
            color: '#f59e0b'
        },
        {
            id: 'memory',
            icon: '💾',
            label: 'Memory',
            value: `${memoryUsage.toFixed(1)}MB`,
            color: memoryUsage > 50 ? '#ef4444' : '#10b981'
        },
        {
            id: 'time',
            icon: '⏱️',
            label: 'Uptime',
            value: `${Math.floor(performanceStats.uptime / 60)}:${(performanceStats.uptime % 60).toString().padStart(2, '0')}`,
            color: '#64748b'
        }
    ]
    
    return (
        <>
            {/* Show DebugBar Button (when hidden) */}
            {!isVisible && (
                <button
                    onClick={() => setIsVisible(true)}
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                        border: 'none',
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '50px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        zIndex: 9999,
                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)'
                    }}
                    title="Show FluxStack DebugBar (Ctrl+Shift+D)"
                >
                    <span style={{ fontSize: '16px' }}>🔥</span>
                    <span>Debug</span>
                </button>
            )}

            {/* Main Debug Bar - Fixed at bottom */}
            {isVisible && (
                <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40px',
                background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
                borderTop: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                zIndex: 9999,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '12px',
                color: '#e2e8f0',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
            }}>
                {/* FluxStack Logo */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginRight: '20px',
                    paddingRight: '20px',
                    borderRight: '1px solid #334155'
                }}>
                    <span style={{ fontSize: '16px' }}>🔥</span>
                    <span style={{ fontWeight: '600', color: '#6366f1' }}>FluxStack</span>
                </div>
                
                {/* Bar Items */}
                <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                    {barItems.map(item => (
                        <div 
                            key={item.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${item.color}40`,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minWidth: '70px'
                            }}
                            onClick={() => {
                                setIsExpanded(true)
                                if (item.id === 'components') setActiveTab('components')
                                else if (item.id === 'events') setActiveTab('events')
                                else if (item.id === 'status') setActiveTab('ws')
                                else if (item.id === 'memory') setActiveTab('performance')
                                else setActiveTab('overview')
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `${item.color}20`
                                e.currentTarget.style.borderColor = `${item.color}80`
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                e.currentTarget.style.borderColor = `${item.color}40`
                            }}
                        >
                            <span style={{ fontSize: '14px' }}>{item.icon}</span>
                            <span style={{ color: item.color, fontWeight: '600' }}>{item.value}</span>
                            <span style={{ color: '#94a3b8', fontSize: '10px' }}>{item.label}</span>
                        </div>
                    ))}
                </div>
                
                {/* Control Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Toggle Expand Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            background: isExpanded ? '#6366f1' : 'rgba(99, 102, 241, 0.2)',
                            border: '1px solid #6366f1',
                            color: isExpanded ? 'white' : '#6366f1',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                            if (!isExpanded) {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isExpanded) {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'
                            }
                        }}
                        title={isExpanded ? 'Collapse Debug Panel' : 'Expand Debug Panel'}
                    >
                        <span>{isExpanded ? '⬇️' : '⬆️'}</span>
                        <span>{isExpanded ? 'Hide' : 'Debug'}</span>
                    </button>
                    
                    {/* Hide DebugBar Button */}
                    <button
                        onClick={() => {
                            setIsVisible(false)
                            setIsExpanded(false)
                        }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                        }}
                        title="Hide DebugBar completely"
                    >
                        <span>✕</span>
                        <span>Hide</span>
                    </button>
                </div>
            </div>
            )}
            
            {/* Expanded Panel */}
            {isVisible && isExpanded && (
                <div style={{
                    position: 'fixed',
                    bottom: '40px',
                    left: 0,
                    right: 0,
                    height: '400px',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    borderTop: '1px solid #334155',
                    zIndex: 9998,
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid #334155',
                        background: 'rgba(15, 23, 42, 0.8)',
                        padding: '0 16px'
                    }}>
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'components', label: 'Components', icon: '🧩' },
                            { id: 'events', label: 'Events', icon: '⚡' },
                            { id: 'ws', label: 'WebSocket', icon: '🔌' },
                            { id: 'performance', label: 'Performance', icon: '🚀' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    border: 'none',
                                    color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
                                    padding: '12px 16px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    borderBottom: activeTab === tab.id ? '3px solid #6366f1' : '3px solid transparent',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
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
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                        
                        {/* Close button */}
                        <button
                            onClick={() => setIsExpanded(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                padding: '12px 16px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                marginLeft: 'auto',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#ef4444'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#94a3b8'
                            }}
                        >
                            ✕ Close
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '20px',
                        color: '#e2e8f0'
                    }}>
                        {activeTab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                {/* System Status */}
                                <div style={{
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    border: '1px solid #334155'
                                }}>
                                    <h3 style={{ margin: '0 0 12px 0', color: '#f1f5f9', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>🖥️</span>
                                        System Status
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>WebSocket:</span>
                                            <span style={{ color: ws ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                                                {ws ? '🟢 Connected' : '🔴 Disconnected'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Memory Usage:</span>
                                            <span style={{ color: memoryUsage > 50 ? '#ef4444' : '#22c55e' }}>
                                                {memoryUsage.toFixed(1)} MB
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Uptime:</span>
                                            <span style={{ color: '#94a3b8' }}>
                                                {Math.floor(performanceStats.uptime / 3600)}h {Math.floor((performanceStats.uptime % 3600) / 60)}m {performanceStats.uptime % 60}s
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>URL:</span>
                                            <span style={{ color: '#94a3b8', fontSize: '10px' }}>
                                                {window.location.href}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Quick Actions */}
                                <div style={{
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    border: '1px solid #334155'
                                }}>
                                    <h3 style={{ margin: '0 0 12px 0', color: '#f1f5f9', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>⚡</span>
                                        Quick Actions
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                        <button style={{
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                            color: '#22c55e',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }} onClick={() => console.clear()}>
                                            🗑️ Clear Console
                                        </button>
                                        <button style={{
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            color: '#3b82f6',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }} onClick={() => location.reload()}>
                                            🔄 Reload Page
                                        </button>
                                        <button style={{
                                            background: 'rgba(168, 85, 247, 0.2)',
                                            border: '1px solid rgba(168, 85, 247, 0.3)',
                                            color: '#a855f7',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }} onClick={() => window.open('/swagger', '_blank')}>
                                            📚 API Docs
                                        </button>
                                        <button style={{
                                            background: 'rgba(245, 101, 101, 0.2)',
                                            border: '1px solid rgba(245, 101, 101, 0.3)',
                                            color: '#f56565',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }} onClick={() => window.open('/api/memory/stats', '_blank')}>
                                            📊 Memory Stats
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'components' && (
                            <div>
                                <h3 style={{ margin: '0 0 16px 0', color: '#f1f5f9', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🧩</span>
                                    Live Components ({Object.keys(components).length})
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                                    {Object.entries(components).length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', gridColumn: '1 / -1' }}>
                                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧩</div>
                                            <h4>No components registered</h4>
                                            <p>Components will appear here when they connect to the WebSocket</p>
                                        </div>
                                    ) : (
                                        Object.entries(components).map(([id, state]) => (
                                            <div key={id} style={{
                                                background: 'rgba(15, 23, 42, 0.5)',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                border: '1px solid #334155'
                                            }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '12px'
                                                }}>
                                                    <h4 style={{ margin: 0, color: '#fbbf24', fontSize: '14px', fontWeight: '600' }}>
                                                        {id}
                                                    </h4>
                                                    <span style={{
                                                        background: connections[id]?.connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                        color: connections[id]?.connected ? '#22c55e' : '#ef4444',
                                                        padding: '4px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '10px',
                                                        fontWeight: '600'
                                                    }}>
                                                        {connections[id]?.connected ? '🟢 Connected' : '🔴 Disconnected'}
                                                    </span>
                                                </div>
                                                <div style={{ 
                                                    color: '#94a3b8', 
                                                    fontSize: '11px',
                                                    fontFamily: 'ui-monospace, "Fira Code", monospace',
                                                    background: 'rgba(0, 0, 0, 0.3)',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    maxHeight: '120px',
                                                    overflow: 'auto',
                                                    whiteSpace: 'pre-wrap'
                                                }}>
                                                    {JSON.stringify(state, null, 2)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'events' && (
                            <div>
                                <h3 style={{ margin: '0 0 16px 0', color: '#f1f5f9', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>⚡</span>
                                    Recent Events ({globalEvents.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {recentEvents.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
                                            <h4>No events yet</h4>
                                            <p>Events will appear here as components emit them</p>
                                        </div>
                                    ) : (
                                        recentEvents.map(event => (
                                            <div key={event.id} style={{
                                                background: 'rgba(15, 23, 42, 0.5)',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                border: '1px solid #334155'
                                            }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '8px'
                                                }}>
                                                    <span style={{ color: '#c084fc', fontWeight: '600', fontSize: '13px' }}>
                                                        {event.type}
                                                    </span>
                                                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                                                        {new Date(event.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div style={{ 
                                                    color: '#94a3b8', 
                                                    fontSize: '11px',
                                                    fontFamily: 'ui-monospace, "Fira Code", monospace',
                                                    background: 'rgba(0, 0, 0, 0.3)',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    whiteSpace: 'pre-wrap'
                                                }}>
                                                    {JSON.stringify(event.data, null, 2)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'ws' && (
                            <div>
                                <h3 style={{ margin: '0 0 16px 0', color: '#f1f5f9', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🔌</span>
                                    WebSocket Connection
                                </h3>
                                <div style={{
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    border: '1px solid #334155',
                                    maxWidth: '600px'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
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
                                            <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                                                ws://localhost:3000/live
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Ready State:</span>
                                            <span style={{ color: '#94a3b8' }}>
                                                {ws ? ws.readyState : 'N/A'} {ws && ws.readyState === 1 ? '(OPEN)' : ''}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Protocol:</span>
                                            <span style={{ color: '#94a3b8' }}>
                                                {ws?.protocol || 'N/A'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Buffer Amount:</span>
                                            <span style={{ color: '#94a3b8' }}>
                                                {ws?.bufferedAmount || 0} bytes
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'performance' && (
                            <div>
                                <h3 style={{ margin: '0 0 16px 0', color: '#f1f5f9', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🚀</span>
                                    Performance Metrics
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                    <div style={{
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        border: '1px solid #334155'
                                    }}>
                                        <h4 style={{ margin: '0 0 12px 0', color: '#f1f5f9', fontSize: '14px' }}>Memory Usage</h4>
                                        <div style={{ fontSize: '24px', fontWeight: '700', color: memoryUsage > 50 ? '#ef4444' : '#22c55e', marginBottom: '8px' }}>
                                            {memoryUsage.toFixed(1)} MB
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                            Heap: {((performance.memory?.totalJSHeapSize || 0) / 1024 / 1024).toFixed(1)} MB total
                                        </div>
                                    </div>
                                    
                                    <div style={{
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        border: '1px solid #334155'
                                    }}>
                                        <h4 style={{ margin: '0 0 12px 0', color: '#f1f5f9', fontSize: '14px' }}>Session Time</h4>
                                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' }}>
                                            {Math.floor(performanceStats.uptime / 60)}:{(performanceStats.uptime % 60).toString().padStart(2, '0')}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                            Started: {new Date(Date.now() - performanceStats.uptime * 1000).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    
                                    <div style={{
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        border: '1px solid #334155'
                                    }}>
                                        <h4 style={{ margin: '0 0 12px 0', color: '#f1f5f9', fontSize: '14px' }}>Event Count</h4>
                                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#a855f7', marginBottom: '8px' }}>
                                            {globalEvents.length}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                            Recent: {recentEvents.length} events
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* CSS Animation */}
            <style>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    )
}