import { useLive } from '@/hooks/useLive'

export function TestCounterFixed() {
    const { 
        state, 
        loading, 
        error, 
        connected, 
        callMethod,
        componentId: id
    } = useLive({
        name: 'TestCounterFixedAction',
        props: { count: 0, step: 1 },
        componentId: 'test-counter-fixed'
    })

    return (
        <div style={{
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '1.5rem',
            margin: '1rem',
            background: '#ffffff',
            minWidth: '300px',
            maxWidth: '400px'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h3 style={{ margin: 0, color: '#1f2937' }}>🔢 Test Counter (Fixed)</h3>
                <div style={{ 
                    fontSize: '0.8rem',
                    color: connected ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                }}>
                    {connected ? '🟢 Live' : '🔴 Offline'}
                </div>
            </div>

            {/* Counter Display */}
            <div style={{
                textAlign: 'center',
                padding: '2rem',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '1rem'
            }}>
                <div style={{ 
                    fontSize: '3rem', 
                    fontWeight: 'bold', 
                    color: '#1f2937',
                    marginBottom: '0.5rem'
                }}>
                    {state.count || 0}
                </div>
                <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#64748b'
                }}>
                    Step: {state.step || 1}
                </div>
            </div>

            {/* Controls */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                marginTop: '1rem'
            }}>
                <button
                    onClick={() => callMethod('decrement')}
                    disabled={loading}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? '⏳' : '➖ -1'}
                </button>
                
                <button
                    onClick={() => callMethod('reset')}
                    disabled={loading}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? '⏳' : '🔄 Reset'}
                </button>
                
                <button
                    onClick={() => callMethod('increment')}
                    disabled={loading}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? '⏳' : '➕ +1'}
                </button>
            </div>

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

            {/* Debug Info */}
            <div style={{ 
                fontSize: '0.75rem',
                opacity: 0.7,
                textAlign: 'center',
                marginTop: '1rem',
                padding: '0.5rem',
                background: '#f9fafb',
                borderRadius: '6px'
            }}>
                ID: {id} | Generated with Quick Generator CLI
            </div>
        </div>
    )
}