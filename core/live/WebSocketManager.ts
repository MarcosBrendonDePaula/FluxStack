/**
 * WebSocketManager
 * 
 * Advanced WebSocket communication system for FluxLive components.
 * Handles connection management, message queuing, reconnection logic,
 * and real-time bidirectional communication between client and server.
 */

import { ComponentIdentity } from './types'
import { Logger } from '../utils/logger'

/**
 * WebSocket message types
 */
export type MessageType = 
  | 'component_mount'
  | 'component_unmount'
  | 'state_update'
  | 'method_call'
  | 'event_emit'
  | 'sync_request'
  | 'error'
  | 'heartbeat'

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  id: string
  type: MessageType
  componentId: string
  timestamp: number
  payload: any
  replyTo?: string
  clientId?: string
}

/**
 * Connection state
 */
export type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

/**
 * WebSocket configuration
 */
export interface WebSocketConfig {
  /** Server WebSocket URL */
  url: string
  
  /** Reconnection attempts */
  maxReconnectAttempts: number
  
  /** Reconnection delay (ms) */
  reconnectDelay: number
  
  /** Heartbeat interval (ms) */
  heartbeatInterval: number
  
  /** Message queue size limit */
  maxQueueSize: number
  
  /** Connection timeout (ms) */
  connectionTimeout: number
  
  /** Enable message batching */
  enableBatching: boolean
  
  /** Batch size for message grouping */
  batchSize: number
  
  /** Batch timeout (ms) */
  batchTimeout: number
}

/**
 * Message handler function type
 */
export type MessageHandler = (message: WebSocketMessage) => void | Promise<void>

/**
 * Connection event handler function type
 */
export type ConnectionEventHandler = (state: ConnectionState, error?: Error) => void

/**
 * WebSocket statistics
 */
export interface WebSocketStats {
  /** Current connection state */
  connectionState: ConnectionState
  
  /** Messages sent */
  messagesSent: number
  
  /** Messages received */
  messagesReceived: number
  
  /** Failed messages */
  failedMessages: number
  
  /** Reconnection attempts */
  reconnectAttempts: number
  
  /** Queue size */
  queueSize: number
  
  /** Last heartbeat timestamp */
  lastHeartbeat: number
  
  /** Connection uptime */
  uptime: number
  
  /** Average latency */
  averageLatency: number
}

/**
 * WebSocketManager
 * 
 * Manages WebSocket connections with advanced features including
 * automatic reconnection, message queuing, batching, and heartbeat monitoring.
 */
export class WebSocketManager {
  private static instance: WebSocketManager
  
  /** WebSocket connection */
  private ws: WebSocket | null = null
  
  /** Configuration */
  private config: WebSocketConfig
  
  /** Logger instance */
  private logger: Logger
  
  /** Connection state */
  private connectionState: ConnectionState = 'disconnected'
  
  /** Message queue for offline messages */
  private messageQueue: WebSocketMessage[] = []
  
  /** Message handlers */
  private messageHandlers = new Map<MessageType, Set<MessageHandler>>()
  
  /** Connection event handlers */
  private connectionHandlers = new Set<ConnectionEventHandler>()
  
  /** Pending messages awaiting response */
  private pendingMessages = new Map<string, {
    resolve: (value: any) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }>()
  
  /** Reconnection timer */
  private reconnectTimer: NodeJS.Timeout | null = null
  
  /** Heartbeat timer */
  private heartbeatTimer: NodeJS.Timeout | null = null
  
  /** Batch timer */
  private batchTimer: NodeJS.Timeout | null = null
  
  /** Batched messages */
  private batchedMessages: WebSocketMessage[] = []
  
  /** Connection statistics */
  private stats: WebSocketStats = {
    connectionState: 'disconnected',
    messagesSent: 0,
    messagesReceived: 0,
    failedMessages: 0,
    reconnectAttempts: 0,
    queueSize: 0,
    lastHeartbeat: 0,
    uptime: 0,
    averageLatency: 0
  }
  
  /** Connection start time */
  private connectionStartTime = 0
  
  /** Latency samples */
  private latencySamples: number[] = []
  
