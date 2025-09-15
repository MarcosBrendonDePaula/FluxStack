/**
 * LiveCounter Component
 * 
 * Exemplo de Live Component usando o sistema FluxLive
 * Demonstra sincronização em tempo real com o backend
 */

import React from 'react'
import { useEnhancedLive } from '../../../../core/live'

interface CounterState {
  count: number
  lastUpdate: number
  userId?: string
}

interface CounterActions {
  increment: () => Promise<void>
  decrement: () => Promise<void>
  reset: () => Promise<void>
  setCount: (value: number) => Promise<void>
}

interface LiveCounterProps {
  initialCount?: number
  userId?: string
  showDebug?: boolean
}

export function LiveCounter({ initialCount = 0, userId, showDebug = false }: LiveCounterProps) {
  const {
    state,
    loading,
    error,
    connected,
    callMethod,
    setState,
    globalState,
    hasGlobalConflicts,
    debug,
    hierarchy
  } = useEnhancedLive({
    actionName: 'CounterAction',
    props: { 
      initialCount,
      userId: userId || 'anonymous'
    },
    enableOptimistic: true,
    enableRetry: true,
    enableMemoryMonitoring: true,
    globalState: {
      selector: (state: any) => state?.counters || {},
      enableBiDirectional: true,
      conflictResolution: 'lastWriteWins'
    },
    onError: (error) => {
      console.error('LiveCounter error:', error)
    },
    onStateChange: (newState, oldState) => {
      console.log('Counter state changed:', { from: oldState, to: newState })
    }
  })

  const counterState = state as CounterState
  const count = counterState?.count ?? initialCount

  const handleIncrement = async () => {
    try {
      // Optimistic update
      await setState({ 
        ...counterState, 
        count: count + 1,
        lastUpdate: Date.now()
      }, true)
      
      // Call backend method
      await callMethod('increment')
    } catch (error) {
      console.error('Failed to increment:', error)
    }
  }

  const handleDecrement = async () => {
    try {
      await setState({ 
        ...counterState, 
        count: count - 1,
        lastUpdate: Date.now()
      }, true)
      
      await callMethod('decrement')
    } catch (error) {
      console.error('Failed to decrement:', error)
    }
  }

  const handleReset = async () => {
    try {
      await setState({ 
        ...counterState, 
        count: 0,
        lastUpdate: Date.now()
      }, true)
      
      await callMethod('reset')
    } catch (error) {
      console.error('Failed to reset:', error)
    }
  }

  const handleSetCount = async (value: number) => {
    try {
      await setState({ 
        ...counterState, 
        count: value,
        lastUpdate: Date.now()
      }, true)
      
      await callMethod('setCount', value)
    } catch (error) {
      console.error('Failed to set count:', error)
    }
  }

  if (loading) {
    return (
      <div className="live-counter loading">
        <div className="spinner"></div>
        <p>Conectando ao Live Component...</p>
      </div>
    )
  }

  return (
    <div className="live-counter">
      <div className="counter-header">
        <h3>🔄 Live Counter</h3>
        <div className="status-indicators">
          <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Conectado' : '🔴 Desconectado'}
          </span>
          {hasGlobalConflicts && (
            <span className="status conflict">⚠️ Conflitos</span>
          )}
        </div>
      </div>

      <div className="counter-display">
        <div className="count-value">
          <span className="count">{count}</span>
          {counterState?.lastUpdate && (
            <small className="last-update">
              Atualizado: {new Date(counterState.lastUpdate).toLocaleTimeString()}
            </small>
          )}
        </div>
      </div>

      <div className="counter-controls">
        <button 
          onClick={handleDecrement}
          disabled={loading}
          className="btn btn-secondary"
        >
          -1
        </button>
        
        <button 
          onClick={handleIncrement}
          disabled={loading}
          className="btn btn-primary"
        >
          +1
        </button>
        
        <button 
          onClick={handleReset}
          disabled={loading}
          className="btn btn-secondary"
        >
          Reset
        </button>
      </div>

      <div className="counter-advanced">
        <div className="input-group">
          <input 
            type="number" 
            placeholder="Definir valor..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt((e.target as HTMLInputElement).value)
                if (!isNaN(value)) {
                  handleSetCount(value)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }
            }}
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ Erro: {error.message}</span>
        </div>
      )}

      {showDebug && (
        <div className="debug-info">
          <details>
            <summary>🐛 Debug Info</summary>
            <div className="debug-content">
              <div className="debug-section">
                <h4>Component Info</h4>
                <pre>{JSON.stringify(debug.componentInfo, null, 2)}</pre>
              </div>
              
              <div className="debug-section">
                <h4>Global State</h4>
                <pre>{JSON.stringify(globalState, null, 2)}</pre>
              </div>
              
              <div className="debug-section">
                <h4>Performance</h4>
                <pre>{JSON.stringify(debug.performanceInfo, null, 2)}</pre>
              </div>

              {hierarchy.parent && (
                <div className="debug-section">
                  <h4>Hierarchy</h4>
                  <p>Parent: {hierarchy.parent.id}</p>
                  <p>Children: {hierarchy.children.map(c => c.id).join(', ') || 'None'}</p>
                  <p>Siblings: {hierarchy.siblings.map(c => c.id).join(', ') || 'None'}</p>
                </div>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default LiveCounter