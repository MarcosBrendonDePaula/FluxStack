/**
 * RealLiveCounter Component
 * 
 * Live Component com conexão WebSocket real ao backend
 * Demonstra sincronização em tempo real entre cliente e servidor
 */

import React, { useState, useEffect, useRef } from 'react'
import './LiveCounter.css'

interface CounterState {
  count: number
  lastUpdate: number
  version: number
}

interface RealLiveCounterProps {
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

export function RealLiveCounter({ 
  initialCount = 0, 
  componentId, 
  showDebug = false 
}: RealLiveCounterProps) {
  const [state, setState] = useState<CounterState>({
    count: initialCount,
    lastUpdate: Date.now(),
    version: 0
  })
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string>('')
  const [messageLog, setMessageLog] = useState<any[]>([])
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()

  // Conectar ao WebSocket
  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionState('connecting')
    setError(null)

    const wsUrl = `ws://localhost:3000/api/ws/live`
    console.log(`[RealLiveCounter] Connecting to: ${wsUrl}`)
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[RealLiveCounter] WebSocket connected')
      setConnectionState('connected')
      
      // Montar componente no servidor
      sendMessage({
        type: 'component_mount',
        payload: {
          componentId,
          initialState: state,
          componentType: 'RealLiveCounter'
        }
      })
      
      // Iniciar heartbeat
      startHeartbeat()
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        handleMessage(message)
      } catch (err) {
        console.error('[RealLiveCounter] Error parsing message:', err)
      }
    }

    ws.onclose = (event) => {
      console.log('[RealLiveCounter] WebSocket disconnected:', event.code, event.reason)
      setConnectionState('disconnected')
      stopHeartbeat()
      
      // Tentar reconectar após delay
      if (!event.wasClean) {
        scheduleReconnect()
      }
    }

    ws.onerror = (error) => {
      console.error('[RealLiveCounter] WebSocket error:', error)
      setConnectionState('error')
      setError('Conexão WebSocket falhou')
    }
  }

  // Enviar mensagem para o servidor
  const sendMessage = (partial: Partial<WebSocketMessage>) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('[RealLiveCounter] WebSocket not connected')
      return
    }

    const message: WebSocketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      componentId,
      timestamp: Date.now(),
      ...partial
    } as WebSocketMessage

    wsRef.current.send(JSON.stringify(message))
    
    if (showDebug) {
      setMessageLog(prev => [...prev.slice(-9), { type: 'sent', message }])
    }
  }

  // Processar mensagens recebidas
  const handleMessage = (message: WebSocketMessage) => {
    if (showDebug) {
      setMessageLog(prev => [...prev.slice(-9), { type: 'received', message }])
    }

    switch (message.type) {
      case 'connection_established':
        setClientId(message.payload.clientId)
        console.log('[RealLiveCounter] Client ID:', message.payload.clientId)
        break

      case 'component_mounted':
        console.log('[RealLiveCounter] Component mounted on server')
        break

      case 'state_update_confirmed':
        console.log('[RealLiveCounter] State update confirmed, version:', message.payload.version)
        setState(prev => ({ ...prev, version: message.payload.version }))
        break

      case 'state_synchronized':
        console.log('[RealLiveCounter] State synchronized from another client')
        setState(prev => ({
          ...prev,
          count: message.payload.state.count,
          lastUpdate: message.timestamp,
          version: message.payload.version
        }))
        break

      case 'method_result':
        handleMethodResult(message)
        break

      case 'heartbeat_ack':
        // Heartbeat confirmado
        break

      case 'error':
        console.error('[RealLiveCounter] Server error:', message.payload)
        setError(message.payload.message)
        break

      default:
        console.log('[RealLiveCounter] Unknown message type:', message.type)
    }
  }

  // Processar resultado de métodos
  const handleMethodResult = (message: WebSocketMessage) => {
    const { result, method } = message.payload
    
    if (result.success) {
      setState(prev => ({
        ...prev,
        count: result.value,
        lastUpdate: message.timestamp
      }))
      console.log(`[RealLiveCounter] Method ${method} completed:`, result.value)
    } else {
      console.error(`[RealLiveCounter] Method ${method} failed:`, result.error)
      setError(`Erro em ${method}: ${result.error}`)
    }
    
    setLoading(false)
  }

  // Agendar reconexão
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return

    setConnectionState('reconnecting')
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = undefined
      connect()
    }, 3000)
  }

  // Iniciar heartbeat
  const startHeartbeat = () => {
    heartbeatIntervalRef.current = setInterval(() => {
      sendMessage({
        type: 'heartbeat',
        payload: { timestamp: Date.now() }
      })
    }, 30000) // 30 segundos
  }

  // Parar heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = undefined
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

  // Conectar ao montar
  useEffect(() => {
    connect()
    
    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      stopHeartbeat()
      
      if (wsRef.current) {
        wsRef.current.close()
      }
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

  return (
    <div className="live-counter real-live-counter">
      <div className="counter-header">
        <h3>🔄 Real Live Counter (WebSocket)</h3>
        <div className="status-indicators">
          <span className={`status ${connectionState}`}>
            {getConnectionColor()} {getConnectionText()}
          </span>
          <span className="status">
            ⚡ v{state.version}
          </span>
          {clientId && (
            <span className="status client-id">
              👤 {clientId.split('-')[1]}
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
        
        {connectionState !== 'connected' && (
          <button 
            onClick={connect}
            className="btn btn-primary"
          >
            🔄 Reconectar
          </button>
        )}
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
            <summary>🐛 Debug Info (Real WebSocket)</summary>
            <div className="debug-content">
              <div className="debug-section">
                <h4>Component State</h4>
                <pre>{JSON.stringify({ componentId, state, connectionState, clientId }, null, 2)}</pre>
              </div>
              
              <div className="debug-section">
                <h4>Connection Info</h4>
                <pre>{JSON.stringify({
                  url: `ws://localhost:3000/api/ws/live`,
                  readyState: wsRef.current?.readyState,
                  protocol: wsRef.current?.protocol
                }, null, 2)}</pre>
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
                <h4>Features</h4>
                <ul>
                  <li>✅ Real WebSocket Connection</li>
                  <li>✅ Server State Synchronization</li>
                  <li>✅ Optimistic Updates</li>
                  <li>✅ Auto Reconnection</li>
                  <li>✅ Heartbeat Monitoring</li>
                  <li>✅ Multi-client Sync</li>
                  <li>✅ Method Execution</li>
                  <li>✅ Error Handling</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default RealLiveCounter