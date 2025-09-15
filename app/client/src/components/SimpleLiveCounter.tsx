/**
 * SimpleLiveCounter Component
 * 
 * Simplified demonstration of Live Components concept
 * Shows how the UI would work before full backend integration
 */

import React, { useState, useEffect } from 'react'

interface CounterState {
  count: number
  lastUpdate: number
  userId?: string
}

interface SimpleLiveCounterProps {
  initialCount?: number
  userId?: string
  showDebug?: boolean
}

export function SimpleLiveCounter({ initialCount = 0, userId, showDebug = false }: SimpleLiveCounterProps) {
  const [state, setState] = useState<CounterState>({
    count: initialCount,
    lastUpdate: Date.now(),
    userId: userId || 'anonymous'
  })
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(true) // Simulated connection
  const [error, setError] = useState<Error | null>(null)

  // Simulate server calls with delays
  const simulateServerCall = async (operation: string, newCount: number) => {
    setLoading(true)
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setState(prev => ({
        ...prev,
        count: newCount,
        lastUpdate: Date.now()
      }))
      
      console.log(`[SimpleLiveCounter] ${operation} completed: ${newCount}`)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleIncrement = async () => {
    const newCount = state.count + 1
    // Optimistic update
    setState(prev => ({ ...prev, count: newCount, lastUpdate: Date.now() }))
    await simulateServerCall('increment', newCount)
  }

  const handleDecrement = async () => {
    const newCount = state.count - 1
    // Optimistic update
    setState(prev => ({ ...prev, count: newCount, lastUpdate: Date.now() }))
    await simulateServerCall('decrement', newCount)
  }

  const handleReset = async () => {
    // Optimistic update
    setState(prev => ({ ...prev, count: 0, lastUpdate: Date.now() }))
    await simulateServerCall('reset', 0)
  }

  const handleSetCount = async (value: number) => {
    if (isNaN(value)) return
    // Optimistic update
    setState(prev => ({ ...prev, count: value, lastUpdate: Date.now() }))
    await simulateServerCall('setCount', value)
  }

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly simulate connection changes (mostly connected)
      setConnected(Math.random() > 0.1)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading && state.count === initialCount) {
    return (
      <div className="live-counter loading">
        <div className="spinner"></div>
        <p>Conectando ao Live Component...</p>
      </div>
    )
  }

  const debugInfo = {
    componentInfo: {
      id: `simple-counter-${userId}`,
      actionName: 'CounterAction',
      props: { initialCount, userId },
      state: state
    },
    globalState: {
      counters: {
        [`simple-counter-${userId}`]: state
      }
    },
    performanceInfo: {
      renderCount: 1,
      lastRenderTime: Date.now(),
      memoryUsage: 'N/A (simplified demo)'
    }
  }

  return (
    <div className="live-counter">
      <div className="counter-header">
        <h3>🔄 Simple Live Counter (Demo)</h3>
        <div className="status-indicators">
          <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Conectado' : '🔴 Desconectado'}
          </span>
          <span className="status">🧪 Demo Mode</span>
        </div>
      </div>

      <div className="counter-display">
        <div className="count-value">
          <span className="count">{state.count}</span>
          <small className="last-update">
            Atualizado: {new Date(state.lastUpdate).toLocaleTimeString()}
          </small>
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
            <summary>🐛 Debug Info (Simplified)</summary>
            <div className="debug-content">
              <div className="debug-section">
                <h4>Component Info</h4>
                <pre>{JSON.stringify(debugInfo.componentInfo, null, 2)}</pre>
              </div>
              
              <div className="debug-section">
                <h4>Global State (Simulated)</h4>
                <pre>{JSON.stringify(debugInfo.globalState, null, 2)}</pre>
              </div>
              
              <div className="debug-section">
                <h4>Performance (Demo)</h4>
                <pre>{JSON.stringify(debugInfo.performanceInfo, null, 2)}</pre>
              </div>

              <div className="debug-section">
                <h4>Features Demonstrated</h4>
                <ul>
                  <li>✅ Optimistic Updates</li>
                  <li>✅ Connection Status</li>
                  <li>✅ Loading States</li>
                  <li>✅ Error Handling</li>
                  <li>✅ Debug Information</li>
                  <li>🚧 Real Server Communication (pending)</li>
                  <li>🚧 Global State Sync (pending)</li>
                  <li>🚧 Conflict Resolution (pending)</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default SimpleLiveCounter