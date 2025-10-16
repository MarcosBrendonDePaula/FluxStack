// 🔥 FluxStack Live Components - Shared Types

export interface LiveMessage {
  type: 'COMPONENT_MOUNT' | 'COMPONENT_UNMOUNT' |
  'COMPONENT_REHYDRATE' | 'COMPONENT_ACTION' | 'CALL_ACTION' |
  'ACTION_RESPONSE' | 'PROPERTY_UPDATE' | 'STATE_UPDATE' | 'STATE_REHYDRATED' |
  'ERROR' | 'BROADCAST' | 'FILE_UPLOAD_START' | 'FILE_UPLOAD_CHUNK' | 'FILE_UPLOAD_COMPLETE' |
  'COMPONENT_PING' | 'COMPONENT_PONG'
  componentId: string
  action?: string
  property?: string
  payload?: any
  timestamp?: number
  userId?: string
  room?: string
  // Request-Response system
  requestId?: string
  responseId?: string
  expectResponse?: boolean
}

export interface ComponentState {
  [key: string]: any
}

export interface LiveComponentInstance<TState = ComponentState, TActions = Record<string, Function>> {
  id: string
  state: TState
  call: <T extends keyof TActions>(action: T, ...args: any[]) => Promise<any>
  set: <K extends keyof TState>(property: K, value: TState[K]) => void
  loading: boolean
  errors: Record<string, string>
  connected: boolean
  room?: string
}

export interface WebSocketData {
  components: Map<string, any>
  userId?: string
  subscriptions: Set<string>
}

export interface ComponentDefinition<TState = ComponentState> {
  name: string
  initialState: TState
  component: new (initialState: TState, ws: any) => LiveComponent<TState>
}

export interface BroadcastMessage {
  type: string
  payload: any
  room?: string
  excludeUser?: string
}

// WebSocket Types for Client
export interface WebSocketMessage {
  type: string
  componentId?: string
  action?: string
  payload?: any
  timestamp?: number
  userId?: string
  room?: string
  // Request-Response system
  requestId?: string
  responseId?: string
  expectResponse?: boolean
}

export interface WebSocketResponse {
  type: 'MESSAGE_RESPONSE' | 'CONNECTION_ESTABLISHED' | 'ERROR' | 'BROADCAST' | 'ACTION_RESPONSE' | 'COMPONENT_MOUNTED' | 'COMPONENT_REHYDRATED' | 'STATE_UPDATE' | 'STATE_REHYDRATED' | 'FILE_UPLOAD_PROGRESS' | 'FILE_UPLOAD_COMPLETE' | 'FILE_UPLOAD_ERROR' | 'FILE_UPLOAD_START_RESPONSE' | 'COMPONENT_PONG'
  originalType?: string
  componentId?: string
  success?: boolean
  result?: any
  // Request-Response system
  requestId?: string
  responseId?: string
  error?: string
  timestamp?: number
  connectionId?: string
  payload?: any
  // File upload specific fields
  uploadId?: string
  chunkIndex?: number
  totalChunks?: number
  bytesUploaded?: number
  totalBytes?: number
  progress?: number
  filename?: string
  fileUrl?: string
  // Re-hydration specific fields
  signedState?: any
  oldComponentId?: string
  newComponentId?: string
}

// Hybrid Live Component Types
export interface HybridState<T> {
  data: T
  validation: StateValidation
  conflicts: StateConflict[]
  status: 'synced' | 'conflict' | 'disconnected'
}

export interface StateValidation {
  checksum: string
  version: number
  source: 'client' | 'server' | 'mount'
  timestamp: number
}

export interface StateConflict {
  property: string
  clientValue: any
  serverValue: any
  timestamp: number
  resolved: boolean
}

export interface HybridComponentOptions {
  fallbackToLocal?: boolean
  room?: string
  userId?: string
  autoMount?: boolean
  debug?: boolean
}

export abstract class LiveComponent<TState = ComponentState> {
  public readonly id: string
  public state: TState
  protected ws: any
  public room?: string
  public userId?: string
  public broadcastToRoom: (message: BroadcastMessage) => void = () => {} // Will be injected by registry

  constructor(initialState: TState, ws: any, options?: { room?: string; userId?: string }) {
    this.id = this.generateId()
    this.state = initialState
    this.ws = ws
    this.room = options?.room
    this.userId = options?.userId
  }

