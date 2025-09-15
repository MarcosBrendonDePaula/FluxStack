/**
 * WebSocket Routes for Live Components
 */

import { Elysia } from 'elysia'
import type { WebSocketMessage, MessageType } from '@/core/live/types'

// Armazenar conexões WebSocket ativas
const activeConnections = new Map<string, any>()
const componentStates = new Map<string, any>()

export const websocketRoutes = new Elysia({ prefix: '/ws' })
  .ws('/live', {
    message(ws, message) {
      try {
        const data: WebSocketMessage = typeof message === 'string' 
          ? JSON.parse(message) 
          : message as any

        console.log('[WebSocket] Received message:', data.type, data.componentId)

        switch (data.type) {
          case 'component_mount':
            handleComponentMount(ws, data)
            break
            
          case 'state_update':
            handleStateUpdate(ws, data)
            break
            
          case 'method_call':
            handleMethodCall(ws, data)
            break
            
          case 'sync_request':
            handleSyncRequest(ws, data)
            break
            
          case 'heartbeat':
            handleHeartbeat(ws, data)
            break
            
          default:
            console.warn('[WebSocket] Unknown message type:', data.type)
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error)
        ws.send(JSON.stringify({
          id: Date.now().toString(),
          type: 'error',
          componentId: 'system',
          timestamp: Date.now(),
          payload: { message: 'Invalid message format' }
        }))
      }
    },
    
    open(ws) {
      const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      ;(ws as any).clientId = clientId
      activeConnections.set(clientId, ws)
      
      console.log(`[WebSocket] Client connected: ${clientId}`)
      
      // Send welcome message
      ws.send(JSON.stringify({
        id: Date.now().toString(),
        type: 'connection_established',
        componentId: 'system',
        timestamp: Date.now(),
        payload: { clientId, message: 'Connected to FluxStack Live System' }
      }))
    },
    
    close(ws) {
      const clientId = (ws as any).clientId
      if (clientId) {
        activeConnections.delete(clientId)
        console.log(`[WebSocket] Client disconnected: ${clientId}`)
      }
    },
    
    error(ws, error) {
      console.error('[WebSocket] Connection error:', error)
    }
  })

// Handler para montagem de componentes
function handleComponentMount(ws: any, data: WebSocketMessage) {
  const { componentId, payload } = data
  
  // Armazenar estado inicial do componente
  componentStates.set(componentId, {
    ...payload,
    clientId: ws.clientId,
    mountedAt: Date.now(),
    lastActivity: Date.now()
  })
  
  console.log(`[WebSocket] Component mounted: ${componentId}`)
  
  // Confirmar montagem
  ws.send(JSON.stringify({
    id: Date.now().toString(),
    type: 'component_mounted',
    componentId,
    timestamp: Date.now(),
    payload: { status: 'success', initialState: payload }
  }))
}

// Handler para atualizações de estado
function handleStateUpdate(ws: any, data: WebSocketMessage) {
  const { componentId, payload } = data
  
  // Atualizar estado do componente
  const currentState = componentStates.get(componentId) || {}
  const newState = {
    ...currentState,
    ...payload,
    lastActivity: Date.now(),
    version: (currentState.version || 0) + 1
  }
  
  componentStates.set(componentId, newState)
  
  console.log(`[WebSocket] State updated for ${componentId}:`, payload)
  
  // Broadcast para outros clientes conectados ao mesmo componente
  broadcastToComponent(componentId, {
    id: Date.now().toString(),
    type: 'state_synchronized',
    componentId,
    timestamp: Date.now(),
    payload: { state: payload, version: newState.version }
  }, ws.clientId)
  
  // Confirmar atualização para o remetente
  ws.send(JSON.stringify({
    id: Date.now().toString(),
    type: 'state_update_confirmed',
    componentId,
    timestamp: Date.now(),
    payload: { status: 'success', version: newState.version }
  }))
}

// Handler para chamadas de métodos
function handleMethodCall(ws: any, data: WebSocketMessage) {
  const { componentId, payload } = data
  
  console.log(`[WebSocket] Method call for ${componentId}:`, payload.method)
  
  // Simular execução de método (aqui você implementaria a lógica real)
  const result = simulateMethodExecution(payload.method, payload.args)
  
  // Responder com resultado
  ws.send(JSON.stringify({
    id: Date.now().toString(),
    type: 'method_result',
    componentId,
    timestamp: Date.now(),
    replyTo: data.id,
    payload: { result, method: payload.method }
  }))
}

// Handler para solicitações de sincronização
function handleSyncRequest(ws: any, data: WebSocketMessage) {
  const { componentId } = data
  
  const currentState = componentStates.get(componentId)
  
  ws.send(JSON.stringify({
    id: Date.now().toString(),
    type: 'sync_response',
    componentId,
    timestamp: Date.now(),
    replyTo: data.id,
    payload: { state: currentState || null }
  }))
}

// Handler para heartbeat
function handleHeartbeat(ws: any, data: WebSocketMessage) {
  ws.send(JSON.stringify({
    id: Date.now().toString(),
    type: 'heartbeat_ack',
    componentId: data.componentId,
    timestamp: Date.now(),
    replyTo: data.id,
    payload: { status: 'alive' }
  }))
}

// Broadcast para todos os clientes conectados a um componente específico
function broadcastToComponent(componentId: string, message: any, excludeClientId?: string) {
  activeConnections.forEach((ws, clientId) => {
    if (clientId !== excludeClientId) {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        console.error(`[WebSocket] Error sending to client ${clientId}:`, error)
        activeConnections.delete(clientId)
      }
    }
  })
}

// Simular execução de métodos (implementação de exemplo)
function simulateMethodExecution(method: string, args: any[] = []) {
  switch (method) {
    case 'increment':
      return { success: true, value: (args[0] || 0) + 1 }
    case 'decrement':
      return { success: true, value: (args[0] || 0) - 1 }
    case 'reset':
      return { success: true, value: 0 }
    case 'setValue':
      return { success: true, value: args[0] || 0 }
    default:
      return { success: false, error: `Unknown method: ${method}` }
  }
}

// Função utilitária para obter estatísticas
export function getWebSocketStats() {
  return {
    activeConnections: activeConnections.size,
    activeComponents: componentStates.size,
    components: Array.from(componentStates.entries()).map(([id, state]) => ({
      id,
      mountedAt: state.mountedAt,
      lastActivity: state.lastActivity,
      version: state.version || 0
    }))
  }
}