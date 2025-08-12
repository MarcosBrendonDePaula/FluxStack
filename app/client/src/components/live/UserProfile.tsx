import { useLive } from '@/hooks/useLive'

interface UserProfileProps {
    // Add your props here
    // example: title?: string
    // example: isVisible?: boolean
    componentId?: string
    
    // Livewire-style event handlers
    onActionCompleted?: (data: { componentId: string, newValue: string, timestamp: number }) => void
    // Add more event handlers as needed
}

export function UserProfile({
    // Add your props with defaults here
    // example: title = "Default Title",
    // example: isVisible = true,
    componentId,
    // Event handlers
    onActionCompleted
}: UserProfileProps) {
    const { 
        state, 
        loading, 
        error, 
        connected, 
        callMethod,
        componentId: id
    } = useLive({
        name: 'UserProfileAction',
        props: { /* Pass props here */ },
        componentId,
        eventHandlers: {
            onActionCompleted
            // Add more event handlers here
        }
    })

    return (
        <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.5rem',
            margin: '1rem',
            background: '#ffffff',
            minWidth: '300px',
            maxWidth: '500px'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h3 style={{ margin: 0 }}>UserProfile</h3>
                <div style={{ 
                    fontSize: '0.8rem',
                    color: connected ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                }}>
                    {connected ? '🟢 Live' : '🔴 Offline'}
                </div>
            </div>

            
            {/* State Display */}
            <div style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                marginTop: '1rem'
            }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>📊 Component State:</h4>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    <div><strong>Example Property:</strong> {state.exampleProperty || 'Not set'}</div>
                    {/* Add more state properties display here */}
                </div>
            </div>
            {/* Controls */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.5rem',
                marginTop: '1rem'
            }}>
                <button
                    onClick={() => callMethod('exampleAction')}
                    disabled={loading}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    {loading ? '🔄 Loading...' : '🎯 Example Action'}
                </button>
                
                {/* Add more buttons here */}
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
                ID: {id}
            </div>
        </div>
    )
}