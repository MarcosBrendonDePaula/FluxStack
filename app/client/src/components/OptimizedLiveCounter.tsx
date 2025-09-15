/**
 * OptimizedLiveCounter Component
 * 
 * Live Component otimizado que usa o WebSocket Connection Manager
 * para compartilhar uma única conexão WebSocket entre todos os componentes
 */

import React, { useState, useEffect, useRef } from 'react'
import { wsManager } from '../lib/WebSocketConnectionManager'
import './LiveCounter.css'

interface CounterState {
  count: number
  lastUpdate: number
  version: number
}

interface OptimizedLiveCounterProps {
  initialCount?: number
  componentId: string
  showDebug?: boolean
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

interface WebSocketMessage {
  id: string
  type: string
  componentId: string
  timestamp: number
  payload: any
  replyTo?: string
}

export function OptimizedLiveCounter({ 
  initialCount = 0, 
  componentId, 
  showDebug = false 
}: OptimizedLiveCounterProps) {
  const [state, setState] = useState<CounterState>({
    count: initialCount,
    lastUpdate: Date.now(),
    version: 0
  })
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messageLog, setMessageLog] = useState<any[]>([])
  
  const mountedRef = useRef(false)

  // Handlers para o WebSocket Manager
  const handleMessage = (message: WebSocketMessage) => {
    if (showDebug) {
      setMessageLog(prev => [...prev.slice(-9), { type: 'received', message }])
    }

    // Filtrar mensagens para este componente
    if (message.componentId !== componentId && message.type !== 'state_synchronized') {
      return
    }

    switch (message.type) {
      case 'component_mounted':
        console.log(`[OptimizedLiveCounter] Component ${componentId} mounted on server`)
        break

      case 'state_update_confirmed':
        console.log(`[OptimizedLiveCounter] State update confirmed for ${componentId}, version: ${message.payload.version}`)
        setState(prev => ({ ...prev, version: message.payload.version }))
        setLoading(false)
        break

      case 'state_synchronized':
        if (message.componentId !== componentId) {
          console.log(`[OptimizedLiveCounter] State synchronized from component ${message.componentId}`)
          setState(prev => ({
            ...prev,
            count: message.payload.state.count,
            lastUpdate: message.timestamp,
            version: message.payload.version
          }))
        }
        break

      case 'method_result':
        handleMethodResult(message)
        break

      case 'error':
        console.error(`[OptimizedLiveCounter] Server error for ${componentId}:`, message.payload)
        setError(message.payload.message)
        setLoading(false)
        break
    }
  }

  const handleStateChange = (newState: ConnectionState) => {
    setConnectionState(newState)
  }

  const handleError = (errorMsg: string) => {
    setError(errorMsg)
    setLoading(false)
  }

  // Processar resultado de métodos
  const handleMethodResult = (message: WebSocketMessage) => {
    if (message.componentId !== componentId) return

    const { result, method } = message.payload
    
    if (result.success) {
      setState(prev => ({
        ...prev,
        count: result.value,
        lastUpdate: message.timestamp
      }))
      console.log(`[OptimizedLiveCounter] Method ${method} completed for ${componentId}:`, result.value)
    } else {
      console.error(`[OptimizedLiveCounter] Method ${method} failed for ${componentId}:`, result.error)
      setError(`Erro em ${method}: ${result.error}`)
    }
    
    setLoading(false)
  }

  // Enviar mensagem via WebSocket Manager
  const sendMessage = (partial: Partial<WebSocketMessage>) => {
    const message = {
      componentId,
      ...partial
    }

    wsManager.sendMessage(message).catch(error => {
      console.warn(`[OptimizedLiveCounter] Failed to send message for ${componentId}:`, error.message)
    })

    if (showDebug) {
      setMessageLog(prev => [...prev.slice(-9), { type: 'sent', message }])
    }
  }

  // Handlers dos botões
  const handleIncrement = () => {
    if (loading || connectionState !== 'connected') return
    
    setLoading(true)
    // Atualização otimista
    setState(prev => ({ ...prev, count: prev.count + 1, lastUpdate: Date.now() }))
    
    // Chamar método no servidor
    sendMessage({
      type: 'method_call',
      payload: { method: 'increment', args: [state.count] }
    })
  }

  const handleDecrement = () => {
    if (loading || connectionState !== 'connected') return
    
    setLoading(true)
    // Atualização otimista
    setState(prev => ({ ...prev, count: prev.count - 1, lastUpdate: Date.now() }))
    
    // Chamar método no servidor
    sendMessage({
      type: 'method_call',
      payload: { method: 'decrement', args: [state.count] }
    })
  }

