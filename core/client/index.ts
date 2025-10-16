// 🔥 FluxStack Client Core - Main Export

// WebSocket Provider (Singleton Connection)
export { WebSocketProvider, useWebSocketContext } from './WebSocketProvider'
export type { WebSocketProviderProps, WebSocketContextValue } from './WebSocketProvider'

// Hooks
export { useWebSocket } from './hooks/useWebSocket'
export { useHybridLiveComponent } from './hooks/useHybridLiveComponent'
export { useChunkedUpload } from './hooks/useChunkedUpload'
export { StateValidator } from './hooks/state-validator'

// Re-export types from core/types/types.ts for convenience
export type {
  // Live Components types
  LiveMessage,
  ComponentState,
  LiveComponentInstance,
  WebSocketData,
  ComponentDefinition,
  BroadcastMessage,
  LiveComponent,
  
  // WebSocket types
  WebSocketMessage,
  WebSocketResponse,
  
  // Hybrid Live Component types
  HybridState,
  StateValidation,
  StateConflict,
  HybridComponentOptions,
  
  // File Upload types
  FileChunkData,
  FileUploadStartMessage,
  FileUploadChunkMessage,
  FileUploadCompleteMessage,
  FileUploadProgressResponse,
  FileUploadCompleteResponse,
  ActiveUpload,
  
  // Utility types
  ComponentActions,
  ComponentProps,
  ActionParameters,
  ActionReturnType
} from '../types/types'

// Hook return types
export type { UseHybridLiveComponentReturn } from './hooks/useHybridLiveComponent'