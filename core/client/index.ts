// 🔥 FluxStack Client Core - Main Export

// Live Components Provider (Singleton WebSocket Connection)
export {
  LiveComponentsProvider,
  useLiveComponents,
  // Deprecated exports for backward compatibility
  WebSocketProvider,
  useWebSocketContext
} from './LiveComponentsProvider'
export type {
  LiveComponentsProviderProps,
  LiveComponentsContextValue,
  // Deprecated types for backward compatibility
  WebSocketProviderProps,
  WebSocketContextValue
} from './LiveComponentsProvider'

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