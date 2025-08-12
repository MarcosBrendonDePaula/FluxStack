import { useLive } from '@/hooks/useLive'
import { useState } from 'react'

interface ExampleEnhancedProps {
    componentId?: string
    title?: string
    maxItems?: number
    isEnabled?: boolean
    
    // Event handlers (Livewire-style)
    onItemAdded?: (data: { success: boolean, item: string, totalItems: number, counter: number }) => void
    onItemRemoved?: (data: { success: boolean, removedItem: string, totalItems: number }) => void
    onAllItemsCleared?: (data: { success: boolean, clearedCount: number, message: string }) => void
    onTitleUpdated?: (data: { success: boolean, title: string, message: string }) => void
    onStateToggled?: (data: { success: boolean, isEnabled: boolean, status: string }) => void
    onComponentChanged?: (data: { componentId: string, action: string, timestamp: number, state: any }) => void
}

export function ExampleEnhanced({
    componentId,
    title = 'Exemplo Enhanced',
    maxItems = 10,
    isEnabled = true,
    // Event handlers
    onItemAdded,
    onItemRemoved,
    onAllItemsCleared,
    onTitleUpdated,
    onStateToggled,
    onComponentChanged
}: ExampleEnhancedProps) {
    const [newItem, setNewItem] = useState('')
    const [newTitle, setNewTitle] = useState('')

    const { 
        state, 
        loading, 
        error, 
        connected, 
        callMethod,
        componentId: id
    } = useLive({
        name: 'ExampleEnhancedAction',
        props: { title, maxItems, isEnabled },
        componentId,
        eventHandlers: {
            'item-added': onItemAdded,
            'item-removed': onItemRemoved,
            'all-items-cleared': onAllItemsCleared,
            'title-updated': onTitleUpdated,
            'state-toggled': onStateToggled,
            'component-changed': onComponentChanged
        }
    })

    const handleAddItem = async () => {
        if (!newItem.trim()) return
        
        try {
            await callMethod('addItem', newItem.trim())
            setNewItem('')
        } catch (err) {
            console.error('Erro ao adicionar item:', err)
        }
    }

    const handleRemoveItem = async (index: number) => {
        try {
            await callMethod('removeItem', index)
        } catch (err) {
            console.error('Erro ao remover item:', err)
        }
    }

    const handleUpdateTitle = async () => {
        if (!newTitle.trim()) return
        
        try {
            await callMethod('updateTitle', newTitle.trim())
            setNewTitle('')
        } catch (err) {
            console.error('Erro ao atualizar título:', err)
        }
    }

    const handleGetStats = async () => {
        try {
            const result = await callMethod('getStats')
            console.log('📊 Estatísticas do componente:', result)
        } catch (err) {
            console.error('Erro ao obter estatísticas:', err)
        }
    }

    return (
        <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '2rem',
            margin: '1rem',
            background: '#ffffff',
            minWidth: '400px',
            maxWidth: '600px'
        }}>
            {/* Header */}
            <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
            }}>
                <h3 style={{ margin: 0, color: '#1f2937' }}>
                    🚀 {state.title || 'ExampleEnhanced'}
                </h3>
                <div style={{ 
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                }}>
                    <div style={{ 
                        fontSize: '0.8rem',
                        color: connected ? '#10b981' : '#ef4444',
                        fontWeight: 'bold'
                    }}>
                        {connected ? '🟢 Live' : '🔴 Offline'}
                    </div>
                    <div style={{
                        fontSize: '0.8rem',
                        color: state.isEnabled ? '#10b981' : '#ef4444',
                        fontWeight: 'bold'
                    }}>
                        {state.isEnabled ? '✅ Enabled' : '❌ Disabled'}
                    </div>
                </div>
            </div>

            {/* State Display */}
            <div style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem'
            }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>📊 Component State:</h4>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    <div><strong>Título:</strong> {state.title || 'N/A'}</div>
                    <div><strong>Items:</strong> {state.items?.length || 0}</div>
                    <div><strong>Counter:</strong> {state.counter || 0}</div>
                    <div><strong>Última Ação:</strong> {state.lastAction || 'N/A'}</div>
                    <div><strong>Status:</strong> {state.isEnabled ? 'Habilitado' : 'Desabilitado'}</div>
                </div>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>📝 Items ({state.items?.length || 0}):</h4>
                {state.items?.length > 0 ? (
                    <div style={{ 
                        maxHeight: '120px', 
                        overflowY: 'auto',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        padding: '0.5rem'
                    }}>
                        {state.items.map((item: string, index: number) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.25rem 0.5rem',
                                backgroundColor: index % 2 === 0 ? '#f9fafb' : 'transparent',
                                borderRadius: '4px'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>{item}</span>
                                <button
                                    onClick={() => handleRemoveItem(index)}
                                    disabled={loading || !state.isEnabled}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        border: 'none',
                                        borderRadius: '4px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        cursor: loading || !state.isEnabled ? 'not-allowed' : 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontStyle: 'italic',
                        border: '1px dashed #d1d5db',
                        borderRadius: '6px'
                    }}>
                        Nenhum item adicionado ainda
                    </div>
                )}
            </div>

            {/* Add Item Form */}
            <div style={{ 
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#f0f9ff',
                borderRadius: '8px'
            }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>➕ Adicionar Item:</h5>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Digite um item (2-50 chars, sem 'teste')"
                        disabled={loading || !state.isEnabled}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                    <button
                        onClick={handleAddItem}
                        disabled={loading || !newItem.trim() || !state.isEnabled}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            cursor: loading || !newItem.trim() || !state.isEnabled ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        ➕ Add
                    </button>
                </div>
            </div>

            {/* Update Title Form */}
            <div style={{ 
                marginBottom: '1.5rem',
                padding: '1rem',
                background: '#fef3c7',
                borderRadius: '8px'
            }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>✏️ Atualizar Título:</h5>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Novo título (3-100 chars, alfanumérico)"
                        disabled={loading || !state.isEnabled}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateTitle()}
                    />
                    <button
                        onClick={handleUpdateTitle}
                        disabled={loading || !newTitle.trim() || !state.isEnabled}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            cursor: loading || !newTitle.trim() || !state.isEnabled ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        ✏️ Update
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.5rem',
                marginTop: '1rem'
            }}>
                <button
                    onClick={() => callMethod('toggle')}
                    disabled={loading}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: state.isEnabled ? '#ef4444' : '#10b981',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    {loading ? '🔄 Loading...' : (state.isEnabled ? '❌ Disable' : '✅ Enable')}
                </button>
                
                <button
                    onClick={() => callMethod('clearAll')}
                    disabled={loading || !state.isEnabled || (state.items?.length || 0) === 0}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        cursor: loading || !state.isEnabled || (state.items?.length || 0) === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    🧹 Clear All
                </button>
                
                <button
                    onClick={() => callMethod('reset')}
                    disabled={loading}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    🔄 Reset
                </button>
                
                <button
                    onClick={handleGetStats}
                    disabled={loading}
                    style={{
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#06b6d4',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    📊 Stats
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
                borderRadius: '6px',
                borderTop: '1px solid #e5e7eb'
            }}>
                Component ID: {id} | Actions: {state.counter || 0}
            </div>
        </div>
    )
}