  constructor(config: Partial<WebSocketConfig> = {}, logger?: Logger) {
    this.logger = logger || console as any
    
    this.config = {
      url: 'ws://localhost:3000/ws',
      maxReconnectAttempts: 10,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      maxQueueSize: 100,
      connectionTimeout: 10000,
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 100,
      ...config
    }
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<WebSocketConfig>, logger?: Logger): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(config, logger)
    }
    return WebSocketManager.instance
  }
  
  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return
    }
    
    this.setConnectionState('connecting')
    this.connectionStartTime = Date.now()
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url)
        
        const connectionTimeout = setTimeout(() => {
          this.ws?.close()
          reject(new Error('Connection timeout'))
        }, this.config.connectionTimeout)
        
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout)
          this.setConnectionState('connected')
          this.stats.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          this.logger.info('WebSocket connected', { url: this.config.url })
          resolve()
        }
        
        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout)
          this.handleDisconnection(event)
        }
        
        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout)
          this.setConnectionState('error')
          this.logger.error('WebSocket error:', error)
          reject(new Error('WebSocket connection failed'))
        }
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }
        
      } catch (error) {
        this.setConnectionState('error')
        reject(error)
      }
    })
  }
  
  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearTimers()
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.setConnectionState('disconnected')
    this.connectionStartTime = 0
  }
  
  /**
   * Send message to server
   */
  async send(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): Promise<any> {
    const fullMessage: WebSocketMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      ...message
    }
    
    // If expecting a response, return a promise
    if (this.expectsResponse(message.type)) {
      return this.sendWithResponse(fullMessage)
    }
    
    // Otherwise, send fire-and-forget
    this.sendMessage(fullMessage)
  }
  
  /**
   * Send message and wait for response
   */
  private async sendWithResponse(message: WebSocketMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(message.id)
        reject(new Error(`Message timeout: ${message.id}`))
      }, 10000) // 10 second timeout
      
      this.pendingMessages.set(message.id, {
        resolve,
        reject,
        timeout
      })
      
      this.sendMessage(message)
    })
  }
  
  /**
   * Send message immediately or queue if disconnected
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.connectionState === 'connected' && this.ws) {
      if (this.config.enableBatching && this.shouldBatch(message)) {
        this.addToBatch(message)
      } else {
        this.sendImmediately(message)
      }
    } else {
      this.queueMessage(message)
    }
  }
  
  /**
   * Send message immediately
   */
  private sendImmediately(message: WebSocketMessage): void {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message))
        this.stats.messagesSent++
        this.logger.debug('WebSocket message sent', {
          type: message.type,
          componentId: message.componentId
        })
      } else {
        this.queueMessage(message)
      }
    } catch (error) {
      this.stats.failedMessages++
      this.logger.error('Failed to send WebSocket message:', error)
      this.queueMessage(message)
    }
  }
  
  /**
   * Add message to batch
   */
  private addToBatch(message: WebSocketMessage): void {
    this.batchedMessages.push(message)
    
    if (this.batchedMessages.length >= this.config.batchSize) {
      this.flushBatch()
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch()
      }, this.config.batchTimeout)
    }
  }
  
  /**
   * Flush batched messages
   */
  private flushBatch(): void {
    if (this.batchedMessages.length === 0) return
    
    const batchMessage: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'batch' as MessageType,
      componentId: 'system',
      timestamp: Date.now(),
      payload: {
        messages: this.batchedMessages
      }
    }
    
    this.sendImmediately(batchMessage)
    this.batchedMessages = []
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
  }
  
  /**
   * Queue message for later sending
   */
  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      this.messageQueue.shift() // Remove oldest message
    }
    
    this.messageQueue.push(message)
    this.stats.queueSize = this.messageQueue.length
  }
  
  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!
      this.sendMessage(message)
    }
    
    this.stats.queueSize = 0
  }
  
  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      this.stats.messagesReceived++
      
      // Handle response to pending message
      if (message.replyTo && this.pendingMessages.has(message.replyTo)) {
        const pending = this.pendingMessages.get(message.replyTo)!
        clearTimeout(pending.timeout)
        this.pendingMessages.delete(message.replyTo)
        
        if (message.type === 'error') {
          pending.reject(new Error(message.payload.error))
        } else {
          pending.resolve(message.payload)
        }
        return
      }
      
      // Handle heartbeat response
      if (message.type === 'heartbeat') {
        const latency = Date.now() - message.timestamp
        this.updateLatency(latency)
        this.stats.lastHeartbeat = Date.now()
        return
      }
      
      // Dispatch to message handlers
      const handlers = this.messageHandlers.get(message.type)
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message)
          } catch (error) {
            this.logger.error('Message handler error:', error)
          }
        })
      }
      
      this.logger.debug('WebSocket message received', {
        type: message.type,
        componentId: message.componentId
      })
      
    } catch (error) {
      this.logger.error('Failed to parse WebSocket message:', error)
    }
  }
  
  /**
   * Handle disconnection
   */
  private handleDisconnection(event: CloseEvent): void {
    this.clearTimers()
    this.setConnectionState('disconnected')
    
    this.logger.warn('WebSocket disconnected', {
      code: event.code,
      reason: event.reason
    })
    
    // Attempt reconnection if not intentional disconnect
    if (event.code !== 1000 && this.stats.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.attemptReconnection()
    }
  }
  
  /**
   * Attempt reconnection
   */
  private attemptReconnection(): void {
    this.stats.reconnectAttempts++
    this.setConnectionState('reconnecting')
    
    const delay = this.config.reconnectDelay * Math.pow(2, this.stats.reconnectAttempts - 1)
    
    this.logger.info(`Attempting reconnection ${this.stats.reconnectAttempts}/${this.config.maxReconnectAttempts}`, {
      delay
    })
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        this.logger.error('Reconnection failed:', error)
        
        if (this.stats.reconnectAttempts >= this.config.maxReconnectAttempts) {
          this.setConnectionState('error')
          this.logger.error('Max reconnection attempts reached')
        } else {
          this.attemptReconnection()
        }
      })
    }, delay)
  }
  
  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.send({
          type: 'heartbeat',
          componentId: 'system',
          payload: { timestamp: Date.now() }
        }).catch(() => {
          // Heartbeat failed, connection might be lost
        })
      }
    }, this.config.heartbeatInterval)
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
  }
  
  /**
   * Set connection state and notify handlers
   */
  private setConnectionState(state: ConnectionState, error?: Error): void {
    const previousState = this.connectionState
    this.connectionState = state
    this.stats.connectionState = state
    
    if (state === 'connected' && previousState !== 'connected') {
      this.stats.uptime = Date.now() - this.connectionStartTime
    }
    
    this.connectionHandlers.forEach(handler => {
      try {
        handler(state, error)
      } catch (err) {
        this.logger.error('Connection handler error:', err)
      }
    })
  }
  
  /**
   * Update latency statistics
   */
  private updateLatency(latency: number): void {
    this.latencySamples.push(latency)
    
    // Keep only last 10 samples
    if (this.latencySamples.length > 10) {
      this.latencySamples.shift()
    }
    
    this.stats.averageLatency = this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length
  }
  
  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Check if message type expects a response
   */
  private expectsResponse(type: MessageType): boolean {
    return ['method_call', 'sync_request'].includes(type)
  }
  
  /**
   * Check if message should be batched
   */
  private shouldBatch(message: WebSocketMessage): boolean {
    return ['state_update', 'event_emit'].includes(message.type)
  }
  
  /**
   * Add message handler
   */
  onMessage(type: MessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    
    this.messageHandlers.get(type)!.add(handler)
    
    return () => {
      const handlers = this.messageHandlers.get(type)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.messageHandlers.delete(type)
        }
      }
    }
  }
  
  /**
   * Add connection event handler
   */
  onConnectionChange(handler: ConnectionEventHandler): () => void {
    this.connectionHandlers.add(handler)
    
    return () => {
      this.connectionHandlers.delete(handler)
    }
  }
  
  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState
  }
  
  /**
   * Get WebSocket statistics
   */
  getStats(): WebSocketStats {
    return { ...this.stats }
  }
  
  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected'
  }
  
  /**
   * Shutdown WebSocket manager
   */
  shutdown(): void {
    this.disconnect()
    this.messageHandlers.clear()
    this.connectionHandlers.clear()
    this.messageQueue = []
    this.batchedMessages = []
    
    // Clear pending messages
    this.pendingMessages.forEach(({ reject, timeout }) => {
      clearTimeout(timeout)
      reject(new Error('WebSocket manager shutdown'))
    })
    this.pendingMessages.clear()
    
    this.logger.info('WebSocketManager shutdown complete')
  }
}