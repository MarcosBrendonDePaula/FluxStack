import { useLive } from '@/hooks/useLive'
import { useEffect, useState } from 'react'

interface CounterProps {
    initialCount?: number
    step?: number
    label?: string
    maxCount?: number
    minCount?: number
    componentId?: string
    showDebug?: boolean
    
    // Livewire-style event handlers
    onCountChanged?: (data: { count: number, action: string }) => void
    onLimitReached?: (data: { type: 'max' | 'min', limit: number }) => void
    onCounterReset?: (data?: any) => void
    onInvalidValue?: (data: { attempted: number, min: number, max: number }) => void
    onStepChanged?: (data: { step: number }) => void
}

export function Counter({ 
    initialCount = 0, 
    step = 1, 
    label = "Counter",
    maxCount = 100,
    minCount = 0,
    componentId,
    showDebug = false,
    // Event handlers
    onCountChanged,
    onLimitReached,
    onCounterReset,
    onInvalidValue,
    onStepChanged
}: CounterProps) {
    const [notification, setNotification] = useState<string>('')

    // Handle notifications from events (separate from event handlers)
    const handleLimitReached = (data: { type: 'max' | 'min', limit: number }) => {
        const message = `⚠️ ${data.type === 'max' ? 'Máximo' : 'Mínimo'} atingido: ${data.limit}`
        setNotification(message)
        setTimeout(() => setNotification(''), 3000)
        // Also call user's handler if provided
        onLimitReached?.(data)
    }

    const handleCounterReset = (data?: any) => {
        setNotification('🔄 Contador resetado!')
        setTimeout(() => setNotification(''), 2000)
        onCounterReset?.(data)
    }

    const handleInvalidValue = (data: { attempted: number, min: number, max: number }) => {
        setNotification(`❌ Valor inválido: ${data.attempted} (min: ${data.min}, max: ${data.max})`)
        setTimeout(() => setNotification(''), 3000)
        onInvalidValue?.(data)
    }

    const handleStepChanged = (data: { step: number }) => {
        setNotification(`⚡ Step alterado para: ${data.step}`)
        setTimeout(() => setNotification(''), 2000)
        onStepChanged?.(data)
    }

    const { 
        state, 
        loading, 
        error, 
        connected, 
        callMethod, 
        optimisticUpdate,
        componentId: id,
        __debug
    } = useLive({
        name: 'CounterAction',
        props: { initialCount, step, label, maxCount, minCount },
        componentId,
        eventHandlers: {
            // Internal handlers with user callbacks
            onCountChanged: (data: any) => {
                console.log(`📊 Count changed to ${data.count} (${data.action})`)
                onCountChanged?.(data)
            },
            onLimitReached: handleLimitReached,
            onCounterReset: handleCounterReset,
            onInvalidValue: handleInvalidValue,
            onStepChanged: handleStepChanged
        }
    })
    
    // Optimistic increment
    const handleOptimisticIncrement = () => {
        if (state.count + state.step <= state.maxCount) {
            optimisticUpdate({ count: state.count + state.step })
            callMethod('increment')
        } else {
            callMethod('increment') // Will trigger limit-reached event
        }
    }
    
    // Optimistic decrement
    const handleOptimisticDecrement = () => {
        if (state.count - state.step >= state.minCount) {
            optimisticUpdate({ count: state.count - state.step })
            callMethod('decrement')
        } else {
            callMethod('decrement') // Will trigger limit-reached event
        }
    }

    return (
        <div className="live-counter" style={{
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            margin: '1rem',
            backgroundColor: connected ? '#f8fafc' : '#fef2f2',
            position: 'relative',
            minWidth: '300px'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>{state.label}</h3>
                <div style={{ 
                    fontSize: '0.75rem',
                    color: connected ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                }}>
                    {connected ? '🟢 Online' : '🔴 Offline'}
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div style={{
                    background: '#dbeafe',
                    border: '1px solid #bfdbfe', 
                    borderRadius: '8px',
                    padding: '0.5rem',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    color: '#1e40af'
                }}>
                    {notification}
                </div>
            )}

            {/* Counter Display */}
            <div style={{
                textAlign: 'center',
                marginBottom: '1.5rem'
            }}>
                <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    fontFamily: 'monospace'
                }}>
                    {state.count}
                </div>
                <div style={{
                    fontSize: '0.875rem',
                    color: '#64748b'
                }}>
                    {state.minCount} ← → {state.maxCount}
                </div>
                
                {/* Progress bar */}
                <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    marginTop: '0.5rem',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${state.percentage || 0}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            {/* Controls */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1rem'
            }}>
                <button 
                    onClick={handleOptimisticDecrement}
                    disabled={loading || state.isAtMin}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: state.isAtMin ? '#e2e8f0' : '#ef4444',
                        color: state.isAtMin ? '#94a3b8' : 'white',
                        fontWeight: 'bold',
                        cursor: state.isAtMin || loading ? 'not-allowed' : 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    -{state.step}
                </button>
                
                <button 
                    onClick={handleOptimisticIncrement}
                    disabled={loading || state.isAtMax}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: state.isAtMax ? '#e2e8f0' : '#10b981',
                        color: state.isAtMax ? '#94a3b8' : 'white',
                        fontWeight: 'bold',
                        cursor: state.isAtMax || loading ? 'not-allowed' : 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    +{state.step}
                </button>
            </div>

            {/* Advanced Controls */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                marginBottom: '1rem'
            }}>
                <button 
                    onClick={() => callMethod('incrementBy', 10)}
                    disabled={loading}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    +10
                </button>
                
                <button 
                    onClick={() => callMethod('reset')}
                    disabled={loading}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    Reset
                </button>
                
                <button 
                    onClick={() => {
                        const randomValue = Math.floor(Math.random() * (state.maxCount - state.minCount + 1)) + state.minCount
                        callMethod('setValue', randomValue)
                    }}
                    disabled={loading}
                    style={{
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    🎲
                </button>
            </div>

            {/* Step Control */}
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                }}>
                    Step: {state.step}
                </label>
                <input 
                    type="range"
                    min="1"
                    max="10"
                    value={state.step}
                    onChange={(e) => callMethod('setStep', parseInt(e.target.value))}
                    disabled={loading}
                    style={{ width: '100%' }}
                />
            </div>

            {/* Error Display */}
            {error && (
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                }}>
                    ❌ {error}
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    fontSize: '1rem'
                }}>
                    ⏳
                </div>
            )}

            {/* Debug Info */}
            {showDebug && (
                <details style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem' }}>
                    <summary>Debug Info</summary>
                    <pre style={{ marginTop: '0.5rem', overflow: 'auto' }}>
                        {JSON.stringify({ 
                            id, 
                            state: {
                                count: state.count,
                                step: state.step,
                                isAtMax: state.isAtMax,
                                isAtMin: state.isAtMin,
                                percentage: state.percentage
                            },
                            connection: { loading, error, connected },
                            debug: __debug 
                        }, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    )
}