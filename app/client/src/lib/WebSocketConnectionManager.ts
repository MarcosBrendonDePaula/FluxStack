/**
 * WebSocket Connection Manager
 * 
 * Gerenciador centralizado de conexão WebSocket único para todos os Live Components.
 * Implementa multiplexing para reduzir o número de conexões e melhorar performance.
 */

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

interface WebSocketMessage {
  id: string
  type: string
  componentId: string
  timestamp: number
  payload: any
  replyTo?: string
}

interface ComponentSubscription {
  componentId: string
  handlers: {
    onMessage?: (message: WebSocketMessage) => void
    onStateChange?: (state: ConnectionState) => void
    onError?: (error: string) => void
  }
}

export class WebSocketConnectionManager {
  private static instance: WebSocketConnectionManager
  private ws: WebSocket | null = null
  private connectionState: ConnectionState = 'disconnected'
  private subscriptions = new Map<string, ComponentSubscription>()
  private messageQueue: WebSocketMessage[] = []
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private clientId = ''

  private constructor() {}

  static getInstance(): WebSocketConnectionManager {
    if (!WebSocketConnectionManager.instance) {
      WebSocketConnectionManager.instance = new WebSocketConnectionManager()
    }
    return WebSocketConnectionManager.instance
  }

  /**
   * Conectar um componente ao WebSocket
   */
  connect(componentId: string, handlers: ComponentSubscription['handlers']) {
    console.log(`[WSManager] Registering component: ${componentId}`)
    
    // Registrar subscription do componente
    this.subscriptions.set(componentId, { componentId, handlers })

    // Se é a primeira conexão E não está conectando/conectado, estabelecer WebSocket
    if (this.subscriptions.size === 1 && this.connectionState === 'disconnected') {
      this.establishConnection()
    } else if (this.connectionState === 'connected') {
      // Se já conectado, montar componente imediatamente
      this.mountComponent(componentId)
    } else if (this.connectionState === 'connecting') {
      // Se está conectando, aguardar conexão para montar
      console.log(`[WSManager] Component ${componentId} waiting for connection`)
    }

    // Notificar componente sobre estado atual
    handlers.onStateChange?.(this.connectionState)
  }

  /**
   * Desconectar um componente
   */
  disconnect(componentId: string) {
    console.log(`[WSManager] Unregistering component: ${componentId}`)
    
    // Desmontar componente no servidor
    if (this.connectionState === 'connected') {
      this.sendMessage({
        type: 'component_unmount',
        componentId,
        payload: { reason: 'component_destroyed' }
      })
    }

    // Remover subscription
    this.subscriptions.delete(componentId)

    // Se não há mais componentes, fechar conexão
    if (this.subscriptions.size === 0) {
      this.closeConnection()
    }
  }

  /**
   * Enviar mensagem para o servidor
   */
  sendMessage(partial: Partial<WebSocketMessage>): Promise<void> {
    const message: WebSocketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...partial
    } as WebSocketMessage

