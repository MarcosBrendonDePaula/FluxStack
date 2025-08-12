import { useLive } from '@/hooks/useLive'
import { useState } from 'react'

interface Toast {
    id: string
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration: number
    timestamp: number
    persistent: boolean
}

interface ToastProps {
    maxToasts?: number
    defaultDuration?: number
    componentId?: string
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    
    // Livewire-style event handlers
    onToastShown?: (data: { componentId: string, toast: Toast }) => void
    onToastDismissed?: (data: { componentId: string, toastId: string, remaining: number }) => void
    onToastsCleared?: (data: { componentId: string, clearedCount: number }) => void
    onToastsAutoCleaned?: (data: { componentId: string, cleanedCount: number, remaining: number }) => void
    onStatsRequested?: (data: { componentId: string, stats: any }) => void
}

export function Toast({ 
    maxToasts = 5,
    defaultDuration = 5000,
    componentId,
    position = 'top-right',
    // Event handlers
    onToastShown,
    onToastDismissed,
    onToastsCleared,
    onToastsAutoCleaned,
    onStatsRequested
}: ToastProps) {
    const { 
        state, 
        loading, 
        error, 
        connected, 
        callMethod,
        functionResult,
        isFunctionLoading,
        functionError,
        componentId: id
    } = useLive({
        name: 'ToastAction',
        props: { maxToasts, defaultDuration },
        componentId,
        eventHandlers: {
            onToastShown,
            onToastDismissed,
            onToastsCleared,
            onToastsAutoCleaned,
            onStatsRequested
        }
    })
    
    const [testMessage, setTestMessage] = useState('')
    const [testType, setTestType] = useState<'success' | 'error' | 'warning' | 'info'>('info')
    
    const getPositionStyles = () => {
        const base = {
            position: 'fixed' as const,
            zIndex: 9999,
            pointerEvents: 'none' as const
        }
        
        switch (position) {
            case 'top-right':
                return { ...base, top: '1rem', right: '1rem' }
            case 'top-left':
                return { ...base, top: '1rem', left: '1rem' }
            case 'bottom-right':
                return { ...base, bottom: '1rem', right: '1rem' }
            case 'bottom-left':
                return { ...base, bottom: '1rem', left: '1rem' }
        }
    }
    
    const getToastTypeStyles = (type: string) => {
        const base = {
            padding: '1rem',
            margin: '0.5rem 0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'auto' as const,
            maxWidth: '400px',
            minWidth: '300px',
            border: '1px solid',
            transition: 'all 0.3s ease'
        }
        
        switch (type) {
            case 'success':
                return {
                    ...base,
                    background: '#f0fdf4',
                    borderColor: '#22c55e',
                    color: '#15803d'
                }
            case 'error':
                return {
                    ...base,
                    background: '#fef2f2',
                    borderColor: '#ef4444',
                    color: '#dc2626'
                }
            case 'warning':
                return {
                    ...base,
                    background: '#fffbeb',
                    borderColor: '#f59e0b',
                    color: '#d97706'
                }
            case 'info':
            default:
                return {
                    ...base,
                    background: '#f0f9ff',
                    borderColor: '#3b82f6',
                    color: '#1d4ed8'
                }
        }
    }
    
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return '✅'
            case 'error': return '❌'
            case 'warning': return '⚠️'
            case 'info': return 'ℹ️'
            default: return '💬'
        }
    }
    
    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000)
        if (seconds < 60) return `${seconds}s ago`
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        return `${hours}h ago`
    }

    return (
        <>
            {/* Toast Container */}
            <div style={getPositionStyles()}>
                {state.toasts?.map((toast: Toast) => (
                    <div 
                        key={toast.id}
                        style={getToastTypeStyles(toast.type)}
                    >
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: '0.5rem' 
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(toast.type)}</span>
                                <strong>{toast.title}</strong>
                                {toast.persistent && (
                                    <span style={{ 
                                        fontSize: '0.75rem',
                                        background: 'rgba(0,0,0,0.1)',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '12px'
                                    }}>
                                        PERSIST
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => callMethod('dismissToast', toast.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    opacity: 0.7,
                                    padding: '0.25rem'
                                }}
                                title="Dismiss toast"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div style={{ 
                            fontSize: '0.9rem', 
                            lineHeight: 1.4,
                            marginBottom: '0.5rem'
                        }}>
                            {toast.message}
                        </div>
                        
                        <div style={{ 
                            fontSize: '0.75rem', 
                            opacity: 0.7,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>{formatTimeAgo(toast.timestamp)}</span>
                            <span>{toast.duration}ms</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Test Controls */}
            <div style={{
                position: 'fixed',
                bottom: '1rem',
                left: '1rem',
                background: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '350px',
                zIndex: 9998
            }}>
                {/* Connection Status */}
                <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🍞 Toast Manager</h3>
                    <div style={{ 
                        fontSize: '0.8rem',
                        color: connected ? '#10b981' : '#ef4444',
                        fontWeight: 'bold'
                    }}>
                        {connected ? '🟢 Live' : '🔴 Offline'}
                    </div>
                </div>

                {/* Stats */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    fontSize: '0.8rem'
                }}>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px' }}>
                        <strong>{state.toasts?.length || 0}</strong>
                        <div style={{ opacity: 0.7 }}>Active</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px' }}>
                        <strong>{state.maxToasts || 5}</strong>
                        <div style={{ opacity: 0.7 }}>Max</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px' }}>
                        <strong>{state.defaultDuration || 5000}ms</strong>
                        <div style={{ opacity: 0.7 }}>Duration</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <button
                        onClick={() => callMethod('showSuccess', 'Success!', 'Operation completed successfully')}
                        disabled={loading}
                        style={{
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#22c55e',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        ✅ Success
                    </button>
                    
                    <button
                        onClick={() => callMethod('showError', 'Error!', 'Something went wrong')}
                        disabled={loading}
                        style={{
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        ❌ Error
                    </button>
                    
                    <button
                        onClick={() => callMethod('showWarning', 'Warning!', 'Please be careful')}
                        disabled={loading}
                        style={{
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        ⚠️ Warning
                    </button>
                    
                    <button
                        onClick={() => callMethod('showInfo', 'Info', 'Here is some information')}
                        disabled={loading}
                        style={{
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        ℹ️ Info
                    </button>
                </div>

                {/* Advanced Controls */}
                <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <button
                        onClick={() => callMethod('testHydration')}
                        disabled={loading || isFunctionLoading}
                        style={{
                            padding: '0.75rem',
                            border: '2px solid #8b5cf6',
                            borderRadius: '6px',
                            backgroundColor: isFunctionLoading ? '#e5e7eb' : '#8b5cf6',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {isFunctionLoading ? '🔄 Testing...' : '🧪 Test Hydration'}
                    </button>
                    
                    <button
                        onClick={() => callMethod('clearAllToasts')}
                        disabled={loading}
                        style={{
                            padding: '0.75rem',
                            border: '2px solid #6b7280',
                            borderRadius: '6px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        🧹 Clear All
                    </button>
                </div>

                {/* Function Result Display */}
                {functionResult && (
                    <div style={{ 
                        padding: '0.75rem',
                        background: functionError ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${functionError ? '#ef4444' : '#22c55e'}`,
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        marginBottom: '1rem'
                    }}>
                        <strong>{functionError ? '❌ Error:' : '✅ Result:'}</strong>
                        <pre style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(functionError || functionResult, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div style={{
                        padding: '0.75rem',
                        background: '#fef2f2',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        color: '#dc2626',
                        fontSize: '0.8rem',
                        marginTop: '0.5rem'
                    }}>
                        ❌ {error}
                    </div>
                )}

                {/* Hydration Info */}
                <div style={{ 
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    textAlign: 'center',
                    marginTop: '1rem',
                    padding: '0.5rem',
                    background: '#f9fafb',
                    borderRadius: '6px'
                }}>
                    💾 Hydration: {id}
                    <br />
                    Try refreshing page or restarting server!
                </div>
            </div>
        </>
    )
}