  const handleReset = () => {
    if (loading || connectionState !== 'connected') return
    
    setLoading(true)
    // Atualização otimista
    setState(prev => ({ ...prev, count: 0, lastUpdate: Date.now() }))
    
    // Chamar método no servidor
    sendMessage({
      type: 'method_call',
      payload: { method: 'reset', args: [] }
    })
  }

  const handleSetValue = (value: number) => {
    if (loading || connectionState !== 'connected' || isNaN(value)) return
    
    setLoading(true)
    // Atualização otimista
    setState(prev => ({ ...prev, count: value, lastUpdate: Date.now() }))
    
    // Chamar método no servidor
    sendMessage({
      type: 'method_call',
      payload: { method: 'setValue', args: [value] }
    })
  }

  // Conectar ao montar e desconectar ao desmontar
  useEffect(() => {
    console.log(`[OptimizedLiveCounter] Mounting component: ${componentId}`)
    mountedRef.current = true

    // Conectar via WebSocket Manager
    wsManager.connect(componentId, {
      onMessage: handleMessage,
      onStateChange: handleStateChange,
      onError: handleError
    })

    // Definir estado inicial
    setConnectionState(wsManager.getConnectionState())

    return () => {
      console.log(`[OptimizedLiveCounter] Unmounting component: ${componentId}`)
      mountedRef.current = false
      wsManager.disconnect(componentId)
    }
  }, [componentId])

  const getConnectionColor = () => {
    switch (connectionState) {
      case 'connected': return '🟢'
      case 'connecting': return '🟡'
      case 'reconnecting': return '🟠'
      case 'error': return '🔴'
      case 'disconnected': return '⚫'
      default: return '⚪'
    }
  }

  const getConnectionText = () => {
    switch (connectionState) {
      case 'connected': return 'Conectado'
      case 'connecting': return 'Conectando...'
      case 'reconnecting': return 'Reconectando...'
      case 'error': return 'Erro'
      case 'disconnected': return 'Desconectado'
      default: return 'Desconhecido'
    }
  }

  const managerStats = wsManager.getStats()

  return (
    <div className="live-counter optimized-live-counter">
      <div className="counter-header">
        <h3>⚡ Optimized Live Counter</h3>
        <div className="status-indicators">
          <span className={`status ${connectionState}`}>
            {getConnectionColor()} {getConnectionText()}
          </span>
          <span className="status">
            🔗 v{state.version}
          </span>
          {managerStats.clientId && (
            <span className="status client-id">
              👤 {managerStats.clientId.split('-')[1]}
            </span>
          )}
        </div>
      </div>

      {connectionState === 'connecting' && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Conectando ao Live System...</p>
        </div>
      )}

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
          disabled={loading || connectionState !== 'connected'}
          className="btn btn-secondary"
        >
          -1
        </button>
        
        <button 
          onClick={handleIncrement}
          disabled={loading || connectionState !== 'connected'}
          className="btn btn-primary"
        >
          +1
        </button>
        
        <button 
          onClick={handleReset}
          disabled={loading || connectionState !== 'connected'}
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
            disabled={connectionState !== 'connected'}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt((e.target as HTMLInputElement).value)
                if (!isNaN(value)) {
                  handleSetValue(value)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }
            }}
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} className="btn btn-sm">✕</button>
        </div>
      )}

      {showDebug && (
        <div className="debug-info">
          <details>
            <summary>🐛 Debug Info (Optimized)</summary>
            <div className="debug-content">
              <div className="debug-section">
                <h4>Component State</h4>
                <pre>{JSON.stringify({ componentId, state, connectionState }, null, 2)}</pre>
              </div>
              
              <div className="debug-section">
                <h4>WebSocket Manager Stats</h4>
                <pre>{JSON.stringify(managerStats, null, 2)}</pre>
              </div>
              
              {messageLog.length > 0 && (
                <div className="debug-section">
                  <h4>Message Log (últimas 10)</h4>
                  <div className="message-log">
                    {messageLog.map((entry, index) => (
                      <div key={index} className={`message ${entry.type}`}>
                        <span className="message-type">{entry.type === 'sent' ? '↗️' : '↙️'}</span>
                        <span className="message-content">
                          {entry.message.type}: {JSON.stringify(entry.message.payload).substring(0, 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="debug-section">
                <h4>Optimization Features</h4>
                <ul>
                  <li>✅ Single WebSocket Connection</li>
                  <li>✅ Message Multiplexing</li>
                  <li>✅ Connection Pooling</li>
                  <li>✅ Automatic Cleanup</li>
                  <li>✅ Message Queuing</li>
                  <li>✅ Smart Reconnection</li>
                  <li>✅ Shared Client ID</li>
                  <li>✅ Resource Optimization</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default OptimizedLiveCounter