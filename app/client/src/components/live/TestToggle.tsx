import { useLive } from '@/hooks/useLive'

export function TestToggle() {
    const { 
        state, 
        loading, 
        error, 
        connected, 
        callMethod,
        componentId: id
    } = useLive({
        name: 'TestToggleAction',
        props: { isEnabled: false, label: 'Feature Toggle' },
        componentId: 'test-toggle'
    })

    return (
        <div style={{
            border: '2px solid #8b5cf6',
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
                <h3 style={{ margin: 0, color: '#1f2937' }}>🔀 Test Toggle</h3>
                <div style={{ 
                    fontSize: '0.8rem',
                    color: connected ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                }}>
                    {connected ? '🟢 Live' : '🔴 Offline'}
                </div>
            </div>

            {/* Toggle Display */}
            <div style={{
                textAlign: 'center',
                padding: '2rem',
                background: state.isEnabled ? '#ecfdf5' : '#fef2f2',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: `2px solid ${state.isEnabled ? '#10b981' : '#ef4444'}`
            }}>
                <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '0.5rem'
                }}>
                    {state.isEnabled ? '✅' : '❌'}
                </div>
                <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: state.isEnabled ? '#10b981' : '#ef4444',
                    marginBottom: '0.5rem'
                }}>
                    {state.isEnabled ? 'ENABLED' : 'DISABLED'}
                </div>
                <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#64748b'
                }}>
                    {state.label || 'Toggle'}
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
                    onClick={() => callMethod('disable')}
                    disabled={loading || !state.isEnabled}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: !state.isEnabled ? '#6b7280' : '#ef4444',
                        color: 'white',
                        cursor: (loading || !state.isEnabled) ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        opacity: !state.isEnabled ? 0.5 : 1
                    }}
                >
                    {loading ? '⏳' : '🔴 Disable'}
                </button>
                
                <button
                    onClick={() => callMethod('toggle')}
                    disabled={loading}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? '⏳' : '🔀 Toggle'}
                </button>
                
                <button
                    onClick={() => callMethod('enable')}
                    disabled={loading || state.isEnabled}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: state.isEnabled ? '#6b7280' : '#10b981',
                        color: 'white',
                        cursor: (loading || state.isEnabled) ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        opacity: state.isEnabled ? 0.5 : 1
                    }}
                >
                    {loading ? '⏳' : '🟢 Enable'}
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