  // State management
  public setState(updates: Partial<TState> | ((prev: TState) => Partial<TState>)) {
    const newUpdates = typeof updates === 'function' ? updates(this.state) : updates
    this.state = { ...this.state, ...newUpdates }
    this.emit('STATE_UPDATE', { state: this.state })
  }

  // Execute action safely
  public async executeAction(action: string, payload: any): Promise<any> {
    try {
      // Check if method exists
      const method = (this as any)[action]
      if (typeof method !== 'function') {
        throw new Error(`Action '${action}' not found on component`)
      }

      // Execute method
      const result = await method.call(this, payload)
      return result
    } catch (error: any) {
      this.emit('ERROR', { 
        action, 
        error: error.message,
        stack: error.stack 
      })
      throw error
    }
  }

  // Send message to client
  protected emit(type: string, payload: any) {
    const message: LiveMessage = {
      type: type as any,
      componentId: this.id,
      payload,
      timestamp: Date.now(),
      userId: this.userId,
      room: this.room
    }

    if (this.ws && this.ws.send) {
      this.ws.send(JSON.stringify(message))
    }
  }

  // Broadcast to all clients in room
  protected broadcast(type: string, payload: any, excludeCurrentUser = false) {
    const message: BroadcastMessage = {
      type,
      payload,
      room: this.room,
      excludeUser: excludeCurrentUser ? this.userId : undefined
    }

    // This will be handled by the registry
    this.broadcastToRoom(message)
  }

  // Subscribe to room for multi-user features
  protected async subscribeToRoom(roomId: string) {
    this.room = roomId
    // Registry will handle the actual subscription
  }

  // Unsubscribe from room
  protected async unsubscribeFromRoom() {
    this.room = undefined
    // Registry will handle the actual unsubscription
  }

  // Generate unique ID
  private generateId(): string {
    return `live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Cleanup when component is destroyed
  public destroy() {
    this.unsubscribeFromRoom()
    // Override in subclasses for custom cleanup
  }

  // Get serializable state for client
  public getSerializableState(): TState {
    return this.state
  }
}

// Utility types for better TypeScript experience
export type ComponentActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never
}

export type ComponentProps<T extends LiveComponent> = T extends LiveComponent<infer TState> ? TState : never

export type ActionParameters<T, K extends keyof T> = T[K] extends (...args: infer P) => any ? P : never

export type ActionReturnType<T, K extends keyof T> = T[K] extends (...args: any[]) => infer R ? R : never

// File Upload Types for Chunked WebSocket Upload
export interface FileChunkData {
  uploadId: string
  filename: string
  fileType: string
  fileSize: number
  chunkIndex: number
  totalChunks: number
  chunkSize: number
  data: string // Base64 encoded chunk data
  hash?: string // Optional chunk hash for verification
}

export interface FileUploadStartMessage {
  type: 'FILE_UPLOAD_START'
  componentId: string
  uploadId: string
  filename: string
  fileType: string
  fileSize: number
  chunkSize?: number // Optional, defaults to 64KB
  requestId?: string
}

export interface FileUploadChunkMessage {
  type: 'FILE_UPLOAD_CHUNK'
  componentId: string
  uploadId: string
  chunkIndex: number
  totalChunks: number
  data: string // Base64 encoded chunk
  hash?: string
  requestId?: string
}

export interface FileUploadCompleteMessage {
  type: 'FILE_UPLOAD_COMPLETE'
  componentId: string
  uploadId: string
  requestId?: string
}

export interface FileUploadProgressResponse {
  type: 'FILE_UPLOAD_PROGRESS'
  componentId: string
  uploadId: string
  chunkIndex: number
  totalChunks: number
  bytesUploaded: number
  totalBytes: number
  progress: number // 0-100
  requestId?: string
  timestamp: number
}

export interface FileUploadCompleteResponse {
  type: 'FILE_UPLOAD_COMPLETE'
  componentId: string
  uploadId: string
  success: boolean
  filename?: string
  fileUrl?: string
  error?: string
  requestId?: string
  timestamp: number
}

// File Upload Manager for handling uploads
export interface ActiveUpload {
  uploadId: string
  componentId: string
  filename: string
  fileType: string
  fileSize: number
  totalChunks: number
  receivedChunks: Map<number, string>
  startTime: number
  lastChunkTime: number
  tempFilePath?: string
}