    if (this.connectionState === 'connected' && this.ws) {
      this.ws.send(JSON.stringify(message))
      return Promise.resolve()
    } else {
      // Enfileirar mensagem se não conectado
      this.messageQueue.push(message)
      console.log(`[WSManager] Message queued for ${message.componentId}: ${message.type}`)
      return Promise.reject(new Error('WebSocket not connected'))
    }
  }

  /**
   * Obter estado da conexão
   */
  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  /**
   * Obter ID do cliente
   */
  getClientId(): string {
    return this.clientId
  }

  /**
   * Estabelecer conexão WebSocket
   */
  private establishConnection() {
    // Proteção contra múltiplas conexões
    if (this.ws?.readyState === WebSocket.OPEN || this.connectionState === 'connecting') {
      console.log(`[WSManager] Connection already exists or connecting (state: ${this.connectionState})`)
      return
    }

    console.log('[WSManager] Establishing WebSocket connection...')
    this.setConnectionState('connecting')

    const wsUrl = `ws://localhost:3000/api/ws/live`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log(`[WSManager] WebSocket connected (${this.subscriptions.size} components waiting)`)
      this.setConnectionState('connected')
      this.reconnectAttempts = 0
      
      // Processar fila de mensagens
      this.processMessageQueue()
      
      // Montar todos os componentes subscritos
      this.subscriptions.forEach((_, componentId) => {
        console.log(`[WSManager] Mounting waiting component: ${componentId}`)
        this.mountComponent(componentId)
      })
      
      // Iniciar heartbeat
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('[WSManager] Error parsing message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('[WSManager] WebSocket closed:', event.code, event.reason)
      this.setConnectionState('disconnected')
      this.stopHeartbeat()
      
      // Auto-reconnect se há componentes conectados
      if (this.subscriptions.size > 0 && !event.wasClean) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('[WSManager] WebSocket error:', error)
      this.setConnectionState('error')
      this.notifyError('WebSocket connection failed')
    }
  }

  /**
   * Processar mensagem recebida
   */
  private handleMessage(message: WebSocketMessage) {
    // Mensagens globais (sistema)
    if (message.componentId === 'system') {
      switch (message.type) {
        case 'connection_established':
          this.clientId = message.payload.clientId
          console.log(`[WSManager] Client ID: ${this.clientId}`)
          break
      }
      return
    }

    // Encaminhar mensagem para componente específico
    const subscription = this.subscriptions.get(message.componentId)
    if (subscription) {
      subscription.handlers.onMessage?.(message)
    }

    // Broadcast para componentes que precisam sincronizar
    if (message.type === 'state_synchronized') {
      this.subscriptions.forEach((sub, componentId) => {
        if (componentId !== message.componentId) {
          // Notificar outros componentes sobre mudança de estado
          sub.handlers.onMessage?.(message)
        }
      })
    }
  }

  /**
   * Montar componente no servidor
   */
  private mountComponent(componentId: string) {
    this.sendMessage({
      type: 'component_mount',
      componentId,
      payload: {
        componentId,
        componentType: 'LiveComponent',
        mountedAt: Date.now()
      }
    })
  }

  /**
   * Processar fila de mensagens
   */
  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.connectionState === 'connected') {
      const message = this.messageQueue.shift()!
      this.ws?.send(JSON.stringify(message))
      console.log(`[WSManager] Sent queued message: ${message.type}`)
    }
  }

  /**
   * Alterar estado da conexão
   */
  private setConnectionState(state: ConnectionState) {
    if (this.connectionState !== state) {
      console.log(`[WSManager] Connection state: ${this.connectionState} → ${state}`)
      this.connectionState = state
      
      // Notificar todos os componentes
      this.subscriptions.forEach(sub => {
        sub.handlers.onStateChange?.(state)
      })
    }
  }

  /**
   * Agendar reconnexão
   */
  private scheduleReconnect() {
    if (this.reconnectTimeout || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.setConnectionState('reconnecting')
    
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000)
    console.log(`[WSManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.reconnectAttempts++
      this.establishConnection()
    }, delay)
  }

  /**
   * Iniciar heartbeat
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage({
        type: 'heartbeat',
        componentId: 'system',
        payload: { timestamp: Date.now() }
      })
    }, 30000)
  }

  /**
   * Parar heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Fechar conexão
   */
  private closeConnection() {
    console.log('[WSManager] Closing WebSocket connection...')
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.setConnectionState('disconnected')
    this.clientId = ''
    this.reconnectAttempts = 0
  }

  /**
   * Notificar erro para todos os componentes
   */
  private notifyError(error: string) {
    this.subscriptions.forEach(sub => {
      sub.handlers.onError?.(error)
    })
  }

  /**
   * Obter estatísticas da conexão
   */
  getStats() {
    return {
      connectionState: this.connectionState,
      connectedComponents: this.subscriptions.size,
      queuedMessages: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
      clientId: this.clientId,
      components: Array.from(this.subscriptions.keys())
    }
  }
}

// Export singleton instance
export const wsManager = WebSocketConnectionManager.getInstance()