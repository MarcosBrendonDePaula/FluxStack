import { useLive } from '@/hooks/useLive'
import { useEffect, useState } from 'react'

interface ClockProps {
    timezone?: string
    format?: '12h' | '24h'
    componentId?: string
    showDate?: boolean
    showControls?: boolean
    theme?: 'light' | 'dark' | 'neon'
}

export function Clock({ 
    timezone = "America/Sao_Paulo",
    format = "24h", 
    componentId,
    showDate = true,
    showControls = true,
    theme = 'light'
}: ClockProps) {
    const { 
        state, 
        loading, 
        error, 
        connected, 
        callMethod, 
        listen,
        componentId: id
    } = useLive({
        name: 'ClockAction',
        props: { timezone, format },
        componentId
    })
    
    const [notifications, setNotifications] = useState<string[]>([])
    const [serverInfo, setServerInfo] = useState<any>(null)
    
    // Listen to events from backend
    useEffect(() => {
        const unsubscribes: Array<() => void> = []
        
        // Clock started event
        unsubscribes.push(listen('clock-started', (data) => {
            console.log(`🟢 Clock started:`, data)
            addNotification(`⏰ Relógio iniciado (${data.timezone})`)
        }))
        
        // Clock stopped event
        unsubscribes.push(listen('clock-stopped', () => {
            console.log(`🔴 Clock stopped`)
            addNotification(`⏸️ Relógio pausado`)
        }))
        
        // Timezone changed event
        unsubscribes.push(listen('timezone-changed', (data) => {
            console.log(`🌍 Timezone changed:`, data)
            addNotification(`🌍 Fuso alterado: ${data.timezone}`)
        }))
        
        // Format changed event
        unsubscribes.push(listen('format-changed', (data) => {
            console.log(`🕐 Format changed:`, data)
            addNotification(`🕐 Formato: ${data.format}`)
        }))
        
        // Tick event (every second)
        unsubscribes.push(listen('tick', (data) => {
            // console.log(`⏱️ Tick:`, data.time) // Too verbose
        }))
        
        // Server info event
        unsubscribes.push(listen('server-info', (data) => {
            console.log(`🖥️ Server info:`, data)
            setServerInfo(data)
        }))
        
        // Cleanup
        return () => {
            unsubscribes.forEach(unsub => unsub())
        }
    }, [listen])
    
    // Start clock on mount
    useEffect(() => {
        if (connected && !state.isRunning) {
            callMethod('startClock')
        }
        
        // Cleanup on unmount
        return () => {
            if (connected && state.isRunning) {
                callMethod('stopClock')
            }
        }
    }, [connected])
    
    const addNotification = (message: string) => {
        setNotifications(prev => [...prev, message].slice(-3)) // Keep last 3
        setTimeout(() => {
            setNotifications(prev => prev.slice(1))
        }, 3000)
    }
    
    const getThemeStyles = () => {
        switch (theme) {
            case 'dark':
                return {
                    background: '#1a1a1a',
                    color: '#ffffff',
                    border: '2px solid #333333'
                }
            case 'neon':
                return {
                    background: '#000000',
                    color: '#00ff41',
                    border: '2px solid #00ff41',
                    boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
                    fontFamily: 'monospace'
                }
            default:
                return {
                    background: '#ffffff',
                    color: '#1e293b',
                    border: '2px solid #e2e8f0'
                }
        }
    }
    
    const timeZones = [
        'America/Sao_Paulo',
        'America/New_York', 
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Australia/Sydney'
    ]

    return (
        <div 
            className="live-clock" 
            style={{
                ...getThemeStyles(),
                borderRadius: '16px',
                padding: '2rem',
                margin: '1rem',
                textAlign: 'center',
                position: 'relative',
                minWidth: '320px',
                maxWidth: '400px'
            }}
        >
            {/* Connection Status */}
            <div style={{ 
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '0.75rem',
                color: connected ? '#10b981' : '#ef4444',
                fontWeight: 'bold'
            }}>
                {connected ? '🟢 Live' : '🔴 Offline'}
            </div>
            
            {/* Loading State */}
            {loading && (
                <div style={{ 
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    fontSize: '1rem'
                }}>
                    ⏳
                </div>
            )}

            {/* Notifications */}
            {notifications.map((notification, index) => (
                <div 
                    key={index}
                    style={{
                        position: 'absolute',
                        top: `${40 + index * 25}px`,
                        left: '10px',
                        right: '10px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        opacity: 1 - (index * 0.3)
                    }}
                >
                    {notification}
                </div>
            ))}

            {/* Main Time Display */}
            <div style={{
                fontSize: theme === 'neon' ? '4rem' : '3.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                fontFamily: theme === 'neon' ? 'monospace' : 'system-ui',
                textShadow: theme === 'neon' ? '0 0 10px currentColor' : 'none',
                letterSpacing: theme === 'neon' ? '2px' : 'normal'
            }}>
                {state.currentTime || '--:--:--'}
            </div>

            {/* Date Display */}
            {showDate && (
                <div style={{
                    fontSize: '1.1rem',
                    marginBottom: '1.5rem',
                    opacity: 0.8
                }}>
                    {new Date().toLocaleDateString('pt-BR', {
                        timeZone: state.timezone,
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    })}
                </div>
            )}

            {/* Status Info */}
            <div style={{
                fontSize: '0.875rem',
                opacity: 0.7,
                marginBottom: '1.5rem'
            }}>
                <div>🌍 {state.timezone}</div>
                <div>🕐 Formato: {state.format}</div>
                <div>⚡ Status: {state.isRunning ? 'Rodando' : 'Parado'}</div>
            </div>

            {/* Controls */}
            {showControls && (
                <div>
                    {/* Play/Pause Controls */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <button
                            onClick={() => callMethod('startClock')}
                            disabled={loading || state.isRunning}
                            style={{
                                padding: '0.75rem',
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: state.isRunning ? '#e2e8f0' : '#10b981',
                                color: state.isRunning ? '#94a3b8' : 'white',
                                fontWeight: 'bold',
                                cursor: state.isRunning || loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ▶️ Start
                        </button>
                        
                        <button
                            onClick={() => callMethod('stopClock')}
                            disabled={loading || !state.isRunning}
                            style={{
                                padding: '0.75rem',
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: !state.isRunning ? '#e2e8f0' : '#ef4444',
                                color: !state.isRunning ? '#94a3b8' : 'white',
                                fontWeight: 'bold',
                                cursor: !state.isRunning || loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ⏸️ Stop
                        </button>
                    </div>

                    {/* Timezone Selector */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem',
                            opacity: 0.8
                        }}>
                            Fuso Horário:
                        </label>
                        <select
                            value={state.timezone}
                            onChange={(e) => callMethod('setTimezone', e.target.value)}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.875rem'
                            }}
                        >
                            {timeZones.map(tz => (
                                <option key={tz} value={tz}>
                                    {tz.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Format Toggle */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem',
                            opacity: 0.8
                        }}>
                            Formato:
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem'
                        }}>
                            <button
                                onClick={() => callMethod('setFormat', '24h')}
                                disabled={loading}
                                style={{
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    backgroundColor: state.format === '24h' ? '#3b82f6' : 'white',
                                    color: state.format === '24h' ? 'white' : '#374151',
                                    fontSize: '0.875rem'
                                }}
                            >
                                24h
                            </button>
                            <button
                                onClick={() => callMethod('setFormat', '12h')}
                                disabled={loading}
                                style={{
                                    padding: '0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    backgroundColor: state.format === '12h' ? '#3b82f6' : 'white',
                                    color: state.format === '12h' ? 'white' : '#374151',
                                    fontSize: '0.875rem'
                                }}
                            >
                                12h
                            </button>
                        </div>
                    </div>

                    {/* Server Info Button */}
                    <button
                        onClick={() => callMethod('getServerInfo')}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            fontSize: '0.875rem',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        🖥️ Info do Servidor
                    </button>
                </div>
            )}

            {/* Server Info Display */}
            {serverInfo && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.05)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    textAlign: 'left'
                }}>
                    <div><strong>Server Time:</strong> {new Date(serverInfo.serverTime).toLocaleString()}</div>
                    <div><strong>Server Timezone:</strong> {serverInfo.serverTimezone}</div>
                    <div><strong>Uptime:</strong> {Math.floor(serverInfo.uptime)}s</div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '0.875rem'
                }}>
                    ❌ {error}
                </div>
            )}
        </div>
    )
}